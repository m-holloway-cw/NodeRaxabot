const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });

var ObjectID = require('mongodb').ObjectID;
var CONFIG;


module.exports.start = start;
module.exports.sendLive = sendLive;

function start(config){
  CONFIG = config;
  client.login(config.discordToken);
};

//todo get server id and channel ids to mongo
async function handleStartup(data){
  //console.log(data);

  //array of channels for bot to ignore
  HIDDENCHANNELS = data[0].hiddenChannels;
  //array of messages to listen to for reactions
  REACTMESSAGES = data[0].reactMessages;
  WELCOMEROLEID = data[0].welcomeRoleID; //color 1752220
  LOGCHANNELID = data[0].discordLogID;
}



client.on('raw', async (inc) =>{
  if(inc.op != 11){ //ignore op 11
    //console.log(inc);
    var type = inc.t;
    var opCode = inc.op;
    var data = inc.d;

    if(type === 'MESSAGE_REACTION_ADD'){
      console.log('reaction add from raw');
      console.log(data.emoji.name);
      var SERVER  = await client.guilds.cache.get(SERVERID);
      //console.log(SERVER);
      //rHandler.handleReactionAdd(data.user_id, data.emoji.name, data.message_id, REACTMESSAGES, SERVER, WELCOMEROLEID);
    } else if(type === 'MESSAGE_REACTION_REMOVE'){
      console.log(data.emoji);
      console.log('reaction remove from raw');
      var SERVER  = await client.guilds.cache.get(SERVERID);
      //rHandler.handleReactionRemove(data.user_id, data.emoji.name, data.message_id, REACTMESSAGES, SERVER);
    } else if(type === 'GUILD_CREATE'){
      //ignore for now was used for logging purposes on message deletes/updates
    } else if(type=== 'MESSAGE_CREATE'){
      var user = data.author.username + '#' + data.author.discriminator;
      var msg = data.content;
      //TODO commands and whatever here
      //console.log('MESSAGE#'+data.channel_id + ' ' + user +': ' + msg);
    } else {
      //ignore cause spam
    }
  }
});


function sendLive(game){
  var discordChannelID = CONFIG.contentChannelID;
  sendPost(discordChannelID, 'Raxa may or may not be streaming '+game+'... click to find out: https://www.twitch.tv/raxa');
}


function sendPost(channelID, message){
  console.log('sending message to #'+channelID+' :' + message);
  client.channels.fetch(channelID).then(channel => {
    channel.send(message);
  }).catch(console.error);
}
