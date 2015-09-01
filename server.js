#!/usr/bin/env node

/** Work Diary Application
 * Copyright (c) 2015, AlpX (MIT License)
 * https://github.com/AlpX/Workdiary
 * http://alpx.io/
 */


var fs = require('fs');
var http = require('http')
  , express = require('express')
  , io = require('socket.io');

var MongoClient = require('mongodb').MongoClient
  , assert = require('assert');
var nodemailer = require("nodemailer");
var smtpTransport = require('nodemailer-smtp-transport');

// Connection URL
var dburl = 'mongodb://username:passOfMongoUser@localhost:27017/workdiary';

process.title = 'alpxworkdiary';

var socket;

/**
 * App & Server
 */

var app = express()
  , server = http.createServer(app);

app.use(function(req, res, next) {
  var setHeader = res.setHeader;
  res.setHeader = function(name) {
    switch (name) {
      case 'Cache-Control':
      case 'Last-Modified':
      case 'ETag':
        return;
    }
    return setHeader.apply(res, arguments);
  };
  next();

});


app.use(express.static(__dirname));

server.listen(7007);
console.log('web gui is served on 7007');


var findDocuments = function(coll, obj, callback) {
  MongoClient.connect(dburl, function(err, db) {
    assert.equal(null, err);
    //console.log("Connected correctly to server");
    // Get the documents collection
    var collection = db.collection(coll);
    // Find some documents
    collection.find(obj).toArray(function(err, docs) {
      assert.equal(err, null);
      callback(docs);
      db.close();
    });
  });
}

var insertDocuments = function(coll, obj, callback) {
  MongoClient.connect(dburl, function(err, db) {
    assert.equal(null, err);
    //console.log("Connected correctly to server");
    // Get the documents collection
    var collection = db.collection(coll);
    // Insert some documents
    collection.insert(obj, function(err, result) {
      assert.equal(err, null);
      callback(result);
      db.close();
    });
  });
}

var saveDocuments = function(coll, obj) {
  MongoClient.connect(dburl, function(err, db) {
    assert.equal(null, err);
    //console.log("Connected correctly to server");
    // Get the documents collection
    var collection = db.collection(coll);
    // Save some documents
    collection.save(obj, function (err, result) {
      // check err...
      assert.equal(err, null);
      db.close();
    });
 }

 // Email
 var sendEmail = function(body, email) {
  
    var transport = nodemailer.createTransport(smtpTransport({
        host: "smtp.office365.com", // hostname
        port: 587,
        auth: {
            user: "mailtoSendEmailsFrom@office365.com",
            pass: "passwordOfThisEmail"
        }
    }));
 
    var mailOptions = {
        from: "Work Diary <mailtoSendEmailsFrom@office365.com>", // sender address
        to: "Mail Users name <"+email+">", // comma separated list of receivers
        subject: body.subject, // Subject line
        text: body.text, // plaintext body
        html: body.html // html body
    };

    // send mail with defined transport object
    transport.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
        }
    });
 }

/**

 * Web UI Socket

 */


io = io.listen(server, {  // 7007 web ui socket client
  log: false
});


var webSocketarr=[];
var webSessionIDarr=[];
var webUserIDarr=[];
var webSelectedDate=[];
var webSelectedDiaryObj=[];
var webSessionLoggedInarr=[];

io.sockets.on('connection', function(sock) {
  socket = sock;

  console.log('a socket io client from web connected')
  var session=0;
  var sessionUser='anonymous'+Math.random();
  var loggedIn=false;

  socket.on('session', function(sessionid) { // start session
    session=sessionid;
    webSocketarr.push(sock);
    webSessionIDarr.push(session);
    webUserIDarr.push(sessionUser);
    webSelectedDate.push(-1);
    webSelectedDiaryObj.push({});
    webSessionLoggedInarr.push(loggedIn);
  
  });

  socket.on('date', function(date) {
      var index=webSessionIDarr.indexOf(session); 
      var isloggedin=false;
      isloggedin=webSessionLoggedInarr[index];
      if(isloggedin) {

        console.log(date);
        var dt=new Date(date);
        dt.setSeconds(0);
        dt.setMinutes(0);
        dt.setHours(0);
        dt.setMilliseconds(0);

        webSelectedDate[index]=dt;
        var usr=webUserIDarr[index];

        findDocuments('diaries', {user:usr, date:dt}, function(docs) {
          //console.log('from prev');
          //console.log(docs);
          if(docs.length>0) {
            if(docs[0].hasOwnProperty('user') &&
              docs[0].hasOwnProperty('date') &&
              docs[0].hasOwnProperty('today') &&
              docs[0].hasOwnProperty('tomorrow') &&
              docs[0].hasOwnProperty('roadblock'))
            {
              var diary=docs[0];
              var index=webSessionIDarr.indexOf(session);
              webSelectedDiaryObj[index]=diary;
              var noIdDiary = JSON.parse(JSON.stringify(diary));
              noIdDiary._id=0;
              socket.emit('prevDiary',noIdDiary);
            }
            else
            {
              var diary={};
              var index=webSessionIDarr.indexOf(session);
              diary.user=webUserIDarr[index];
              diary.date=webSelectedDate[index];
              diary.today='';
              diary.tomorrow='';
              diary.roadblock='';
              webSelectedDiaryObj[index]=diary;
              socket.emit('prevDiary',diary);
            }
          }
          else
          {
            var diary={};
            var index=webSessionIDarr.indexOf(session);
            diary.user=webUserIDarr[index];
            diary.date=webSelectedDate[index];
            diary.today='';
            diary.tomorrow='';
            diary.roadblock='';
            webSelectedDiaryObj[index]=diary;
            socket.emit('prevDiary',diary);
          }

        });
      }
  });


  socket.on('saveDiary', function(diary) {
      var index=webSessionIDarr.indexOf(session); 
      var isloggedin=false;
      isloggedin=webSessionLoggedInarr[index];
      if(isloggedin) {
        var diaryobj=webSelectedDiaryObj[index];
        diaryobj.date=webSelectedDate[index];
        diaryobj.user=webUserIDarr[index];
        diaryobj.today=diary.today;
        diaryobj.tomorrow=diary.tomorrow;
        diaryobj.roadblock=diary.roadblock;
        console.log(diaryobj);
        saveDocuments('diaries', diaryobj);
        socket.emit('diarySaved',new Date());
      }
    });

    
    socket.on('login', function(cred) {
        findDocuments('usercred', {}, function(docs) {
          var pass=false;
          for(var i=0; i<docs.length; i++) {
            //console.log(docs[i].username);
            if(docs[i].username==cred.usr && 
              docs[i].pass==cred.pwd)
            {
              pass=true;
              break;
            }
          }

          if(pass)
          {
              if(webUserIDarr.indexOf(cred.usr)==-1) { // if not already logged in
                sessionUser=cred.usr;
                loggedIn=true;
                var index=webSessionIDarr.indexOf(session); 
                webUserIDarr[index]=cred.usr;
                webSessionLoggedInarr[index]=true;
                console.log(session+' '+ cred.usr+' has logged in to web session');
                
                socket.emit('loginAccepted',cred.usr);
                console.log(JSON.stringify(webSessionIDarr));
                console.log(JSON.stringify(webUserIDarr));
                console.log(JSON.stringify(webSelectedDate)); 
                console.log(JSON.stringify(webSelectedDiaryObj));               
                console.log(JSON.stringify(webSessionLoggedInarr));
              }
              else
              {
                  console.log('already logged in somewhere. send message to web about it');
              }
              //console.log(JSON.stringify(cred));
          }
          else
          {
                socket.emit('loginNotAccepted',cred.usr);
          }
      });
      //  console.log(JSON.stringify(cred));     
    });


    socket.on('logout', function(usrname) {
        //console.log('logging out');
          if(webUserIDarr.indexOf(usrname)!=-1) { // if not already logged out
  	        sessionUser='anonymous'+Math.random();
  	        loggedIn=false;
  	        var index=webSessionIDarr.indexOf(session); 
  		      webUserIDarr[index]=sessionUser;
  		      webSessionLoggedInarr[index]=false;
  		      midsockOfWeb=null;
  		      targetClient=-1;
            var ind;
            for (ind = 0; ind < webSocketarr.length; ind++) { 
              websock=webSocketarr[ind];
            }
      	    console.log(session+' '+ usrname+' has logged out from web session');
      	    
      	    socket.emit('logoutAccepted', usrname);
        console.log(JSON.stringify(webSessionIDarr));
        console.log(JSON.stringify(webUserIDarr));
        console.log(JSON.stringify(webSelectedDate)); 
        console.log(JSON.stringify(webSelectedDiaryObj)); 
        console.log(JSON.stringify(webSessionLoggedInarr));
        
      }
       
    });

    socket.on('disconnect', function() { 
      var index=webSessionIDarr.indexOf(session);
      if(index!=-1) { 
          loggedIn=false;
          webSocketarr.splice(index, 1);
          webSessionIDarr.splice(index, 1);
          webUserIDarr.splice(index, 1);
          webSelectedDate.splice(index, 1);
          webSelectedDiaryObj.splice(index, 1);
          webSessionLoggedInarr.splice(index, 1);
      }
      console.log(index+' '+session +' '+ sessionUser + ' has disconnected');
      
      sock=null;
    });


}); // on connect ends here


// TIMER for check up - each minute
setInterval(function(){
      var tdt=new Date();
      var hh=tdt.getHours();
      var mm=tdt.getMinutes();
      var dw=tdt.getDay();

      //Send the Work Diary Report to everyone at 23:00 on weekdays
      if(hh==23 && mm==00 && !(dw==0 || dw==6))
      { 
        console.log('sending Email');
        console.log(hh+' '+mm);
        var dt=new Date();
        dt.setSeconds(0);
        dt.setMinutes(0);
        dt.setHours(0);
        dt.setMilliseconds(0);

        findDocuments('diaries', {date:dt}, function(docs) {
          if(docs.length>0) {
              var body={};
              body.subject="Work Diary Report"
              body.text=JSON.stringify(docs);
              body.html="<div>Daily Report - Date:"+docs[0].date.toLocaleString()+"</div>";
              body.html=body.html+"<table border=1>";
              var l1="<tr><td>Who</td><td>What did I do today?</td><td>What will I do tomorrow?</td><td>What are the road blocks for my work?</td>";
              body.html=body.html+l1;
              body.html=body.html+"<a href='linkToThisServerApp.com:7007/'>http://linkToThisServerApp.com:7007/</a>"
              
              for(var i=0; i<docs.length; i++) {
                  var user=docs[i].user;
                  var today=docs[i].today;
                  var tomorrow=docs[i].tomorrow;
                  var roadblock=docs[i].roadblock;
                  var str="<tr><td>"+user+"</td><td>"+today+"</td><td>"+tomorrow+"</td><td>"+roadblock+"</td></tr>";
                  body.html=body.html+str;
              }
              body.html=body.html+"</table>";
              var email="theMailGroupOfWorkPlace@office365.com";
              sendEmail(body, email);
          }
        });
      }
      //22:30 reminders to people who did not enter their work diary
      else if(hh==22 && mm==30 && !(dw==0 || dw==6))  
      { 
        findDocuments('usercred', {}, function(docs) {
          var users=[];
          var emails=[];
          for(var i=0; i<docs.length; i++) {
            users.push(docs[i].username);
            emails.push(docs[i].email);
          }

          console.log('sending reminders..');
          console.log(hh+' '+mm);
          var dt=new Date();
          dt.setSeconds(0);
          dt.setMinutes(0);
          dt.setHours(0);
          dt.setMilliseconds(0);
          findDocuments('diaries', {date:dt}, function(diarydocs) {
                var body={};
                body.subject="Work Diary Report Reminder";
                body.text="You have not entered your work diary yet. Please enter your work diary until 23:00.";
                body.html="<div><b>You have not entered your work diary yet. Please enter your work diary until 23:00. - Date:"+dt.toLocaleString()+"</b></div>";
                body.html=body.html+"<a href='linkToThisServerApp.com:7007/'>http://linkToThisServerApp.com:7007/</a>";
                
                for(var i=0; i<diarydocs.length; i++) {
                    if(diarydocs[i].hasOwnProperty('user'))
                    {
                      for(var j=0; j<users.length; j++) {
                        if(diarydocs[i].user==users[j])
                        {
                            users.splice(j, 1);
                            emails.splice(j, 1);
                            break;
                        }
                      }
                    }
                }
                console.log(JSON.stringify(emails));
                for(var i=0; i<emails.length; i++)
                {
                  var resp=sendEmail(body, emails[i]);
                }
                
          });

        });


      }

}, 60* 1000); // 60 * 1000
  
