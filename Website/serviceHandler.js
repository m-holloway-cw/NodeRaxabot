var main = require('../main');
var mongoWeb = require('./mongoWebsite');
var mongoUtil = require('../mongoUtil');

module.exports.init = init;
module.exports.handleCommandJson = handleCommandJson;
module.exports.restartRepeats = restartRepeats;
module.exports.getCommands = getCommands;
module.exports.getCommandInfo = getCommandInfo;

var commandArray = {};

function init(config, commands){
  commands.forEach((command) => {
    commandArray[command.name] = command;
 });
 const ordered = Object.keys(commandArray).sort().reduce(
   (obj, key) => {
     obj[key] = commandArray[key];
     return obj;
   },
   {}
 );
 commandArray = ordered;
}


function setCommands(newCommand, callback){
  commandArray[newCommand.name] = newCommand;
  callback(commandArray);
}
/*
async function setCommands(callback){
  await mongoUtil.commands(process.env.MONGO_KEY, function(commands){
    if(commands == '500'){
      console.log('error in setting commands');
      callback('error')
    } else {
      commands.forEach((command) => {
        commandArray[command.name] = command;
      });
      const ordered = Object.keys(commandArray).sort().reduce(
        (obj, key) => {
          obj[key] = commandArray[key];
          return obj;
        },
        {}
      );
      commandArray = ordered;
      callback(ordered);
    }
  });
}*/

function getCommands(callback){
  console.log(commandArray)
  callback(commandArray);
}
/*
async function getCommands(callback){
  await mongoUtil.commands(process.env.MONGO_KEY, function(commands){
    var retArray = Object.entries(commands).reduce(function(retArray, obj){
      if(!obj[1].reserved){
        retArray.push(obj[1])
      }
      return retArray;
    }, []);
    return callback(retArray);
  });
  // return retArray;
}*/

async function getCommandInfo(cName){
  return commandArray[cName];
}

async function handleCommandJson(json, callback){
  if(json.commandName in commandArray){
    var cmd = commandArray[json.commandName];
    if(cmd.reserved){
      callback('401');
      }
    }
      var type = json.method;
      if(type == "delete"){
        await mongoWeb.deleteCommand(json.commandName, function(res){
          setCommands(function(comms){
              callback(res);
          });
        });
      } else if(type == "add"){
        const active = (json.enabled === "true");
        const repeats = (json.repeating === "true");
        const newCommand = {
          name: json.commandName,
          auth: json.commandAuth,
          active: active,
          reserved: false,
          cooldownInSec: json.commandCooldown,
          repeating: repeats,
          sound: json.commandSound,
          text: json.commandText
        };
        await mongoWeb.addCommand(newCommand, function(res){
          setCommands(newCommand, function(comms){
            callback(coms);
          });
          /*
          setCommands(function(comms){
              callback(res);
          });*/
        })
      } else if(type == "edit"){
        const active = (json.enabled === "true");
        const repeats = (json.repeating === "true");
        const updatedCommand = {
          name: json.commandName,
          auth: json.commandAuth,
          active: active,
          cooldownInSec: json.commandCooldown,
          repeating: repeats,
          sound: json.commandSound,
          text: json.commandText
        };
        await mongoWeb.editCommand(updatedCommand, function(res){
          setCommands(updatedCommand, function(comms){
              callback(comms);
          });
        });
      }
    }


function restartRepeats(callback){
  if(main.chat.restartRepeats()){
    callback('200 OK');
  } else {
    callback('500 ERROR');
  }
}
