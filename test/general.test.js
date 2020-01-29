'use strict';

const assert = require( 'assert' );
const async = require( 'async' );
const waitOn = require( 'wait-on' );
const testUtil = require( './lib/test.util' );

const SetupTestConfigComponent = require( './lib/test.config' );
const StringStackCore = require( '@stringstack/core' );

// lets you pull a component from the stack, do not use this pattern of accessing _loader outside of testing
let getComponentNative = function ( app, targetPath ) {
  return app._loader.get( 'app', targetPath );
};

let generateAppComponents = function () {

  // See documentation on how to use core to manage all your components:
  // https://www.npmjs.com/package/@stringstack/core
  let core = new StringStackCore();

  const App = core.createApp( {
    rootComponents: [
      './test/lib/test.config', // Ensures config loads before your component
      './index' // Includes your component
    ]
  } );

  const app = new App( 'test' ); // Instantiates all dependencies

  const component = getComponentNative( app, './index' );

  return [ app, component ];

};

describe( 'stringstack', function () {
  describe( 'mongoose', function () {

    before( function ( done ) {

      // don't do anything until the mongo containers have started up Mongo, and Mongo is listening
      waitOn( {
        resources: [
          'tcp:127.0.0.1:27017',
          'tcp:127.0.0.1:27018'
        ],
        interval: 250,
        timeout: 10000
      }, done );

    } );

    beforeEach( function ( done ) {
      testUtil.clearDatabases( done ); // resets the databases, basically drops all collections
    } );

    it( 'should instantiate, init and dinit, and init and dinit again', function ( done ) {

      let app = null;
      let component = null;

      async.series( [
        ( done ) => {

          try {

            // Set config for each test like this. Do it before you call new StringStackCode();
            SetupTestConfigComponent.defaultConfig = {
              some: 'values',
              here: {
                check: true
              }
            };

            [ app, component ] = generateAppComponents();

            assert( component, 'component should be available' );

          } catch ( e ) {
            return done( e );
          }

          done();

        },
        ( done ) => {

          try {

            // do not use the pattern of accessing _config externally outside of testing
            assert.strictEqual( component._config, null, 'component config should be null' );

          } catch ( e ) {
            return done( e );
          }

          done();

        },
        ( done ) => {
          try {
            app.init( done ); // Initializes all dependencies
          } catch ( e ) {
            return done( e );
          }
        },
        ( done ) => {

          try {

            assert.equal( JSON.stringify( component._config, null, 4 ),
              JSON.stringify( SetupTestConfigComponent.defaultConfig, null, 4 ),
              'component config should be set' );

          } catch ( e ) {
            return done( e );
          }

          done();

        },
        ( done ) => {
          try {
            app.dinit( done ); // D-initializes all dependencies
          } catch ( e ) {
            return done( e );
          }
        },
        ( done ) => {

          try {

            assert.strictEqual( component._config, null, 'component config should be null' );

          } catch ( e ) {
            return done( e );
          }

          done();

        },
        ( done ) => {
          try {
            app.init( done ); // Initializes all dependencies
          } catch ( e ) {
            return done( e );
          }
        },
        ( done ) => {

          try {

            assert.equal( JSON.stringify( component._config, null, 4 ),
              JSON.stringify( SetupTestConfigComponent.defaultConfig, null, 4 ),
              'component config should be set' );

          } catch ( e ) {
            return done( e );
          }

          done();

        },
        ( done ) => {
          try {
            app.dinit( done ); // D-initializes all dependencies
          } catch ( e ) {
            return done( e );
          }
        },
        ( done ) => {

          try {

            assert.strictEqual( component._config, null, 'component config should be null' );

          } catch ( e ) {
            return done( e );
          }

          done();

        }
      ], done );

    } );

    // create more tests for your component. you should have lots
    it( 'should get a connection and provide access to create/use models', function ( done ) {

      this.timeout( 10000 );

      let app, component, Schema;

      try {

        [ app, component ] = generateAppComponents();

        Schema = component.Schema;

      } catch ( e ) {
        return done( e );
      }

      async.waterfall( [
        ( done ) => {
          app.init( done );
        },
        ( done ) => {
          component.getConnection( 'mongo-1', done );
        },
        ( connection, done ) => {


          const docSchema = new Schema( {
            name: String,
            date: { type: Date, default: Date.now }
          } );

          docSchema.index( { date: -1, name: 1 } );

          let Doc = connection.model( 'doc', docSchema );

          Doc.find( {}, done );

        },
        ( results, done ) => {

          try {
            assert.strictEqual( Array.isArray( results ), true, 'results not an array' );
            assert.strictEqual( results.length, 0, 'results not empty' );
          } catch ( e ) {
            return done( e );
          }

          done();
        },
        ( done ) => {
          app.dinit( done );
        }
      ], done );


    } );

    it( 'should store and retrieve documents when initialized', function ( done ) {

      this.timeout( 10000 );

      let app, component, Schema;

      try {

        [ app, component ] = generateAppComponents();

        Schema = component.Schema;

      } catch ( e ) {
        return done( e );
      }

      async.waterfall( [
        ( done ) => {
          app.init( done );
        },
        ( done ) => {
          app.dinit( done );
        },
        ( done ) => {
          app.init( done );
        },
        ( done ) => {
          component.getConnection( 'mongo-1', done );
        },
        ( connection, done ) => {

          const docSchema = new Schema( {
            name: String,
            date: { type: Date, default: Date.now }
          } );

          docSchema.index( { date: -1, name: 1 } );

          let Doc = connection.model( 'doc', docSchema );

          done( null, Doc );

        },
        ( Doc, done ) => {

          let inputDocs = [
            {
              name: 'doc-1'
            },
            {
              name: 'doc-2'
            },
            {
              name: 'doc-3'
            },
            {
              name: 'doc-4'
            },
            {
              name: 'doc-5'
            }
          ];

          async.waterfall( [
            ( done ) => {

              async.series( {
                saveDocs: ( done ) => {
                  async.mapSeries( inputDocs, ( doc, done ) => {

                    doc = new Doc( doc );

                    // ensure we can sort by time
                    setTimeout( () => {
                      doc.save( done );
                    }, 1 );

                  }, done );
                },
                findDocs: ( done ) => {
                  Doc
                    .find( {} )
                    .sort( {
                      date: 1
                    } )
                    .exec( done );
                }
              }, done );

            },
            ( parts, done ) => {

              const saveDocs = parts.saveDocs;
              const findDocs = parts.findDocs;

              try {

                assert.strictEqual( Array.isArray( saveDocs ), true, 'saveDocs not an array' );
                assert.strictEqual( saveDocs.length, inputDocs.length, 'saveDocs correct length' );

                assert.strictEqual( Array.isArray( findDocs ), true, 'findDocs not an array' );
                assert.strictEqual( findDocs.length, inputDocs.length, 'findDocs correct length' );

                saveDocs.forEach( ( inputDoc, i ) => {

                  assert.strictEqual( inputDoc.name, saveDocs[i].name, 'saveDoc has wrong name field' );
                  assert.strictEqual( inputDoc.name, findDocs[i].name, 'findDoc has wrong name field' );

                } );

              } catch ( e ) {
                return done( e );
              }

              done();
            }
          ], done );

        },
        ( done ) => {
          app.dinit( done );
        }
      ], done );

    } );


    it( 'should isolate connections by name correctly', function ( done ) {

      this.timeout( 10000 );

      let app, component, Schema;

      try {

        [ app, component ] = generateAppComponents();

        Schema = component.Schema;

      } catch ( e ) {
        return done( e );
      }

      async.waterfall( [
        ( done ) => {
          app.init( done );
        },
        ( done ) => {
          async.parallel( {
            mongo1: ( done ) => {
              component.getConnection( 'mongo-1', done );
            },
            mongo2: ( done ) => {
              component.getConnection( 'mongo-2', done );
            }
          }, done );
        },
        ( connections, done ) => {

          const docSchema = new Schema( {
            name: String,
            date: { type: Date, default: Date.now }
          } );

          docSchema.index( { date: -1, name: 1 } );

          let Doc1 = connections.mongo1.model( 'doc', docSchema );
          let Doc2 = connections.mongo2.model( 'doc', docSchema );

          done( null, [ Doc1, Doc2 ] );

        },
        ( Docs, done ) => {

          let inputDocs1 = [
            {
              name: 'doc-1'
            },
            {
              name: 'doc-2'
            },
            {
              name: 'doc-3'
            },
            {
              name: 'doc-4'
            },
            {
              name: 'doc-5'
            }
          ];

          let inputDocs2 = [
            {
              name: 'doc-6'
            },
            {
              name: 'doc-7'
            },
            {
              name: 'doc-8'
            },
            {
              name: 'doc-9'
            },
            {
              name: 'doc-10'
            }
          ];

          async.waterfall( [
            ( done ) => {

              async.parallel( [
                ( done ) => {

                  async.mapSeries( inputDocs1, ( doc, done ) => {

                    doc = new Docs[0]( doc );

                    // ensure we can sort by time
                    setTimeout( () => {
                      doc.save( done );
                    }, 1 );

                  }, done );
                },
                ( done ) => {
                  async.mapSeries( inputDocs2, ( doc, done ) => {

                    doc = new Docs[1]( doc );

                    // ensure we can sort by time
                    setTimeout( () => {
                      doc.save( done );
                    }, 1 );

                  }, done );
                }
              ], done );

            },
            ( results, done ) => {

              async.parallel( {
                findDocs1: ( done ) => {

                  Docs[0]
                    .find( {} )
                    .sort( {
                      date: 1
                    } )
                    .exec( done );

                },
                findDocs2: ( done ) => {

                  Docs[1]
                    .find( {} )
                    .sort( {
                      date: 1
                    } )
                    .exec( done );

                }
              }, done );

            },
            ( results, done ) => {

              const findDocs1 = results.findDocs1;
              const findDocs2 = results.findDocs2;

              try {

                assert.strictEqual( Array.isArray( findDocs1 ), true, 'findDocs1 not an array' );
                assert.strictEqual( findDocs1.length, inputDocs1.length, 'findDocs1 correct length' );
                inputDocs1.forEach( ( inputDoc, i ) => {
                  assert.strictEqual( findDocs1[i].name, inputDoc.name, 'findDocs1 has wrong name field' );
                } );

                assert.strictEqual( Array.isArray( findDocs2 ), true, 'findDocs2 not an array' );
                assert.strictEqual( findDocs2.length, inputDocs2.length, 'findDocs2 correct length' );
                inputDocs2.forEach( ( inputDoc, i ) => {
                  assert.strictEqual( findDocs2[i].name, inputDoc.name, 'findDocs2 has wrong name field' );
                } );

              } catch ( e ) {
                return done( e );
              }

              done();

            }
          ], done );

        },
        ( done ) => {
          app.dinit( done );
        }
      ], done );

    } );

    // This error no longer triggers with useUnifiedTopology: true
    // See https://mongoosejs.com/docs/deprecations.html
    // it( 'should return an error on failure to connect', function ( done ) {
    //
    //   this.timeout( 10000 );
    //
    //   let app, component;
    //
    //   try {
    //     [ app, component ] = generateAppComponents();
    //   } catch ( e ) {
    //     return done( e );
    //   }
    //
    //   async.waterfall( [
    //     ( done ) => {
    //       app.init( done );
    //     },
    //     ( done ) => {
    //       component.getConnection( 'mongo-3', ( err ) => {
    //
    //         try {
    //           assert.ok( err instanceof Error, 'expected error' );
    //           assert.strictEqual( typeof err.message, 'string', 'error message not a string' );
    //           assert.ok( err.message.match( /failed to connect to server/ ), 'error message not correct' );
    //         } catch ( e ) {
    //           return done( e );
    //         }
    //
    //         done();
    //       } );
    //     },
    //     ( done ) => {
    //       app.dinit( done );
    //     }
    //   ], done );
    //
    // } );

    it( 'should return an error on loading non-existing connection name', function ( done ) {

      this.timeout( 10000 );

      let app, component;

      try {
        [ app, component ] = generateAppComponents();
      } catch ( e ) {
        return done( e );
      }

      async.waterfall( [
        ( done ) => {
          app.init( done );
        },
        ( done ) => {
          component.getConnection( 'mongo-does-not-exist', ( err ) => {

            try {
              assert.ok( err instanceof Error, 'expected error' );
              assert.strictEqual( err.message, 'connection not found', 'error message not correct' );
            } catch ( e ) {
              return done( e );
            }

            done();
          } );
        },
        ( done ) => {
          app.dinit( done );
        }
      ], done );

    } );

    it( 'should init correctly and return correct error when no config supplied', function ( done ) {

      this.timeout( 10000 );

      // blank out config
      SetupTestConfigComponent.defaultConfig = false;

      let app, component;

      try {
        [ app, component ] = generateAppComponents();
      } catch ( e ) {
        return done( e );
      }

      async.waterfall( [
        ( done ) => {
          app.init( done );
        },
        ( done ) => {
          component.getConnection( 'mongo-1', ( err ) => {

            try {
              assert.ok( err instanceof Error, 'expected error' );
              assert.strictEqual( err.message, 'connection not found', 'error message not correct' );
            } catch ( e ) {
              return done( e );
            }

            done();
          } );
        },
        ( done ) => {
          app.dinit( done );
        }
      ], done );

    } );

    it( 'should return an error if getConnection called when not initialized', function ( done ) {

      this.timeout( 10000 );

      let component;

      try {
        component = generateAppComponents()[1];
      } catch ( e ) {
        return done( e );
      }

      async.waterfall( [
        ( done ) => {
          component.getConnection( 'mongo-1', ( err ) => {

            try {
              assert.ok( err instanceof Error, 'expected error' );
              assert.strictEqual( err.message, 'component not initialized', 'error message not correct' );
            } catch ( e ) {
              return done( e );
            }

            done();
          } );
        }
      ], done );

    } );

  } );
} );
