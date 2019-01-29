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
      options: { useNewUrlParser: true }
    },
    'mongo-2': {
      host: 'mongodb://localhost:27018/test-database',
      options: { useNewUrlParser: true }
    },
    'mongo-3': {
      host: 'mongodb://localhost:27019/test-database', // this host doesn't exist
      options: { useNewUrlParser: true }
    }
  };

};
SetupTestConfigComponent.resetDefaultConfig();

module.exports = SetupTestConfigComponent;
