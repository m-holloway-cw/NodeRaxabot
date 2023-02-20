var main = require('./website');
var mongo = require('../mongoUtil');
var ObjectID = require('mongodb').ObjectID;

module.exports.alertFollow = alertFollow;
module.exports.alertNewSub = alertNewSub;
module.exports.alertReSub = alertReSub;
module.exports.alertGiftSub = alertGiftSub;
module.exports.alertBits = alertBits;
module.exports.alertRaid = alertRaid;
module.exports.channelPoints = channelPoints;
module.exports.playSound = playSound;
module.exports.init = init;

let ALERTS = {};
function init(alerts){
  alerts.forEach((item) => {
    console.log(item)
    ALERTS[item.type] = item;
  });
  console.log(ALERTS)
}


let alertArray = [];

function queueAlert(alert){
  alertArray.push(alert);
}

let canPlay = true;
setInterval(function(){
  if(canPlay){

    if(alertArray.length > 0){
      canPlay = false;
      let alertToSend = alertArray.shift();
      let json = {system:"overlay", type:"alert", alert: alertToSend}
      main.eventStreamSource.emit("push", "message", { msg: json });
      setTimeout(function(){
        canPlay= true;
      }, alertToSend.duration * 1000);
    }
  }
}, 5000);

function alertFollow(user){
  let f = ALERTS['follow'];
  let fAlert = {
    user: user,
    sound: f.sound,
    gif: f.gif,
    duration: f.duration
  }
  queueAlert(fAlert);
}

function alertNewSub(user){
  queueAlert(user);
}

function alertReSub(user, months){
  queueAlert(user);
}

function alertGiftSub(user, amount){
  queueAlert(user);
}

function alertBits(user, amount){
  queueAlert(user);
}

function alertRaid(user, amount){
  queueAlert(user);
}

function channelPoints(id){
  if(id == '22a39a33-95da-497d-909d-88b4275d5d74'){//raxacorico pronounce
    playSound('pronounceBri.mp3');
  }
}


//function to send a sound play to overlay
function playSound(fileName){
  q.push({system:"overlay", type:"playSound", value:fileName});
}


//sse event system
var array = new Array();
module.exports.array = array;
const Queue = require('better-queue');
/* create and initialize queue and function fu*/
function fu (json, cb) {
  //console.log(json);
  var system = json.system;
  // send with system, listen for key on page side
  main.eventStreamSource.emit("push", "message", { msg: json });

  cb(null, json);
}
var q = new Queue(fu);
q.on('drain', function(){
  //console.log('Drain complete');
});




setInterval(function(){
    //grab first element of array and send to the queue
    if(array.length){
      q.push(array.shift(), function(err, result){});
    }
}, 500);

setInterval(function(){
  q.push({update:"connection test", number:"3"}, function(err, result){
    //console.log(err);
    //console.log(result);
  });
}, 30000);
