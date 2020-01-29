'use strict';

class SetupTestConfigComponent {

  constructor( deps ) {

    this._nconf = deps.inject( 'config' );

  }

  init( done ) {

    if ( SetupTestConfigComponent.defaultConfig ) {

      this._nconf.defaults( {
        stringstack: {
          mongoose: SetupTestConfigComponent.defaultConfig
        }
      } );

    } else {

      this._nconf.defaults( {} );

    }

    done();

  }

  dinit( done ) {

    done();

  }

}

SetupTestConfigComponent.resetDefaultConfig = function () {

  SetupTestConfigComponent.defaultConfig = {
    'mongo-1': {
      host: 'mongodb://localhost:27017/test-database',
      options: {
        connectTimeoutMS: 2000,
        socketTimeoutMS: 2000
      }
    },
    'mongo-2': {
      host: 'mongodb://localhost:27018/test-database',
      options: {
        connectTimeoutMS: 2000,
        socketTimeoutMS: 2000
      }
    },
    'mongo-3': {
      host: 'mongodb://localhost:27019/test-database', // this host doesn't exist
      options: {
        connectTimeoutMS: 2000,
        socketTimeoutMS: 2000
      }
    }
  };

};
SetupTestConfigComponent.resetDefaultConfig();

module.exports = SetupTestConfigComponent;
