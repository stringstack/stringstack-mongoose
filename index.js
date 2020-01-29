'use strict';

// doublescore isn't explicitly required, but it is a simple, lite weight utility we really love.
const __ = require( 'doublescore' );
const mongoose = require( 'mongoose' );

class MongoComponent {

  constructor( deps ) {

    // Tell StringStack/core you are dependent on config, so config initializes before your component.
    this._nconf = deps.get( 'config' );

    // we will define this in init(), after config.init() is called
    this._config = null;

    // Expose Schema reference
    this.Schema = mongoose.Schema;
    this.SchemaType = mongoose.SchemaType;

    // Connection cache
    this._connections = {};

  }

  init( done ) {

    // grab the config now that the nconf is initialized
    this._config = this._nconf.get( 'stringstack:mongoose' ) || {};

    done();

  }

  dinit( done ) {

    this._config = null;

    // disconnect all connections
    mongoose.disconnect( ( err ) => {
      done( err || null );
    } );

  }

  getConnection( connectionName, done ) {

    let config = this._config;

    if ( !config ) {
      return done( new Error( 'component not initialized' ) );
    }

    if ( !config.hasOwnProperty( connectionName ) ) {
      return done( new Error( 'connection not found' ) );
    }

    // check for cached connection
    if ( this._connections.hasOwnProperty( connectionName ) ) {

      done( null, this._connections[connectionName] ); // serve the cached connection

    } else {

      // Set default configs
      // These are based on disabling deprecated features in the underlying MongoDB driver.
      // See https://mongoosejs.com/docs/deprecations.html
      config = __( {
        host: null,
        options: {
          useCreateIndex: true,
          useFindAndModify: false,
          useNewUrlParser: true,
          useUnifiedTopology: true
        }
      } ).mixin( config [connectionName] );

      // minimal config validation
      if ( typeof config.host !== 'string' || config.host.trim().length < 1 ) {
        return done( new Error( 'host must be non-empty string' ) );
      }

      // make a new connection
      const conn = mongoose.createConnection( config.host, config.options, ( err ) => {

        // NOOOOOOOO!
        if ( err ) {
          return done( err );
        }

        this._connections[connectionName] = conn; // cache the connection

        done( null, conn );

      } );

    }

  }

}

module.exports = MongoComponent;
