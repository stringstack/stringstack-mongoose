'use strict';

const __ = require( 'doublescore' );
const async = require( 'async' );
const mongoose = require( 'mongoose' );
const SetupTestConfigComponent = require( './test.config' );

module.exports = {
  clearDatabases: function ( done ) {

    SetupTestConfigComponent.resetDefaultConfig();

    const databases = [];

    Object.entries( SetupTestConfigComponent.defaultConfig ).forEach( ( entry ) => {

      if ( entry[ 0 ] === 'mongo-3' ) {
        return;
      }

      databases.push( entry[ 1 ] );

    } );

    async.each( databases, ( database, done ) => {
      this.clearDatabase( database, done );
    }, done );

  },
  clearDatabase: function ( database, done ) {

    async.waterfall( [
      ( done ) => {

        // Set default configs
        // These are based on disabling deprecated features in the underlying MongoDB driver.
        // See https://mongoosejs.com/docs/deprecations.html
        database = __( {
          host: null,
          options: {
            useCreateIndex: true,
            useFindAndModify: false,
            useNewUrlParser: true,
            useUnifiedTopology: true
          }
        } ).mixin( database );

        const conn = mongoose.createConnection( database.host, database.options, ( err ) => {

          if ( err ) {
            return done( err );
          }

          done( null, conn );

        } );


      },
      ( connection, done ) => {
        this.clearDatabaseActions( connection, done );
      }
    ], done );

  },
  clearDatabaseActions: function ( connection, done ) {

    async.waterfall( [
      ( done ) => {
        connection.db.listCollections( {}, {
          nameOnly: true
        } ).toArray( done );
      },
      ( collections, done ) => {

        async.each( collections, ( collection, done ) => {

          if ( !collection || !collection.name || collection.type !== 'collection' ) {
            return done();
          }

          connection.db.collection( collection.name ).drop( done );

        }, done );

      }
    ], done );

  }
};
