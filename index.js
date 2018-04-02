$(function() {
var video = $('#video-main')[0];
var duration = video.duration;
var initX = 0;
var minX = $('#progress-bar-played')[0].getBoundingClientRect().right;
var offsetLeft = $('#progress-drag').offset().left;
var progressBarWidth = 1046;
var maxX = minX + progressBarWidth;
var paused = true;
var points = [];
var disabled = true;

$('#add-affection-btn').click(function() {
  $('#affection-type').removeClass('disabled');
  $('#certainty').removeClass('disabled');
  $('#add-affection').addClass('remove');
});

$('#remove-affection-btn').click(function() {
  $('#affection-type').addClass('disabled');
  $('#certainty').addClass('disabled');
  $('#add-affection').removeClass('remove');
});

$('#progress-drag').mousedown(function(e) {
  initX = e.clientX;
  $('body').mouseup(function(e) {
    $('body').unbind('mouseup');
    $('body').unbind('mousemove');
  });
  $('body').mousemove(function(e) {
    var offset = e.clientX - initX;
    initX = e.clientX;
    if (initX < minX || initX > maxX)
      return;
    $('#progress-drag').css('left', initX - offsetLeft + 'px');
    $('#progress-bar-played').css('width', initX - offsetLeft + 4 + 'px');
    var currentTime = duration * (initX - offsetLeft) / progressBarWidth;
    video.currentTime = currentTime;
    return currentTime;
  })
});

function pausePlay() {
  if (paused) {
    paused = false;
    $('#pause-btn').removeClass('paused');
    video.play();
  }
  else {
    paused = true;
    $('#pause-btn').addClass('paused');
    video.pause();
  }
}

$('#pause-btn').click(pausePlay);
$(document).keyup(function(e) {
  var key = e.keyCode;
  if (key == 32)
    pausePlay();
});

video.addEventListener('timeupdate', function() {
  var currentTime = video.currentTime;
  var position = currentTime / duration * progressBarWidth;
  $('#progress-drag').css('left', position + 'px');
  $('#progress-bar-played').css('width', position + 4 + 'px');
});

video.addEventListener('ended', function() {
  paused = true;
  $('#pause-btn').addClass('paused');
  video.pause();
});
})