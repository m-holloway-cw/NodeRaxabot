const MongoClient = require( 'mongodb' ).MongoClient;
const url = "mongodb://localhost:27017";
var request = require('request');
var ObjectID = require('mongodb').ObjectID;

var _db;
var CONFIG = {};
var COMMANDS = {};

module.exports = {
//to get all data localized
  init: async function( key, callback ) {
    const dataBody = {
      "dataSource": "Raxabot",
      "database": "raxabot",
      "collection": "config"
    }
    const options = {
     url: 'https://data.mongodb-api.com/app/data-spzmy/endpoint/data/v1/action/find',
     method: 'POST',
     body: JSON.stringify(dataBody),
     headers: {
       'api-key': key,
       'Content-Type': 'application/json'
     }
    };

    await request(options, async function(error, response, body){
      if(error) { callback('500')}
      if(response){
        CONFIG = JSON.parse(body).documents[0];
        callback(CONFIG);
      }
    });

  },

  commands: async function( key, callback ) {
    const dataBody = {
      "dataSource": "Raxabot",
      "database": "raxabot",
      "collection": "commands"
    }
    const options = {
     url: 'https://data.mongodb-api.com/app/data-spzmy/endpoint/data/v1/action/find',
     method: 'POST',
     body: JSON.stringify(dataBody),
     headers: {
       'api-key': key,
       'Content-Type': 'application/json'
     }
    };

    await request(options, async function(error, response, body){
      if(error) {
        console.log(error)
        return callback('500')}
      if(response){
        COMMANDS = JSON.parse(body).documents;
        return callback(COMMANDS);
      }
    });

  },
  alerts: async function( key, callback ) {
    const dataBody = {
      "dataSource": "Raxabot",
      "database": "raxabot",
      "collection": "alerts"
    }
    const options = {
     url: 'https://data.mongodb-api.com/app/data-spzmy/endpoint/data/v1/action/find',
     method: 'POST',
     body: JSON.stringify(dataBody),
     headers: {
       'api-key': key,
       'Content-Type': 'application/json'
     }
    };

    await request(options, async function(error, response, body){
      if(error) {
        console.log(error)
        return callback('500')}
      if(response){
        let alerts = JSON.parse(body).documents;
        return callback(alerts);
      }
    });

  },

  updateTokens: async function( accToken, refToken, callback ) {
    const dataBody = {
      "dataSource": "Raxabot",
      "database": "raxabot",
      "collection": "config",
      "filter": {"_id": ObjectID("5f9a7a9d4acd644478d42d0c")},
      "update": { "$set" : {
          "accessToken" :  accToken,
          "refreshToken": refToken
        }
      }
    }
    const options = {
     url: 'https://data.mongodb-api.com/app/data-spzmy/endpoint/data/v1/action/updateOne',
     method: 'POST',
     body: JSON.stringify(dataBody),
     headers: {
       'api-key': process.env.MONGO_KEY,
       'Content-Type': 'application/json'
     }
    };

    await request(options, async function(error, response, body){
      if(error) { callback('500') }
      callback('200')
    });
  },


  getConfig: function(){
    return CONFIG;
  },

//to attach new/updated data to remote server
  export: function(){

  },

  connectToServer: function( key, callback ) {

    MongoClient.connect( url,  { useNewUrlParser: true }, function( err, client ) {
      if(err) throw err;
      _db  = client.db('raxabot');
      return callback( _db );
    } );
  },

  getDb: function() {
    return _db;
  }

};
