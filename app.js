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
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

var bot = new builder.UniversalBot(connector);
server.post('api/messages',connector.listen());

var model = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/36551743-9918-40d8-89f5-3a16509fe00c?subscription-key=1e9581511db543ddba2e55258d1bc090&verbose=true';
var recognizer = new builder.LuisRecognizer(model);
var dialog = new builder.IntentDialog({recognizers:[recognizer]});


bot.dialog('/',dialog);

var jsonResp = {intent:"WhoAreYou",
                isDialog:true,    
                msg:'We are a bunch of focused software developers. We build cognitive technology based applications. We are AI focused software shop'};    

dialog.matches('ourTechnology',builder.DialogAction.send('ourTechnology~~~Anything under the sun in JAVA. Having said that are we hands-on Angular 2, AWS, Relations & No-SQL DBs and more. List is quite long'));
dialog.matches('location',builder.DialogAction.send('location~~~We work out of Co-Hub Sanjay Nagar, Bangalore 560094. You can reach us at +91 9663333314'));
dialog.matches('WhatWeDo',builder.DialogAction.send('WhatWeDo~~~We integrate intelligence with any application…'));
dialog.matches('AboutPeople.founders',[
    //builder.DialogAction.send('Zealent Cognotech is founded by Ullas Kulkarni')
    function(session,args,next){
        console.log("~~~~~~~~~~~ Max matchin score~~~~~~~~~~~~ :"+JSON.stringify(args.score));        
        session.send("AboutPeople.founders~~~Zealent Cognotech is founded by Ullas Kulkarni");
    }
]);
dialog.matches('AboutPeople.teamsize',builder.DialogAction.send('AboutPeople.teamsize~~~We know size does matter, but does not hinder. We are bootstrapping. We are small, focused and agile...'));
//dialog.matches('WhoAreYou',builder.DialogAction.send('WhoAreYou~~~We are a bunch of focused software developers. We build cognitive technology based applications. We are AI focused software shop'));
dialog.matches('WhoAreYou',builder.DialogAction.send(jsonResp));
dialog.matches('clients',builder.DialogAction.send('clients~~~We do not have many. At the moment Chariot World Tours, Microsft, Stireed and few more...'));
dialog.matches('getintouch',[
    function(session,args,next){
            console.log("args.entities in 1  :"+JSON.stringify(args));
            session.send("getintouch~~~You can write to us at contact@zealent.io or call us on +91998989889.\n"+ 
            "Alternatively, please help us with your name, email and phonenumber. We will get in touch with you");
    }]);
dialog.matches('visitorcontacts',[
 
    function(session, args,next){

        console.log("args.entities in 2  :"+JSON.stringify(args.entities));

        var email = builder.EntityRecognizer.findEntity(args.entities,'builtin.email');
        var phNum = builder.EntityRecognizer.findEntity(args.entities,'builtin.phonenumber');
        var name = builder.EntityRecognizer.findEntity(args.entities,'visitorName');

        var visitorDetails = session.dialogData.visitordetails = {
            email : email ? email.entity : null,
            phonenumber:phNum ? phNum.entity : null,
            name: name ? name.entity : null
        };

        if(!visitorDetails.name){
            builder.Prompts.text(session,'visitorcontacts#dialog~~~What is your name?');
        }else{

            next();
        }
    },
    function(session, result,next){

        var visitorDetails = session.dialogData.visitordetails;
        if(result.response){

            visitorDetails.name = result.response;
        }
        if(visitorDetails.name && !visitorDetails.email){
            builder.Prompts.text(session,"visitorcontacts#dialog~~~You email please");
        }else{  
            next();
        }

    },
    function(session, result,next){

        var visitorDetails = session.dialogData.visitordetails;
        if(result.response){

            visitorDetails.email = result.response;
        }
        if(visitorDetails.name && visitorDetails.email && !visitorDetails.phonenumber){
            builder.Prompts.text(session,"visitorcontacts#dialog~~~You Phone Number please");
        }else{
            next();
        }
    },
    function(session, result,next){
        var visitorDetails = session.dialogData.visitordetails;
        if(result.response){

            visitorDetails.phonenumber = result.response;
            //send email etc
        }
        if(visitorDetails.email || visitorDetails.phonenumber){
            session.send("visitorcontacts#dialog~~~Thank you' %s' for you contact details. We will get in touch with you",visitorDetails.name ? visitorDetails.name : "");
        }else{
            session.send("visitorcontacts#dialog~~~No Problem. Please feel free to get in touch with you at your earliest convenience");
        }
    }
    
]);
dialog.onDefault(builder.DialogAction.send("default~~~Oops!! I don't have answer for this. Give me your contact details, I will have my human counterparts revert to you"));
