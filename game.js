var BALLSIZE = 12,
    MAX_DX = 4,
    MIN_DX = 0.8,
    timeDelay = 12,
    livesRemaining = 3,
    blocksOnScreen = 0,
    FINAL_LEVEL = 6,
    debugging = false,
    currentLevel = 1,
    interval = null,
    playerShipSpeed = 60,
    soundsEnabled = true,
    infiniteLives = false,
    ball = null,
    boss = null,
    paused = false,
    bossIsMoving = true;
    currentBGMusic = null;


var windowBorder = {
  left:0,
  top:0,
  right:$(window).width(),
  bottom:$(window).height()
};


////////OBJECTS AND PROTOTYPE METHODS//////////////////////////////

function Block(x, y, w, h, color) {   //x coord, y coord, width, height
  this.html = $('<div>').addClass('block collideableObject').css({left:x, top:y, width:w, height:h, 'background-color': color}).appendTo('body');
}


/*  algorithm for ball and ball movement adapted from
http://bassistance.de/2011/12/09/vector-math-basics-to-animate-a-bouncing-ball-in-javascript/ */

function Ball(x, y, dx, dy) {
  this.x = x;
  this.y = y;
  this.dx = dx;       //delta x (change in position)
  this.dy = dy;       //delta y
  this.html = $('<div>').addClass('ball').css({left:this.x, top:this.y, width:BALLSIZE, height:BALLSIZE}).appendTo('body');
};

function Boss(x, y) {
  this.x = x;
  this.y = y;
  this.phaseX = Math.PI;
  this.phaseY = Math.PI;
  this.html = $('<div>').addClass('boss collideableObject').css({left: this.x, top:this.y }).appendTo('body');
};

function DownwardMovingObject(x, y, speed) {
  this.x = x;
  this.y = y;
  this.dy = speed;
}




Boss.prototype.moveSinusoidally = function() {
  if(bossIsMoving) {
    this.phaseX += 0.005;
    this.phaseY += 0.009;
    this.x = getNextSinusoidalPosition(this.phaseX, windowBorder.right/3, windowBorder.right/2.6);
    this.y = getNextSinusoidalPosition(this.phaseY, windowBorder.bottom/5, windowBorder.bottom/3);
    this.html.css({
      left: this.x,
      top: this.y
      });
  }
}


function getNextSinusoidalPosition(phase, amplitude, displacement) {
  return displacement + Math.sin(Math.PI*phase) * amplitude;
}


Ball.prototype.move = function() {
  this.x += this.dx;
  this.y += this.dy;
  this.html.css({
    left: this.x,
    top: this.y
    });
};

Ball.prototype.checkBorders = function() {
  if(this.y <= windowBorder.top) {
    this.dy = -this.dy;
    this.y = windowBorder.top;
    playSound("sounds/Arrow.wav");
  }
  else if(this.y >= windowBorder.bottom - 3*BALLSIZE) {
    if(debugging) {
      this.dy = -this.dy;
      this.y = windowBorder.bottom - 3*BALLSIZE;
      playSound("sounds/Arrow.wav");
    }
    else {        //////you die////////////////////////////////
      playerDied();
    }
  }
  if(this.x <= windowBorder.left) {
    this.dx = -this.dx;
    this.x = windowBorder.left;
    playSound("sounds/Arrow.wav");
  }
  else if(this.x >= windowBorder.right - BALLSIZE) {
    this.dx = -this.dx;
    this.x = windowBorder.right - BALLSIZE;
    playSound("sounds/Arrow.wav");
  }
}

Ball.prototype.checkCollision = function() {
  var ball = this;
  $('.collideableObject').each(function() {
    var objectPosition = $(this).offset();
    if(ball.dy > 0) {  //moving down
      var ballBorder = {
        x: ball.x+BALLSIZE/2,
        y: ball.y+BALLSIZE
      };
      if(pointIsWithinRectangle(ballBorder, objectPosition.left, objectPosition.top, $(this).width(), $(this).height())) {
        if($(this).hasClass('playerShip')) {
          ballHitShip();
        }
        else {
          ball.dy = -ball.dy;
          ball.y = Math.floor(objectPosition.top - BALLSIZE);
          collisionHappened(this);
        }
      }
    }
    else if(ball.dy < 0) {  //moving up
      var ballBorder = {
        x: ball.x+BALLSIZE/2,
        y: ball.y
      };
      if(pointIsWithinRectangle(ballBorder, objectPosition.left, objectPosition.top, $(this).width(), $(this).height())) {
        ball.dy = -ball.dy;
        ball.y = Math.floor(objectPosition.top + $(this).height());
        collisionHappened(this);
      }
    }
    if (ball.dx > 0) { // moving right
      var ballBorder = {
        x: ball.x + BALLSIZE,
        y: ball.y + BALLSIZE/2
      }
      if(pointIsWithinRectangle(ballBorder, objectPosition.left, objectPosition.top, $(this).width(), $(this).height())) {
        ball.dx = -ball.dx;
        ball.x = Math.floor(objectPosition.left - BALLSIZE);
        collisionHappened(this);
      }
    }
    else if (ball.dx < 0) {  // moving left
      var ballBorder = {
        x: ball.x,
        y: ball.y + BALLSIZE/2
      }
      if(pointIsWithinRectangle(ballBorder, objectPosition.left, objectPosition.top, $(this).width(), $(this).height())) {
        ball.dx = -ball.dx;
        ball.x = Math.floor(objectPosition.left + $(this).width());
        collisionHappened(this);
      }
    }
  });
}

//////////////////////OBJECT HELPER METHODS/////////////////////////////


function pointIsWithinRectangle(point, x, y, width, height) {
  if(point.x > x && point.x < x + width && point.y > y && point.y < y + height) {
    return true;
  }
  return false;
}

function playerDied() {
  playSound('sounds/Explosion.wav');
  $('.playerShip').hide("explode", 2000);
  $('.ball').hide("explode");
  clearInterval(interval);
  if(!infiniteLives) {
    livesRemaining--;
  }
  if(livesRemaining < 0) {
    gameOver();
  }
  else {
    setTimeout(resetPlayerShipAndBall, 2000);
  }
}

function resetPlayerShipAndBall() {
  $('.ball').remove();
  $('.playerShip').remove();
  initializeBall();
  initializePlayerShip();
  interval = null;
  paused = false;
}

function ballHitShip() {
  playSound('sounds/Bong.mp3');
  var $ship = $('.playerShip');
  var velocity = Math.sqrt(ball.dy*ball.dy + ball.dx*ball.dx);     // a^2 + b^2 = c^2
  var xShipGradient = (ball.x-$ship.offset().left) / ($ship.width());
  ball.dx = 2*MAX_DX*xShipGradient - MAX_DX;
  if(ball.dx < -MAX_DX) {
    ball.dx = -MAX_DX;
  }
  else if(ball.dx > MAX_DX) {
    ball.dx = MAX_DX;
  }
  if(ball.dx >= 0 && ball.dx < MIN_DX) {
    ball.dx = MIN_DX;
  }
  else if(ball.dx < 0 && ball.dx > -MIN_DX) {
    ball.dx = -MIN_DX;
  }
  ball.dy = -Math.sqrt(velocity*velocity - ball.dx*ball.dx);
}

function collisionHappened(collidee) {
  if($(collidee).hasClass('block')) {
    playSound("sounds/Bong.mp3");
    if(!$(collidee).hasClass('invincible')) {
      $(collidee).removeClass('collideableObject');
      $(collidee).hide('puff', 300, function() {
        $(collidee).remove();
      });
      blocksOnScreen--;
      if(blocksOnScreen <= 0) {
        levelCompleted();
      }
    }
  }
  else if($(collidee).hasClass('boss')) {
    bossIsMoving = false;
    $('.boss').effect('pulsate', 500);
    setTimeout(function(){ bossIsMoving = true; }, 500);
  }
}

/////////////INITIALIZATION FUNCTIONS/////////////////////////////




function levelLayout(level) {
  var rows = [];
  switch(level) {
  case 1:
    if(debugging) {     // remove at some point
      rows.push(['cyan']);
    }
    else {
    rows.push(['#003333']);
    rows.push([0, 0, '#00CC33', '#00CC33',  '#00CC33','#00CC33','#00CC33','#00CC33','#00CC33','#00CC33', 0, 0]);
    rows.push([0,'#CC6699','#CC6699','#00CC33', 0, 0, 0, 0,'#00CC33',  '#CC6699','#CC6699', 0]);
    rows.push(['#CC6699','#CC6699','#CC6699',0, 0, 0, 0, 0, 0, '#CC6699','#CC6699','#CC6699'])  ;
    rows.push([0,'#CC6699','#CC6699','#00CC33', 0, 0, 0,   0,'#00CC33','#CC6699','#CC6699', 0]);
    rows.push([0,   0,'#00CC33','#00CC33','#00CC33','#00CC33','#00CC33','#00CC33','#00CC33','#00CC33', 0, 0]);
    rows.push(['#003333']);  }
    return rows;
    break;
  case 2:
    rows.push(['gold','gold','gold','gold','gold','gold','gold','gold','gold','gold','gold']);
    rows.push([0]);
    rows.push([0,'brown','red','brown','red','brown','red','brown','red','brown','red']);
    rows.push([0,'brown','red','brown','red','brown','red','brown','red','brown','red']);
    rows.push([0,'brown','red','brown','red','brown','red','brown','red','brown','red']);
    rows.push([0,'brown','red','brown','red','brown','red','brown','red','brown','red']);
    rows.push([0,'brown','red','brown','red','brown','red','brown','red','brown','red']);
    rows.push([0,'gold','gold','gold','gold','gold','gold','gold','gold','gold','gold',]);
    return rows;
    break;
  case 3:
    rows.push(['gold','gold','gold','gold','gold','gold','gold','gold','gold','gold','gold','gold','gold','gold','gold','gold']);
    rows.push(['gold','blue','blue','blue','blue','blue','blue','gold','gold','blue','blue','blue','blue','blue','blue','gold']);
    rows.push(['gold','#0066CC',0,0,0 ,'#0066CC','#0066CC','#0066CC','#0066CC','#0066CC','#0066CC',0 ,0,0,'#0066CC','gold']);
    rows.push(['gold','#3399FF',0 ,'#990033',0 ,'#990033','#3399FF','#3399FF','#3399FF','#3399FF','#990033',0 ,'#990033',0,'#3399FF','gold']);
    rows.push(['gold','#0099CC',0 ,'#990033',0 ,'#0099CC','#990033','#0099CC','#0099CC','#990033','#0099CC',0 ,'#990033',0 ,'#0099CC','gold']);
    rows.push(['gold','#33CCCC',0 ,0 ,0 ,'#33CCCC','#33CCCC','#990033','#990033','#33CCCC','#33CCCC',0 ,0 ,0 ,'#33CCCC','gold']);
    rows.push(['gold','#33FFCC','#33FFCC','#33FFCC','#33FFCC','#33FFCC', 0,0 ,0, 0,'#33FFCC','#33FFCC','#33FFCC','#33FFCC','#33FFCC','gold']);
    rows.push(['gold','gold','gold','gold','gold','gold','gold',0 ,0 ,'gold','gold','gold','gold','gold','gold','gold',])
    return rows;
    break;
  case 4:
    rows.push([0]);
    rows.push([0]);
    rows.push(['gold']);
    rows.push([0 ,'#330000',0 ,'#330000',0 ,'#330000']);
    rows.push(['#990000','#990000','#990000']);
    rows.push(['#330000',0 ,'#330000',0 ,'#330000',0]);
    rows.push([0 ,'#FF6633',0 ,'#FF6633',0 ,'#FF6633',0 ,'#FF6633',0 ,'#FF6633',0 ,'#FF6633']);
    rows.push(['#990000','#990000','#990000','#990000','#990000','#990000']);
    rows.push(['#FF6633',0 ,'#FF6633',0 ,'#FF6633',0 ,'#FF6633',0 ,'#FF6633',0 ,'#FF6633',0]);
    rows.push([0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',]);
    rows.push(['#FFFFCC','#FFFFCC','#FFFFCC','#FFFFCC','#FFFFCC','#FFFFCC','#FFFFCC','#FFFFCC','#FFFFCC','#FFFFCC','#FFFFCC','#FFFFCC']);
    rows.push(['#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0 ,'#FFFF66',0]);
    return rows;
    break;
  case 5:
    if(debugging) {    // remove at some point
      rows.push(['#111111']);
    }
    else {
      rows.push([0, 'red', 'red', 0]);
      rows.push([0]);
      rows.push([0]);
      rows.push([0,0,0,0,0,'black','black','black','  black','black','black',0,0,0,0,0,]);
      rows.push([0,0,0,0,'gold','purple','purple',' purple','purple','purple','purple','gold',0, 0,0,0,]);
      rows.push([0,0,0,'black','purple','#383838',' #383838','#383838','#383838','#383838',' #383838','purple','black',0,0,0,]);
      rows.push([0,0,'black','purple','#505050',' #505050','#505050','#505050','#505050',' #505050','#505050','#505050','purple','black ',0,0]);
      rows.push([0,'black','black','black','black','  black','black','black','black','black','  black','black','black','black','black',0]);
       rows.push([0,0,'black','purple','#505050','  #505050','#505050','#505050','#505050','  #505050','#505050','#505050','purple',' black',0,0]);
      rows.push([0,0,0,'black','purple','#383838',' #383838','#383838','#383838','#383838',' #383838','purple','black',0,0,0,]);
      rows.push([0,0,0,0,'gold','purple','purple',' purple','purple','purple','purple','gold',0, 0,0,0,]);
      rows.push([0,0,0,0,0,'black','black','black','  black','black','black',0,0,0,0,0,]);
    }
    return rows;
    break;
  case 6:
    boss = new Boss(windowBorder.right/3, windowBorder.bottom/10);
    return rows;
    break;
  }
}

function initializeBall() {
  var y = windowBorder.bottom * 0.8;
  ball = new Ball(200, y, 3, -4);
}

function initializePlayerShip() {
  $('<div>').addClass('playerShip collideableObject').appendTo('body');
  $('.playerShip').draggable({axis: "x", containment: 'parent'});
  setInterval(function() {
    $('.playerShip').css({'box-shadow': randomShadowEffect()});
  }, 40);
}

function initializeLevel(level) {
  var backgroundUrl = getBGUrlForLevel(level);
  $('body').css({'background-image': 'url('+backgroundUrl+')' });
  if(currentLevel%5 == 0) {
    currentBGMusic = '#BossBattle';
  }
  else {
    currentBGMusic = '#ChronoTheme';
   }
  $(currentBGMusic)[0].loop=true;
  playMusic(currentBGMusic);
  initializeBlocks();
  initializeBall();
}

function initializeBlocks() {
  blocksOnScreen = 0;
  var rows = levelLayout(currentLevel);
  for(var i=0; i<rows.length; i++) {
    var row = rows[i];
    var n = row.length;
    var blockWidth = Math.floor(windowBorder.right/n-1);
    var blockHeight = Math.floor(windowBorder.bottom*0.04 + 7);
    for (var j=0; j<n; j++) {
      if (row[j] != 0 && row[j] != 'gold') {
        var block = new Block(windowBorder.right*(j/n), windowBorder.bottom * (i*0.05), blockWidth, blockHeight, row[j]);
        blocksOnScreen++;
      }
      else if(row[j] == 'gold') {
        var block = new Block(windowBorder.right*(j/n), windowBorder.bottom * (i*0.05), blockWidth, blockHeight, 'yellow');
        $(block.html).addClass('invincible');
      }
    }
  }
}

function getBGUrlForLevel(level) {
  switch(level) {
  case 1:
    return("images/Sun-outer-space-l.jpg");
    break;
  case 2:
    return("images/outer-space_00399584.jpg");
    break;
  case 3:
    return("images/outerspace.jpg");
    break;
  case 4:
    return("images/Outer-Space-Planets-22_www.FullHDWpp.com_.jpg");
    break;
  case 5:
    return("images/PIA16695-BlackHole-Corona-20130227.jpg");
    break;
  case 6:
    return("images/PIA16695-BlackHole-Corona-20130227.jpg");
    break;
  default:
    return("images/Sun-outer-space-l.jpg");
    break;
  }
}

function passwordForLevel(currentLevel) {
  switch(currentLevel) {
  case 2:
    return ('UPUPDOWNDOWN');
    break;
  case 3:
    return ('MARKTWAIN');
    break;
  case 4:
    return ("GATOLOCO");
    break;
  case 5:
    return ("LARGEMARGE");
    break;
  default:
    return ("");
    break;
  }
}

function stringToBool(aString) {
  if(aString == "false") {
    return false;
  }
  else return true;
}

function assignVariablesFromUrl() {
  var urlVariables = window.location.search.substring(1).split('&');
  if(urlVariables != "") {
    soundsEnabled = stringToBool((urlVariables[0].split('=')[1]));
    currentLevel = Number(urlVariables[1].split('=')[1]);
    infiniteLives = stringToBool(urlVariables[2].split('=')[1]);
  }
}



////////////GAME EVENT FUNCTIONS//////////////////////////////////




function playMusic(soundTag) {
  if(soundsEnabled) {
    $(soundTag)[0].play();
  }
}

function playSound(soundFile) {
  if(soundsEnabled) {
    var soundEffect = new Audio(soundFile);
    soundEffect.play();
  }
}

function congratulationAnimation(message) {
  $('.ball').addClass('ballEnlarge');
  setTimeout(function() {
    var congratulate = "<h1>"+message+"</h1>";
    $(congratulate).addClass('congratulations').appendTo('body');
    $('.ball').removeClass('ballEnlarge');
  }, 2000);
}

function levelCompleted() {
  currentLevel++;
  $('.block').remove();
  clearInterval(interval);
  interval = null;
  paused = false;
  if(currentLevel > FINAL_LEVEL) {
    gameWasBeat();
  }
  else {
    $(currentBGMusic)[0].pause();
    playMusic("#fanfare");
    congratulationAnimation('HELL YEAH!');
    var password = passwordForLevel(currentLevel);
    setTimeout(function() {
      $("<h1>Password: "+password+"</h1>").addClass('congratulations').appendTo('body');
    }, 3500);
    setTimeout(function() {
      $('.ball').remove()
      initializeLevel(currentLevel);
    }, 6000);
  }
}

function gameWasBeat() {
  congratulationAnimation("OH DAMN, YOU GOOD!");
  setTimeout(function() {
    $('.ball').remove();
    $(document).off('keyup');
    }, 2000);
    $(currentBGMusic)[0].pause();
    playMusic("#YouWin");
  setTimeout(function() {
    $("<h1>You Saved the Galaxy!</h1>").addClass('congratulations').appendTo('body');
    setTimeout(function() {
      $("<h1>And Rescued the Princess!</h1>").addClass('congratulations').appendTo('body');
      setTimeout(function() {
        $("<h1>And Avenged your Father!</h1>").addClass('congratulations').appendTo('body');
        setTimeout(function() {
          $('.congratulations').remove();
          $("<h1>Thanks for playin, bud</h1>").addClass('congratulations').css('margin-top', '20%').appendTo('body')
          setTimeout(function() {
            $("<h1>Here's a password: SPAMHUMBUG</h1><h1>You Earned It!</h1>").addClass('congratulations').appendTo('body');
          }, 2000);
        }, 10000);
      }, 5000);
    }, 5000);
  }, 5000);
}

function gameOver() {
   $('<h1>Game Over</h1>').addClass('congratulations').appendTo('body');
   $(document).off('keyup');
   setTimeout(function() {
     $('<h1>Refresh browser to play again</h1>').addClass('congratulations').appendTo('body');
   }, 3000);
}



////////////////////Graphic effects////////////////////////////




function randomShadowEffect() {
  var shadow1 = String('0 5px '+Math.floor((Math.random()*5)+20)+'px #FEFCC9');
  var shadow2 = String('0 '+Math.floor((Math.random()*5+8))+'px '+Math.floor((Math.random()*10+25))+'px #33FFFF');
  var shadow3 = String('20px '+Math.floor((Math.random()*20+50))+'px '+Math.floor((Math.random()*20+40))+'px #3366FF');
  var shadow4 = String('-20px '+Math.floor((Math.random()*20+50))+'px '+Math.floor((Math.random()*25+50))+'px #3333FF');
  var shadow5 = String('0 80px 70px #FF3333');
  var shadowEffect = shadow1+','+shadow2+','+shadow3+','+shadow4+','+shadow5;
  return(shadowEffect);
}


///////////////USER INPUT EVENTS///////////////////////////////



function keyHeldDown(event) {
  if(event.which === 37)  {  //left arrow, move ship left
    var x = $('.playerShip').offset().left;
    if(x>0) {
      $('.playerShip').css({left: x-playerShipSpeed});
    }
  }
  else if(event.which === 39)  {  //right arrow, move ship right
    var x = $('.playerShip').offset().left;
    if(x<windowBorder.right-$('.playerShip').width()) {
      $('.playerShip').css({left: x+playerShipSpeed});
    }
  }
}

function keyWasPressed(event) {
  if(event.which === 32)  {  //space key pressed, start interval
    if(!interval && !paused) {
      $('.congratulations').remove();
      interval = setInterval(gameLoop, timeDelay);
    }
  }
  else if(event.which === 80) { //'p' pressed. pause/unpause game
    pauseKeyPressed();
  }
  else if(event.which === 81) {  //'q' pressed, quit if paused
    if(paused == true) {
      window.location.href = 'home.html';
    }
  }
  else if(event.which === 83 && !paused)  {  // 's' pressed, toggle sound
    soundsEnabled = !soundsEnabled;
    if(!soundsEnabled) {
      $(currentBGMusic)[0].pause();
    }
    else {
      playMusic(currentBGMusic);
    }
  }
  else if(event.which === 90) {   //'z', for debugging. remove once we're sure ball won't get stuck in an infinite cycle
    ball.x=200;
    ball.y=200;
  }
}

function pauseKeyPressed() {
  if(paused == false) {
    paused = true;
    clearInterval(interval);
    interval = null;
    var message = $('<div><p>PAUSED</p><p>***Press p to continue, or q to quit***</p></div>').addClass('pauseMessage').appendTo('body');
    $(currentBGMusic)[0].pause();
  }
  else {
    paused = false;
    $('.pauseMessage').remove();
    $('.congratulations').remove();
    interval = setInterval(gameLoop, timeDelay);
    playMusic(currentBGMusic);
  }
}

function windowWasResized() {
  windowBorder.right = $(window).width();
  windowBorder.bottom = $(window).height();
}

function gameLoop() {
  if(boss) {
    boss.moveSinusoidally();
  }
  ball.move();
  ball.checkBorders();
  ball.checkCollision();
}

$(function() {
  $(window).resize(windowWasResized).trigger("resize");
  assignVariablesFromUrl();
  initializeLevel(currentLevel);
  initializePlayerShip();
  $('.playerShip').draggable({axis: "x", containment: 'parent'});
  $(document).keydown(function(event) {
    keyHeldDown(event)
  });
  $(document).keyup(function(event) {
    keyWasPressed(event)
  });
});


/////// Properties accessed by jquery /////////////////
/*<div class="ball" data-index="0" data-dx="" data-dy=""></div>

// to retrieve value
$currentBall.data("dy")
// to change value:
$currentBall.data("dy", 3)

*/
