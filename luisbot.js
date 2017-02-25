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


var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/c413b2ef-382c-45bd-8ff0-f76d60e2a821?subscription-key=1e9581511db543ddba2e55258d1bc090&q=';
var recognizer = new builder.LuisRecognizer(model);
var dialog = new builder.IntentDialog({recognizers:[recognizer]});

bot.dialog('/',dialog);

dialog.matches('builtin.intent.alarm.set_alarm',[
    function(session,args,next){
        console.log("args.entities in 1  :"+JSON.stringify(args.entities));
        var title = builder.EntityRecognizer.findEntity(args.entities, 'builtin.alarm.title');
        var time = builder.EntityRecognizer.resolveTime(args.entities);

        var alarm = session.dialogData.alarm = {
            title : title ? title.entity : null,
            timestamp : time ? time.getTime() : null
        }

        if(!alarm.title){
            builder.Prompts.text(session, 'What would you like to call your Alarm?');
        }else{

            next();
        }
    },
    function(session, result, next){
        var alarm = session.dialogData.alarm;
        if(result.response){
            alarm.title = result.response;
        }

        if(alarm.title && !alarm.timestamp){
            builder.Prompts.time(session,'Waht time would you like to set the alarm for?');
        }else{

            next();
        }
    },
    function(session, result){
        var alarm = session.dialogData.alarm;

        if(result.response){
            var time = builder.EntityRecognizer.resolveTime([result.response]);
            alarm.timestamp = time ? time.getTime() : null;
        }

        if(alarm.title && alarm.timestamp){
            alarm.address = session.message.address;
            console.log("the mseenger address :"+JSON.stringify(session.message.address));
            alarms[alarm.title] = alarm;

            var date = new Date(alarm.timestamp);
            var isAM = date.getHours() < 12;

            session.send('Creating alarm with following details: %s %d/%d/%d %d:%02d%s',
                          alarm.title,
                          date.getMonth() + 1, date.getDate(), date.getFullYear(),
                          isAM ? date.getHours() : date.getHours() - 12, date.getMinutes(), isAM ? 'am' : 'pm');
        }else{
            session.send('OK no problem...');
        }
    }


]);
dialog.matches('builtin.intent.alarm.delete_alarm',[
    function(session,args, next){
        var title;
        var entity = builder.EntityRecognizer.findEntity(args.entities,'builtin.alarm.title');  

        if(entity){
            title = builder.EntityRecognizer.findBestMatch(alarms, entity.entity);
        }

        if(!title){
            builder.Prompts.choice(session, 'Which alarm would you like to delete?',alarms);
        }else{
            next({response:title});
        }
    },
    function(session, result){

        if(result.response){
            var delAlarm = result.response.entity;
            delete alarms[result.response.entity]
            session.send('OK.. alarm "%s" is deleted',delAlarm);
        }else{
            session.send('OK.. no problem');
        }
    }

]);
dialog.onDefault(builder.DialogAction.send('I am sorry, I did not understand ! I can only create and delete Alarms'));


var alarms = {};

setInterval(function(){
    var now = new Date().getTime();
    for(var key in alarms){
        var alarm = alarms[key];
        if(now > alarm.timestamp){
        var msg = new builder.Message()
                             .address(alarm.address)
                             .text("Here's yor alarm '%s'",alarm.title);
        bot.send(msg);
        delete alarms[key];                     

        }
    }
},15000);
