var main = require('./website');
var mongo = require('./mongoWebsite');
var ObjectID = require('mongodb').ObjectID;
var alertHandler = require('./alertHandler');

module.exports.init = init;
module.exports.handleEventSub = handleEventSub;
module.exports.intakeFollower = intakeFollower;
module.exports.getRaidMessage = getRaidMessage;
module.exports.testAlert = testAlert;

var isLive;
var API = require('../twitchAPI.js');

function init(config){
  isLive = isLive();
}

//function to prevent offline spam
async function isLive(){
  await API.getRequest('streams?user_login=raxa', async function(res){
    if(res == '300'){ //retry call since the auth failed on startup
      await API.getRequest('streams?user_login=raxa', function(res){
        if(res == '401' || res == '500'){
          console.log('auth or server error occured in getRequest for eventHandler isLive website');
          console.log(res);
          return false;
        } else {
          return true;
        }
      });
    } else if (res == '401'|| res == '500') {
      console.log('auth or server error occured in getRequest for eventHandler isLive website');
      console.log(res);
      return false;
    } else {
      if(typeof res.data === 'undefined' || res.data.length == 0){
        return false;
      } else {
        return true;
      }
    }
  });
}

async function handleEventSub(body){
  //console.log(body)
  var type = body.subscription.type;
  switch (type) {
    case 'channel.follow':
      //console.log('follower found from event sub');
      var user = body.event.user_name;
      alertHandler.alertFollow(user);
      break;
      
    case 'channel.subscription.gift':
      console.log(body)
      var user = '';
      if(body.event.is_anonymous){
        user = 'Anonymous';
      } else {
        user = body.event.user_name;
      }
      var tier = body.event.tier;
      var total = body.event.total;
      console.log('tier '+tier+' sub GIFT found from event sub');


      break;
    case 'channel.subscription.message':
      console.log(body)
      var user = body.event.user_name;
      var tier = body.event.tier;
      var message = body.event.message.text;
      var months = body.event.cumulative_months;
      console.log('tier '+tier+' sub MESSAGE found from event sub');


      if(months < 2){
        main.sendToChat('raxaHola Thank you '+user+' for the sub to the channel! raxaHeart');
      } else {
        main.sendToChat('raxaHola Thank you '+user+' for the '+months+' months of support to the channel! raxaHeart');
      }
      break;
    case 'channel.cheer':
      //console.log(body)
      var bits = body.event.bits;
      var message = body.event.message;
      //console.log(bits + ' sent message:'+message+' found from event sub');
      var user = body.event.user_name;
      if(user == null){
        user = 'Anonymous';
      } else {
      }
      if(bits > 99){ //ignore to prevent 1 bit spam

      }
      break;
    case 'channel.raid':
      //console.log(body)
      var raider = body.event.from_broadcaster_user_login;

      //function returns complete wording
      //if connection fails a default no game message will be sent instead
      main.sendToChat(getRaidMessage(raider, body.event.from_broadcaster_user_id));

      break;
    case 'channel.channel_points_custom_reward_redemption.add':
      //console.log(body)
      handleRedeem(body.event);
      break;
    case 'stream.online':
      console.log(body)
      handleStreamStatus('online');
      break;
    case 'stream.offline':
      console.log(body)
      handleStreamStatus('offline');
      break;
    default:
      console.log('other event found, todo later');
      console.log(body);
    }
}



function handleRedeem(event){
    var reward = event.reward;
    var id = reward.id;
    var title = reward.title;
    var username = event.user_name;
    var userInput = event.user_input;
    console.log('reward redemption: ' + id + ': ' + title + ' user: ' + username);
    //todo implement in feature db
    if(id== '22a39a33-95da-497d-909d-88b4275d5d74'){//raxacorico pronounce
      alertHandler.channelPoints(id);
    } else if (title=='Go To Sleep') {
      alertHandler.playSound('goTheFToSleep.mp3');
    } else if (title == 'Broke The Rules'){
      alertHandler.playSound('youBrokeTheRules.mp3');
    } else if (title == 'Oh No You Didn\'t'){
      alertHandler.playSound('ohNoYouDidnt.mp3');
    }
}

async function handleStreamStatus(type){
  if(type === 'online'){
    //send notification to discord and change running variable to online for systems to activate
    const game = await getGame('raxa');
      if(game){ //will return null if issue occured
        main.discord.sendLive(res);
      }
    isLive = true;
  } else {
    isLive = false;
  }
 await mongo.updateFeature('isLive', isLive);
}


async function getGame(username){
  await API.getRequest('users?login='+username, async function(json){
    console.log(json)
    if(json == '500'){
      console.log('error occured in game get request')
      return null;
    } else if (json == '300') {
      getGame(username); //retry call as we refreshed auth token
    } else {
      var channelID = json.data[0].id;
      var game ='';
      await API.getRequest('channels?broadcaster_id='+channelID, async function(json){
        console.log(json)
        if(json == '500'){
          console.log('error occured in game get request')
          return null;
        }
        game = json.data[0].game_name;
        return game;
      });
  }
  });
}

function intakeFollower(json){

}


async function getRaidMessage(username, channelID){
    var game ='';
    await API.getRequest('channels?broadcaster_id='+channelID, async function(json){
      console.log(json)
      if(json == '500'){
        console.log('error occured in game get request')
        return;
      }
      game = json.data[0].game_name;
      var output = 'raxaHola Thank you '+ username + ' for the raid, they were last playing: ' + game+'! raxaHeart';
      return output;
    });
  return 'raxaHola Thank you for the raid ' + username + '! raxaHeart';
}




function testAlert(body){
  console.log(body)
  console.log(body.type)
  switch (body.type) {
    case 'follow':
      alertHandler.alertFollow('testertest')
    break;
    case 'sub':
      alertHandler.alertNewSub('newtestertest');
    break;
    case 'raid':
      alertHandler.alertRaid('raidingraider')
    break;
    case 'bit':
      alertHandler.alertBits('bitbetterbit')
    break;
    default:

  }
}
