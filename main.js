const TwitchJs = require('twitch-js').default;

const chat = require('./Chat/main.js');
const website = require('./Website/main.js');
const discord = require('./Discord/main.js');

var mongo = require('./mongoUtil');
var ObjectID = require('mongodb').ObjectID;

const express = require('express');
const app = express();
var request = require('request');
const bodyParser = require('body-parser');

const events = require('events');
const chatEmitter = new events.EventEmitter();

module.exports.chatEmitter = chatEmitter;

function startup(){
  var db = mongo.getDb();

  chat.connect(db);
  chatEmitter.on('test', handleChat)
  chat.testEmit();

}

startup();


function handleChat(){
  console.log('chat event found')

}


//TODO possible move to chat, offline/online events go to discord, subcount to website,etc
app.post('/api/bot/eventsub', function(req, res){
  //console.log(req.body);
  var challenge = req.body.challenge;
  if(typeof challenge != 'undefined'){
    res.send(challenge);
  } else {
    handleEvent(req.body);
    res.sendStatus(200);
  }
});


var subcount = 754; //test value
function handleEvent(body){
  //console.log(body)
  var type = body.subscription.type;
  switch (type) {
    case 'channel.follow':
      //console.log('follower found from event sub');
      break;
    case 'channel.subscribe':
    console.log(body)
      var tier = body.event.tier;
      console.log('tier '+tier+' sub found from event sub');
      subcount = subcount + getCount(tier);
      console.log('subcount current:' + subcount)
      break;
    case 'channel.subscription.end':
    console.log(body)
      var tier = body.event.tier;
      console.log('tier '+tier+' sub END found from event sub');
      subcount = subcount - getCount(tier);
      console.log('subcount current:' + subcount)
      break;
    case 'channel.subscription.gift':
    console.log(body)
      var tier = body.event.tier;
      var total = body.event.total;
      console.log('tier '+tier+' sub GIFT found from event sub');
      subcount = subcount + getCount(tier) * total;
      console.log('subcount current:' + subcount)
      break;
    case 'channel.subscription.message':
    console.log(body)
      var tier = body.event.tier;
      var message = body.event.message.text;
      console.log('tier '+tier+' sub MESSAGE found from event sub');
      break;
    case 'channel.cheer':
    console.log(body)
      var bits = body.event.bits;
      var message = body.event.message;
      console.log(bits + ' sent message:'+message+' found from event sub');
      break;
    default:
      console.log('other event found, todo later');
      console.log(body);

  }
}
