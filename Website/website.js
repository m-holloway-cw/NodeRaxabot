const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const app = express();
var path = require('path');
var session = require('express-session');
var passport = require('passport');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
const https = require('https');
const fs = require('fs');
var request = require('request');
const EventEmitter = require('events');
const cors = require('cors');



var main = require('../main.js');
var mongo = require('../mongoUtil');
var ObjectID = require('mongodb').ObjectID;
var services = require('./serviceHandler');
var events = require('./eventHandler');
var alertHandler = require('./alertHandler');
//single event system
const eventStreamSource = new EventEmitter();

var CLIENT_ID, SECRET, SESSION_SECRET, BOT_AUTH, CALLBACK_URL;
var adminUsers, modUsers;

//called from root main
//sends mongo client to get information as needed
async function start(config, commands, alerts){
  await handleStartup(config);
  services.init(config, commands);
  events.init(config);
  alertHandler.init(alerts)
}


async function handleStartup(config) {
  CLIENT_ID = config.client_id;
  SECRET = config.client_secret;
  SESSION_SECRET = config.session_secret;
  BOT_AUTH = config.bot_auth;
  CALLBACK_URL = config.callback_url;
  adminUsers = config.adminUsers;
  modUsers = config.modUsers;
  app.emit('ready');
};


//initialize app
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({limit: '5mb'}));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', true);
app.use(session({
  secret: '312adfa',
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(cors());


app.listen(8008);


app.on('ready', function(){
  initTwitch();
});

function initTwitch(){

//setup out twitch passport
OAuth2Strategy.prototype.userProfile = function(accessToken, done) {
  var options = {
    url: 'https://api.twitch.tv/helix/users',
    method: 'GET',
    headers: {
      'Client-ID': CLIENT_ID,
      "Accept": 'application/vnd.twitchtv.v5+json',
      'Authorization': 'Bearer ' + accessToken
    }
};

request(options, function(error, response, body){
  if(response &&response.statusCode == 200){
    //console.log(body);
    done(null, JSON.parse(body));
  } else {
    //console.log('1 ' + body);
    done(JSON.parse(body));
    }
  });
}

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use('twitch', new OAuth2Strategy({
  authorizationURL: 'https://id.twitch.tv/oauth2/authorize',
    tokenURL: 'https://id.twitch.tv/oauth2/token',
    clientID: CLIENT_ID,
    clientSecret: SECRET,
    callbackURL: 'https://raxabot.raxa.dev/auth/twitch/callback',
    state: true
},
  function(accessToken, refreshToken, profile, done){
    console.log('oauth profile')
    profile.accessToken = accessToken;
    profile.refreshToken = refreshToken;
    //store profile somewhere at this point if required

    done(null, profile);
  }
));
};

//twitch routes
app.get('/auth/twitch', passport.authenticate('twitch', {scope: 'user:read:email'}));
//redirect after oauth
require('https').globalAgent.options.rejectUnauthorized = false;
app.get('/auth/twitch/callback', passport.authenticate('twitch', { successRedirect: '/', failureRedirect: '/failed' }));

app.get('/failed', function(req, res){
  res.send("Failed to get authorization");
});

//method to check authoritzation
function checkAuth(req){
  if(req.session && req.session.passport && req.session.passport.user){
    var username = req.session.passport.user.data[0].login;
    if(username === 'raxa'){
      return 'admin';
    }
    if(adminUsers.indexOf(username) > -1){
      return 'admin';
    } else if(modUsers.indexOf(username) > -1){
      return 'mod';
    } else {
      return 'normalUser';
    }
  }
  return 'noAuth';
}

//temporary page to get authorization codes
app.get('/getTokens', function (req, res){
  var auth = checkAuth(req);
  var username = req.session.passport.user.data[0].login;

  if(auth == 'admin' && username == 'raxa'){
    var url = 'https://id.twitch.tv/oauth2/authorize?client_id='+CLIENT_ID+'&redirect_uri=https://raxabot.raxa.dev/auth/twitch/token&response_type=code&scope=bits:read channel:read:charity channel:manage:polls channel:manage:predictions channel:manage:redemptions channel:manage:schedule channel:read:goals channel:read:hype_train channel:read:polls channel:read:predictions channel:read:redemptions channel:read:subscriptions clips:edit moderation:read moderator:manage:banned_users moderator:read:blocked_terms moderator:manage:blocked_terms moderator:manage:automod moderator:read:automod_settings moderator:manage:automod_settings moderator:read:chat_settings moderator:manage:chat_settings user:read:email user:read:follows user:read:subscriptions channel:moderate chat:edit chat:read';
    res.redirect(url);
  } else {
    res.render('login');
  }
});

app.get('/auth/twitch/token', function(req, res){
  var auth = checkAuth(req);
  var username = req.session.passport.user.data[0].login;

  if(auth == 'admin' && username == 'raxa'){
    if(req.query.code){
      postToken(req.query.code);
      res.send('<html><body>Token succesfully acquired!</br></br><a href=\'https://raxabot.raxa.dev/\'>Return to dashboard</a>');
    } else {
      if(postToken(req.query.code)){
        res.send('<html><body>Token succesfully acquired!</br></br><a href=\'https://raxabot.raxa.dev/\'>Return to dashboard</a>');
      }else {
        res.send('Server issue occurred, :)');
      }
    };
  } else {
    res.render('401');
  }
});


//post to twitch, return true is successful
function postToken(code){
  var options = {
    url: 'https://id.twitch.tv/oauth2/token?client_id='+CLIENT_ID+'&client_secret='+SECRET+'&code='+code+'&grant_type=authorization_code&redirect_uri=https://raxabot.raxa.dev/auth/twitch/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
};

request(options, function(error, response, body){
  if(response){
    //store our code
    var json = JSON.parse(body);
    console.log(json);
    var accToken = json.access_token;
    var refToken = json.refresh_token;
    //var expiresIn = json.expires_in;

    console.log(accToken);
    console.log(refToken);
    mongo.updateTokens(accToken, refToken, function(res){

    });
    return true;
  } else {
    return false;
    }
  });
}


var views = 0;
//redirect to stream
app.get('/live', function(req, res){
  views = views + 1;
  console.log('someone clicked the linky thingy, total: ' + views);
  res.redirect('https://www.twitch.tv/raxa');
});



//to main home page
app.get('/', function (req, res){
  //check for authenticated session
  var auth = checkAuth(req);

  if(auth == 'admin'){
    var username = req.session.passport.user.data[0].login;
    //console.log('username found', username);
    var displayName = req.session.passport.user.data[0].display_name;
    var profile_image_url = req.session.passport.user.data[0].profile_image_url;
    //send what we need to browser view
    res.render('./admin/dashboard', { user: displayName, profile_image_url: profile_image_url});
  } else if (auth == 'mod'){
    //send what we need to browser view
    res.render('./mod/dashboard', { user: displayName, profile_image_url: profile_image_url});
  } else if (auth == 'normalUser'){
    //todo send ot mock bot for portfolio example here
    //send non-authorized user to 401 page
    res.render('401', { user: displayName, profile_image_url: profile_image_url});
  } else {
    //if no session is found, redirect to a login page
    res.render('login');
  }
});

app.get('/401', function(req, res){
  res.render('401');
});


//endpoint for discord bot redirect(unsure if needed)
app.get('/discordBot', function(req, res){
  console.log('get request for discord bot');
  console.log(req.body);
});


app.post('/api/testAlert', function(req, res){
  var auth = checkAuth(req);
  if(auth == 'admin'){
    console.log(req.body)
    events.testAlert(req.body);
    res.sendStatus(200);
  }
});




//TODO possible move to chat, offline/online events go to discord, subcount to website,etc
app.post('/api/eventsub', function(req, res){
  console.log('event sub print')
  //console.log(req)
  console.log(req.body);
  var challenge = req.body.challenge;
  if(req.body.subscription.status == 'webhook_callback_verification_pending'){
    res.send(challenge);
  } else {
    events.handleEventSub(req.body);
    res.sendStatus(200);
  }
});



//event queue endpoint
app.get('/api/eventStream', function(req, res){
  console.log('connection')
  initializeSSEEvents(req, res);
});


function initializeSSEEvents(req, res) {
  res.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		"Connection": "keep-alive"
	});
  eventStreamSource.on("push", function(event, data){
    //console.log(event);
    //console.log(data.msg);
    var msg = JSON.stringify(data.msg);
    res.write("data: " + msg + "\n\n");
  });
  eventStreamSource.setMaxListeners(0);
};



//endpoints and routes here
//pages
app.get('/commands', function(req, res){
  var auth = checkAuth(req);
  if(auth == 'admin'){
    var username = req.session.passport.user.data[0].login;
    var displayName = req.session.passport.user.data[0].display_name;
    var profile_image_url = req.session.passport.user.data[0].profile_image_url;
    res.render('commands', { user: displayName, profile_image_url: profile_image_url});
  } else {
    res.render('login');
  }
})

//TODO reserved command list to prevent edits i.e. to !followage, !uptime, etc
//send the array of commands from db as a unit
app.get('/getCommands', async function(req, res) {
  //ensure it's a legitimate, logged in request
  var auth = checkAuth(req);
  if(auth == 'admin'){
    await services.getCommands(function (comms){
      res.send(comms);
    });
    //grab from DATABASE
    /*var dbo = mongo.getDb();
    dbo.collection("commands").find().toArray(function(err, result){
      if (err) throw err;
      res.send(result);
    });*/
} else {
  //if no session is found, redirect to a login page
  res.render('login');
}
});

//method to get specific command for front end UI
app.get('/getCommandInfo', async function(req, res){
  var auth = checkAuth(req);
  if(auth == 'admin'){
    //console.log(req);
    //console.log(req.query)
    var cName = req.query.q;
    //console.log('searching for command:' + cName);
    var commandObj = await services.getCommandInfo(cName);
    console.log(commandObj)
    if(commandObj){
      res.send(commandObj);
    }
  } else {
    //if no session is found, redirect to a login page
    res.render('login');
    }
});

//handle submitcommand from commands page
app.post('/submitCommand', function(req, res){
  var auth = checkAuth(req);
  if(auth == 'admin'){
    var username = req.session.passport.user.data[0].login;
    console.log('username found', username);
    //send to bot as full body json
    services.handleCommandJson(req.body, function(response){
    if(response == "200 OK"){
    //send back to command page
    res.send("200 OK");
  } else if(response == "duplicate"){
    res.send("duplicate");
  } else if(response == "401"){
    res.send("401");
  } else {
    res.send("500 ERROR");
  }
    });

} else {
    //go back to main page to prompt login
    res.redirect('/');
  }
});


//post for UI to submit commands to the repeating array
//send to chatbot from serviceHandler
app.post('/restartRepeats', function(req, res){
  var auth = checkAuth(req);
  if(auth == 'admin'){
    //send to bot as full body json
    services.restartRepeats(function(response){
      console.log(response);
      if(response == '200 OK'){
        //send back to command page
        res.send("200 OK");
      } else {
        res.send("500 ERROR");
      }
    });
  } else {
    //if no session is found, redirect to a login page
    res.render('login');
  }
});

//Overlay
app.get('/overlay', function(req, res){
  res.render('overlay');
});


//function for sub modules to send message to chat
function sendToChat(msg){
  main.chat.sendMessage(msg);
}

//function for bot to trigger alerts from commands
function chatAlert(json){
  console.log(json)
};


module.exports.start = start;
module.exports.sendToChat = sendToChat;
module.exports.eventStreamSource = eventStreamSource;
module.exports.chatAlert = chatAlert;
