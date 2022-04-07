module.exports.connect = connect;
module.exports.testEmit = testEmit;

var main = require('../main.js');

var ObjectID = require('mongodb').ObjectID;


function connect(db){
  var pw, user, clientID;
  db.collection('config').find().toArray(function (err, result) {
    if(err) throw err;
    var res = result[0];
    pw = res.botPW;
    user = res.botUser;
    clientID = res.client_id;
  });
  var options = { token: pw, username: user, clientId: clientID};
  const { api, chat }  = new TwitchJs(options);

    API = api;

console.log(API);
console.log('end of api print')

    CHAT = chat;
    // Listen for all events.
    chat.on(TwitchJs.Chat.Events.ALL, handleMessage);

}

function testEmit(){
main.chatEmitter.emit('test', 'test message');
}

const handleMessage = async msg =>{
  cH.handleMessage(msg, API);
}
