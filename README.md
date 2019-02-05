# StringStack MongooseJS

StringStack/mongoose is a component providing access to MongoDB databases via the MongooseJS library.

It is VERY easy to use, especially if you already setup [StringStack/core](https://www.npmjs.com/package/@stringstack/core), which is also VERY easy to setup.

# Installation

```bash
npm install @stringstack/mongoose --save
```

# Configuration

StringStack/mongoose looks for configuration in the nconf container provided by StringStack/core. Store the configuration
in nconf at the path ```stringstack:mongoose```. The configuration is an object of the following schema.

```json
{
  "stringstack": {
    "mongoose": {
      "<connection_name>": {
        "host": "<one or more Mongo connection URLs, separated by commas. See https://mongoosejs.com/docs/connections.html for examples.>",
        "options": {
          "*": "<all options from https://mongoosejs.com/docs/connections.html>"
        }
      }
    }
  }
}
``` 

Note: We default some of the options to avoid deprecation warnings triggered by the underlying MongoDB driver. See the
details [https://mongoosejs.com/docs/deprecations.html](https://mongoosejs.com/docs/deprecations.html). There are some 
other suggestions on different functions you should use also. It is recommended to follow all examples there.

You can connect to multiple MongoDB server/clusters/replicas. Each connection name identifies a different set of
connection options for that connection name. You can use all the connections interchangeably. 

The best way to set the config would be to create a config setup component and pass it to rootComponents when creating 
the App instance. See [StringStack/core](https://www.npmjs.com/package/@stringstack/core) documentation for examples of 
creating such a config setup component.

You would use the setup component to set all config values for your entire StringStack app. 

```javascript

class ConfigSetup {
  
  constructor( deps ) {
    
    // inject(), versus get(), ensures ConfigSetup.init() is called BEFORE config.init(), and thus BEFORE @stringstack/mongoose.init() is called
    this._nconf = deps.inject( 'config' );
    
  }
  
  init( done ) {
    
    // Load your config from wherever you want, and stick it in the nconf instance, you can even load it asynchronously
    
    this._nconf.defaults( {
            stringstack: {
              mongoose: {
                someConnectionName: {
                  // ... The config you loaded from where ever
                }
              }
            }
          } );
          
    done();
    
  }
  
  dinit( done ) {
    done();
  }
  
}

module.exports = ConfigSetup;

``` 

# Usage

The primary function of this component is to make it easy to apply configuration, and access one or more Mongoose
connections, and ensure they all disconnect at the right time. As such, the only method which you will directly use
on this component is getConnection(). You will also be able to access Schema off the component. component.Schema is an
alias of mongoose.Schema. Similarly, component.SchemaType is also an alias of mongoose.SchemaType. Both are made 
available so that you can easily create schemas and thus models.

Any component that needs to access a connection, or its models, would do so like this, assuming you used a config setup 
component to ensure configuration is in place.

Note that once a model has been created on a particular connection, it is available to any component that accesses that
connection. This is because getConnection() will return the same connection each time it is called for a particular 
connection name. It is up to you to pass in the correct options in order to manage the size of the connection pool and 
any other parameters needed to tune each connection in your configuration.

If you are at all worried about how to use the returned value from getConnection(), it is always the same as the object
returned from calling the method ```require( 'mongoose' ).createConnection( host, options )```.

```javascript

class SomeComponent {
  
  constructor( deps ) {
    
    // since we used deps.get(), SomeComponent will init AFTER @stringstack/mongoose, and after config, and after 
    // ConfigSetup, in that order.
    this._mongoose = deps.get( '@stringstack/mongoose' );
    
    this._connection = null;
    
  }
  
  init(done) {
    
    // Load all the models used by this component
    
     this._mongoose.getConnection( 'someConnectionName', (err, connection ) => {
                
       if ( err ) {
         return done( err );
       }
        
       // Connection is a connection instance returned directly from mongoose.createConnection();
       this._connection = connection;
       
        const Schema = this._mongoose.Schema;
       
        // Setup all models for this connection
        const blogSchema = new Schema( {
                               title:  String,
                               author: String,
                               url: String,
                               body:   String,
                               comments: [{ body: String, date: Date }],
                               date: { type: Date, default: Date.now },
                               hidden: Boolean,
                               meta: {
                                 votes: Number,
                                 favs:  Number
                               }
                             } );
        
        blogSchema.index( { date: -1, title: 1 } );
        blogSchema.index( { author: 1 } );
        
        this._BlogModel = connection.model( 'blogSchema', blogSchema );
        
        done();
        
      } );
    
  }
  
  save( blog, done ) {
    return new this._BlogModel( blog ).save( done );
  }
  
}

module.exports = SomeComponent;


```


# Testing

You should do test driven development. 

[Why do test Driven Development?](http://lmgtfy.com/?q=why+do+test+driven+development)

If you want to run the tests on this component, 
We use Docker and Docker Compose for testing, so install Docker on your machine. Also, we don't develop on Windows, so 
this command will likely fail on Windows.

Once you have Docker installed, and run ```npm install``` run tests like with ```npm test```.

# MongooseJS Version

Here you can figure out which version of MongooseJS is used with which version of StringStack/mongoose.
 
StringStack/mongoose version: MongooseJS version

0.0.1: 5.4.7
