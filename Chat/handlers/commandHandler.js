var main = require('../chat.js'); //require main from in /Chat

module.exports.handlePrivMessage = handlePrivMessage;
module.exports.handleUserNotice = handleUserNotice;
module.exports.initCommands = initCommands;

var commandArray = {};
const cooldownArray = new Array();
var API;
var CHANNELID;


async function initCommands(commands, channelID, api){
   commands.forEach((command) => {
     commandArray[command.name] = command;
  });
  CHANNELID = channelID;
  API = api;
}

function handlePrivMessage(msg){
  if(msg.isSelf){
    return;
  }
  if(msg.message === "!followage"){
    followage(msg.tags.displayName, msg.tags.userId);
    return;
  }
  if(msg.message === "!uptime"){
    uptime();
    return;
  }

  if(msg.message.substring(0,7) === '!follow' && (`#${msg.username}` === msg.channel || msg.tags.mod == 1)){
    var params = msg.message.split(" ");
    followCommand(params[1]);
    return;
  }
  if(msg.message.charAt(0) === '!'){
    var isMod = false;
    if(msg.tags.mod == 1 || `${msg.username}` === 'raxa'){
      isMod = true;
    }
    handleCommand(msg.username, isMod, msg.message);
  }
}


//built in commands
async function followage(username, userID){
    await API.getRequest('users/follows?to_id='+CHANNELID+'&from_id='+userID, function(json){
      if(json == '500'){
        console.log('error occured in followage get request')
        return;
      }
      if(json == '401'){
        console.log('Bad oauth token');
        main.sendMessage('API request error');
        return;
      }
      if(json == '300'){
        console.log('refreshed auth token, retry call');
        followage(username, userID, api, db);
      }

      var beginDate = Date.parse(json.data[0].followed_at);
      var today = new Date();
      var diff = today-beginDate; // in ms
      var seconds = diff/1000;
      var minutes = seconds/60;
      var hours = minutes/60;
      var days = parseInt(hours/24);
      minutes = parseInt(minutes % 60);
      hours = parseInt(hours % 24);

      var startingOn = new Date(beginDate);
      var dateFormat = require('dateformat');
      var startingOnText = dateFormat(startingOn, "mmmm dS, yyyy");
      var output = username + ' has been following for ' + days + ' days, ' + hours + ' hours, ' + minutes + ' minutes. Starting on ' + startingOnText;
      main.sendMessage(output);
    });
}

async function uptime(){
  await API.getRequest('streams?user_login=raxa', function(json){
    if(json == '500'){
      console.log('error occured in uptime get request')
      return;
    }
    if(json.data.length == 0){
      main.sendMessage('Stream is offline');
    } else {
      var start = Date.parse(json.data[0].started_at);
      //console.log(start);
      var today = new Date();
      var diff = today-start; // in ms
      var seconds = diff/1000;
      var minutes = seconds/60;
      var hours = minutes/60;
      seconds = parseInt(seconds%60);
      minutes = parseInt(minutes % 60);
      hours = parseInt(hours);
      var output = 'Stream has been live for ' + hours + ' hours, ' + minutes +' minutes, ' + seconds + ' seconds';
      main.sendMessage(output);
    }
  });
}

//special command to get game of user in command
async function followCommand(username){
  username = username.replace("@","");
  await API.getRequest('users?login='+username, async function(json){
    console.log(json)
    if(json == '500'){
      console.log('error occured in game get request')
      return;
    }
    var channelID = json.data[0].id;
    var game ='';
    await API.getRequest('channels?broadcaster_id='+channelID, async function(json){
      console.log(json)
      if(json == '500'){
        console.log('error occured in game get request')
        return;
      }
      game = json.data[0].game_name;

      var output = null;
      //grab follow wording form database
      var cmd = commandArray[getCommand('!follow')];
      output = 'follow %param% at twitch.tv/%param% game: %game%';
      //output = commandObj.text;
      var finalOutput = output.replace("%param%", username).replace("%param%", username).replace("%game%", game);
      main.sendMessage(finalOutput, true);
      main.sendMessage('.shoutout ' + username);
    });
  });
}



function handleCommand(username, isMod, msg){
  var commandText = getCommand(msg);
  if(commandText in commandArray){
    var cmd = commandArray[commandText];
    //console.log(cmd)
    var auth = cmd.auth;
    if(auth.includes('+m') && !isMod) return;
    var text = cmd.text;
    if(text.includes('%param%')){
      var params = msg.substring(msg.indexOf(" ")+1);
      text = text.replace("%param%", params);
      if(params.toLowerCase() == 'bot' || params.toLowerCase() =='raxa'){
        text = 'nou';
      }
    }
    if(text.includes('%user%')){
      text = text.replace('%user%', username);
    }

    if(msg === '!lurk'){
      main.sendMain({type:'command', command:'!lurk', user:username});
    }

    main.sendMessage(text);
    cooldownArray.push(cmd.name);
    setTimeout(() => {
      const index = cooldownArray.indexOf(cmd.name);
      if (index >= 0){
        cooldownArray.splice(index, 1);
      }
    }, cmd.cooldownInSec * 1000); //database has cooldown in seconds, convert to ms
  }
}


function getCommand(msg){
  if(msg.includes(" ")){
    return msg.substring(0, msg.indexOf(" "));
  } else {
  return msg;
  }
}




function handleUserNotice(msg){
  //sub messages only as event sub doesnt do subs correctly
  //event sub will catch other things
  var raw = msg._raw;
  if(raw.includes("sub-plan")){
    var msgID = getTagData(raw, "msg-id");
    if(msgID == 'resub' || msgID == 'sub'){
      var user = getTagData(raw, "display-name");
      main.sendMessage('badDance Thank you '+user+' for the sub to the channel! badDance');
    }
  }
}

function getTagData(msg, search){
  var beginIndex = msg.indexOf(search) + search.length + 1;
  var endIndex = msg.indexOf(';',beginIndex);
  return msg.substring(beginIndex, endIndex);
}
