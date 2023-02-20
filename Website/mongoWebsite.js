var ObjectID = require('mongodb').ObjectID;

var request = require('request');

module.exports = {

	addCommand: async function( newCommand, callback ) {
    const dataBody = {
      "dataSource": "Raxabot",
      "database": "raxabot",
      "collection": "commands",
			"document": newCommand
    }
    const options = {
     url: 'https://data.mongodb-api.com/app/data-spzmy/endpoint/data/v1/action/insertOne',
     method: 'POST',
     body: JSON.stringify(dataBody),
     headers: {
       'api-key': process.env.MONGO_KEY,
       'Content-Type': 'application/json'
     }
    };

    await request(options, async function(error, response, body){
      if(error) { callback('500')}
      callback('200 OK');
    });
	},


	editCommand: async function( updatedCommand, callback ) {
    const dataBody = {
      "dataSource": "Raxabot",
      "database": "raxabot",
      "collection": "commands",
			"filter": {"name": updatedCommand.name },
			"update": { "$set" : {
				"auth": updatedCommand.auth,
				"cooldownInSec": updatedCommand.cooldown,
				"active": updatedCommand.active,
				"repeating": updatedCommand.repeating,
				"sound": updatedCommand.sound,
				"text": updatedCommand.text
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
      if(error) { callback('500')}
      callback('200 OK');
    });
	},

	deleteCommand: async function( command, callback ) {
    const dataBody = {
      "dataSource": "Raxabot",
      "database": "raxabot",
      "collection": "commands",
			"filter": {"name": command }
    }
    const options = {
     url: 'https://data.mongodb-api.com/app/data-spzmy/endpoint/data/v1/action/deleteOne',
     method: 'POST',
     body: JSON.stringify(dataBody),
     headers: {
       'api-key': process.env.MONGO_KEY,
       'Content-Type': 'application/json'
     }
    };

    await request(options, async function(error, response, body){
      if(error) { callback('500')}
      callback('200 OK');
    });
	},

	updateFeature: async function( key, newValue ) {
    const dataBody = {
      "dataSource": "Raxabot",
      "database": "raxabot",
      "collection": "commands",
			"filter": {"_id": ObjectID("62660cc9cf8a81f05e47a9f0")},
			"update": { "$set" : { key : newValue}
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
      if(error) { throw error; }
      console.log('updated feature: ' + key)
    });
	}


}
