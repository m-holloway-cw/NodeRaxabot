module.exports.connect = connect;
module.exports.sendMessage = sendMessage;
module.exports.sendMain = sendMain;


var main = require('../main.js');
var cH = require('./handlers/commandHandler');
var mH = require('./handlers/moderationHandler');
var API = require('../twitchAPI.js');
var CHAT;
var CHANNEL;

const TwitchJs = require('twitch-js').default;
var ObjectID = require('mongodb').ObjectID;


function connect(config, commands){
  CHANNEL = config.channelUser;
  const pw = config.botPW;
  const user = config.botUser;
  const clientID = config.client_id;
  //const channelID = config.channel_id;
  const channelID = 87414084;

  var options = { token: pw, username: user, clientId: clientID};
  const { chat }  = new TwitchJs(options);
  CHAT = chat;
  chat.on('PRIVMSG', handlePriv);
  chat.on('USERNOTICE', handleUserNotice);
  chat.connect().then(()=>{
    chat.join(CHANNEL);
    console.log('joined channel ' + CHANNEL)
  });

  cH.initCommands(commands, channelID, API);

}


/*
function connect(db){
  DB = db;
  var pw, user, clientID, channel, channelID;
  var refreshToken, accessToken, clientSecret, appAccessToken, userAccessToken;
  db.collection('config').find().toArray(function (err, result) {
    if(err) throw err;
    var res = result[0];
    pw = res.botPW;
    user = res.botUser;
    clientID = res.client_id;
    channel = res.channelUser;
    channelID = res.channelId;
    CHANNEL = channel;

    refreshToken = res.refreshToken;
    accessToken = res.accessToken;
    appAccessToken = res.appAccessToken;
    userAccessToken = res.userAccessToken;

    var options = { token: pw, username: user, clientId: clientID};
    const { chat }  = new TwitchJs(options);

    CHAT = chat;
    // Listen for all events.
    //chat.on(TwitchJs.Chat.Events.ALL, handleMessage);
    //chat.on('*', handleMessage);
    chat.on('PRIVMSG', handlePriv);
    chat.on('USERNOTICE', handleUserNotice);
    chat.connect().then(()=>{
      chat.join(channel);
      console.log('joined channel ' + channel)
    });
  });

  cH.initCommands(db, API, );

  setupListeners(db);

}*/

//ignore for random things like hosting/etc
/*const handleMessage = async msg =>{
  cH.handleMessage(msg, API);
}*/

const handlePriv = async msg => {
 if(!mH.handlePrivMessage(msg)){ //send to moderation first to avoid issues
    cH.handlePrivMessage(msg);
  }
}

const handleUserNotice = async msg => {
  //console.log('usernotice: ' + msg)
  if(!mH.handleUserNotice(msg)){ //send to moderation first to avoid issues
    cH.handleUserNotice(msg);
  }
}

function sendMessage(msg){
  console.log('message going out to #'+CHANNEL+': ' + msg);
  CHAT.say(CHANNEL, msg);
}


function setupListeners(db){
  const modChangeStream = db.collection("moderation");
  const modStream = modChangeStream.watch();
  modStream.on("change", function(event){
    //update our moderation stuff
    //mH.initModeration(dbo);
  });

  const commandChangeStream = db.collection("commands");
  const commandStream = commandChangeStream.watch();
  commandStream.on("change", function(event){
    cH.initCommands(db);
  });
}

function sendMain(json){
  main.website.chatAlert(json);
}
