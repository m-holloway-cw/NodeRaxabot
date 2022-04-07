module.exports.connect = connect;
module.exports.testEmit = testEmit;

var main = require('../main.js');

var ObjectID = require('mongodb').ObjectID;


function connect(db){
  var options = { token: pw, username: user, clientId: clientID};
  const { api, chat }  = new TwitchJs(options);

    API = api;
    CHAT = chat;
    // Listen for all events.
    chat.on(TwitchJs.Chat.Events.ALL, handleMessage);

}

function testEmit(){
main.chatEmitter.emit('test', 'test message');
}
