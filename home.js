
var soundEnabled = true;
    level = 1,
    infiniteLives = false;


function toggleSound() {
  var $soundButton = $('#toggleSound');
  if(soundEnabled)  {
    $($soundButton).text("sound: off");
    soundEnabled = false;
  }
  else {
    $($soundButton).text("sound: on");
    soundEnabled = true;
  }
};

function startGame() {
   var gameUrl = "game.html?soundsEnabled="+soundEnabled+"&currentLevel="+level+"&infiniteLives="+infiniteLives;
  window.location.href = gameUrl;
};

function aboutPage() {
  window.location.href = 'about.html';
}

function playFanfare() {
  if(soundEnabled)  {
    $("#fanfare")[0].play();
  }
}

function sendMessage(message) {
  var html = $('<p>'+message+'<p>').addClass('messages').appendTo('.messages');
  setTimeout(function(){
    $('.messages *').remove();
  }, 4000);
}

function addGlow(element, time) {
  $(element).addClass('glow');
  setTimeout(function(){
    $(element).removeClass('glow');
  }, time);
}

function addGlowClearPWPlayFanare() {
    addGlow('#password', 2000);
    playFanfare();
    setTimeout(function() {$('#password').val("")}, 2000);

}

function passwordEntered() {
  var userInput = $('#password').val().toUpperCase();
  if(userInput == "SPAMHUMBUG") {
    infiniteLives = !infiniteLives;
    addGlow('#password', 2000);
    $('#password').val("");
    if(infiniteLives) {
      playFanfare();
      sendMessage("You just got Infinite Lives!");
    }
    else {
      sendMessage("Infinite Lives turned off");
    }
  }
  else if(userInput == "UPUPDOWNDOWN") {
    level = 2;
    addGlowClearPWPlayFanare();
    sendMessage("Starting on Level 2!");
  }
  else if(userInput == "MARKTWAIN") {
    level = 3;
    addGlowClearPWPlayFanare();
    sendMessage("Starting on Level 3!");
  }
  else if(userInput == "GATOLOCO") {
    level = 4;
    addGlowClearPWPlayFanare();
    sendMessage("Starting on Level 4!");
  }
  else if(userInput == "LARGEMARGE") {
    level = 5;
    addGlowClearPWPlayFanare();
    sendMessage("Starting on Level 5!");
  }
}

$(function() {
  $('#toggleSound').on('click', toggleSound);
  $('#startGame').on('click', startGame);
  $('#aboutPage').on('click', aboutPage);
  $('#password').on('input propertychange', passwordEntered);
  $('button').hover(function() {
    $(this).addClass('glow');
  }, function() {
    $(this).removeClass('glow');
  });
});

