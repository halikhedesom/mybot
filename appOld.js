var restify = require('restify');
var builder = require('botbuilder');

//set-up server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function(){
    console.log('%s listening to %s',server.name, server.url);
});

//create a chatbot
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    //appId:'app111',
    appPassword: process.env.MICROSOFT_APP_PASSWORD
    //appPassword: '111111'
});

var bot = new builder.UniversalBot(connector);
server.post('api/messages',connector.listen());

//Bots Dialogs

// bot.dialog('/',function(session){
//   session.send("Hello World");
// });

bot.dialog('/',[function(session,args,next){
  //session.send("Hello World");
  if(!session.userData.name){
    session.beginDialog('/profile');
  }else{

    next();
  }
},
function(session, result){
  session.send("Hello %s!",session.userData.name);
}
]);

bot.dialog('/profile',[
  function(session, result){
    builder.Prompts.text(session, "Hi there! What's your name");
  },
  function(session, result){
    session.userData.name = result.response;
    session.endDialog();
  }
]);
