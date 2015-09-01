
/** Work Diary Application
 * Copyright (c) 2015, AlpX (MIT License)
 * https://github.com/AlpX/Workdiary
 * http://alpx.io/
 */

angular.module('workdiaryapp', ['ui.bootstrap'])
  .controller('diaryController',  ['$scope', function($scope) { 
  $scope.alert={};
  $scope.alert.msg="Welcome to Work Diary";
  $scope.alert.type="success";
  //$scope.alert.type="danger";

  $scope.showAlert = function(msg, type) {
    $scope.alert.msg=msg;
    $scope.alert.type=type;
    $scope.alert.hide=false;
  };

  $scope.closeAlert = function() {
    $scope.alert.hide=true;
  };
// Date selection

  $scope.today = function() {
    $scope.dt = new Date();
  };
  $scope.today();

  $scope.clear = function () {
    $scope.dt = null;
  };

  // Disable weekend selection
  $scope.disabled = function(date, mode) {
    return ( mode === 'day' && ( date.getDay() === 0 || date.getDay() === 6 ) );
  };

  $scope.toggleMin = function() {
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); 
    $scope.minDate = yesterday ;
  };
  $scope.toggleMin();

  $scope.open = function($event) {
    $event.preventDefault();
    $event.stopPropagation();

    $scope.opened = true;
  };

  $scope.dateOptions = {
    formatYear: 'yy',
    startingDay: 1
  };

  $scope.formats = ['dd-MMMM-yyyy', 'yyyy/MM/dd', 'dd.MM.yyyy', 'shortDate'];
  $scope.format = $scope.formats[0];

  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  var afterTomorrow = new Date();
  afterTomorrow.setDate(tomorrow.getDate() + 2);
  $scope.events =
    [
      {
        date: tomorrow,
        status: 'full'
      },
      {
        date: afterTomorrow,
        status: 'partially'
      }
    ];

  $scope.getDayClass = function(date, mode) {
    if (mode === 'day') {
      var dayToCheck = new Date(date).setHours(0,0,0,0);
    }

    return '';
  };

// page animations control
$scope.slideSelection="loginslide";
// Web Session management

var webSessionID=Math.random();
 
    $scope.login = function() { 
        var usrname=document.getElementById('usr').value;
        var pswd=document.getElementById('pwd').value;
        //console.log(usrname+ ' '+ pswd);
        
		if(socket)
		{ socket.emit('login',{usr: usrname, pwd:pswd}) }
    };
    
    
    $scope.logout = function() { 
        //console.log('logout');
		if(socket && $scope.isloggedIn)
		{ socket.emit('logout',$scope.loginName) }
    };


    $scope.gotoDateSelection = function(selectedDate) {
        $scope.slideSelection="dateslide";
    };

    $scope.gotoDiary = function(selectedDate) {
        $scope.slideSelection="diaryslide";
        socket.emit('date', selectedDate);
    };

    $scope.save = function() {
        //$scope.slideSelection="diaryslide";
        var diary={};
        diary.today=$scope.todaysDiary;
        diary.tomorrow=$scope.tomorrowsDiary;
        diary.roadblock=$scope.roadblockDiary;
        socket.emit('saveDiary', diary);
    };
            
    $scope.sendEmail = function() { 
      if(socket && $scope.isloggedIn)
      { socket.emit('sendEmail', $scope.loginName) }
    };


$scope.isloggedIn=false;
$scope.webSessionID=0;

    var socket = io.connect();

      socket.on('connect', function() {
        socket.emit('session', webSessionID );
        //console.log(webSessionID);
      });
      
      socket.on('prevDiary', function(diary) {
            $scope.$apply(function () {
              //console.log('logged in');
              $scope.todaysDiary=diary.today;
              $scope.tomorrowsDiary=diary.tomorrow;
              $scope.roadblockDiary=diary.roadblock;
              $scope.showAlert("Your previous entries are here.", 'success');
            });
      });
      
      socket.on('loginAccepted', function(name) {
            $scope.$apply(function () {
              //console.log('logged in');
              $scope.isloggedIn=true;
              $scope.loginName=name;
              $scope.slideSelection="dateslide";
              $scope.showAlert("You are logged in:" +name, 'success');
            });
      });
      
      socket.on('loginNotAccepted', function(name) {
            $scope.$apply(function () {
              //console.log('logged in');
              $scope.isloggedIn=false;
              $scope.slideSelection="loginslide";
              $scope.showAlert("Your user info was wrong " +name, 'danger');
            });
      });

      socket.on('diarySaved', function(date) {
            $scope.$apply(function () {
              //console.log('logged in');
              var ndt=new Date(date);
              $scope.showAlert("Diary saved! " +ndt.toLocaleString(), 'success');
            });
      });
      
      socket.on('logoutAccepted', function(name) {
            $scope.$apply(function () {
	            $scope.isloggedIn=false;
	            $scope.loginName='';
              $scope.slideSelection="loginslide";
              $scope.showAlert("You are logged out:" + name, 'success');
            });
      });

      socket.on('disconnect', function() {
      		$scope.$apply(function () {
      			  $scope.webSessionID=0;
              $scope.isloggedIn=false;
              $scope.slideSelection="loginslide";
              $scope.showAlert("Your connection was lost. You are logged out:" + $scope.loginName, 'success');
              $scope.loginName='';
      		});
      });



  }]);


 
