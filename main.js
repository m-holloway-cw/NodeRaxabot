const TwitchJs = require('twitch-js').default;

const chat = require('./Chat/chat.js');
const website = require('./Website/website.js');
const discord = require('./Discord/discord.js');

const api = require('./twitchAPI');

var mongo = require('./mongoUtil');
var ObjectID = require('mongodb').ObjectID;
const env = require('dotenv');
env.config();

module.exports.chat = chat;
module.exports.website = website;
module.exports.discord = discord;
module.exports.checkFunction = checkFunction;
module.exports.env = env;


async function startup(){
  mongo.init(process.env.MONGO_KEY, (config) => {
    api.init(config);
    mongo.commands(process.env.MONGO_KEY, (commands) => {
      chat.connect(config, commands);
      mongo.alerts(process.env.MONGO_KEY, (alerts) => {
        website.start(config, commands, alerts);
      });
    });
    mongo.discord(process.env.MONGO_KEY, (discordConfig) => {
      discord.start(discordConfig);
    });
  });

  /*mongo.connectToServer(process.env.MONGO_KEY, (db)=>{

  });*/
}

startup();


function checkFunction(){
  console.log('found check function in main file');
}
