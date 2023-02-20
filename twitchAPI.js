module.exports.init = init;
module.exports.getRequest = getRequest;
module.exports.postRequest = postRequest;


var mongo = require('./mongoUtil');
var request = require('request');
var ObjectID = require('mongodb').ObjectID;

var CONFIG = {};

function init(config){
    CONFIG = config;
}


//example url https://api.twitch.tv/helix/users?login=raxa
//incoming param should be as follows
//getRequest(users?login=raxa)
//getRequest(streams?user_login=raxa)
async function getRequest(url, callback){
  var conf = mongo.getConfig();
  var accessToken = conf.accessToken;
  var clientId = conf.client_id;
  var options = {
    url: 'https://api.twitch.tv/helix/'+url,
    method: 'GET',
    headers: {
      'Authorization': 'Bearer '+accessToken,
      'Client-Id': clientId
    }
  };

  await request(options, async function(error, response, body){
    if(response){
      //console.log(response)
      //console.log('print in get req body');
      //console.log(body)
      var json = JSON.parse(body);
      if(json.status == "401"){
        await refreshAuth(function(status){
          if(status == '401'){
            return callback('401');
          } else {
            //redirect try again on call side

            return callback('300');
          }
        });
      } else {
        return callback(json);
      }
    } else {

      console.log(response)
      console.log(body)
      console.log(error)
      return callback('500');
      }
    });
  };


//shoulnd't need this
function postRequest(url){
  return 'not implemented';
}



//called if authorization fails for api related info
async function refreshAuth(callback){
  console.log('refreshing auth');

  var refreshToken = CONFIG.refreshToken;
  var clientId = CONFIG.client_id;
  var clientSecret = CONFIG.client_secret;
  var options = {
    url: 'https://id.twitch.tv/oauth2/token?grant_type=refresh_token&refresh_token='+refreshToken+'&client_id='+clientId+'&client_secret='+clientSecret,
    method: 'POST'
  };

  await request(options, async function(error, response, body){
    if(response){
      //console.log(response)
      //console.log(body)
      var json = JSON.parse(body);
      if(json.status == '400' || json.status == '401'){
        return callback('401');
      } else {
        //store codes
        var accToken = json.access_token;
        CONFIG.accessToken = accToken;
        var refToken = json.refresh_token;
        CONFIG.refreshToken = refToken;
        mongo.updateTokens(accToken, refToken, function(res){
          return callback(res);
        })
      }
    } else {
      console.log(response)
      console.log(body)
      console.log(error)
      return callback('500');
      }
    });

}
