$(function() {
var video = $('#video-main')[0];
var duration = video.duration;
var minX = $('#progress-bar-played')[0].getBoundingClientRect().right;
var offsetLeft = $('#progress-drag').offset().left;
var PROGRESS_BAR_WIDTH = 1046;
var maxX = minX + PROGRESS_BAR_WIDTH;
var PROGRESS_DRAG_OFFSET = 6;
var MIN_POS_DIFF = 10;
var paused = true;
var nodes = [];
var currentNode;
var disabled = true;
var textFile;

video.addEventListener('loadedmetadata', function() {
  duration = video.duration;
});

$('#submit-btn').click(function() {
  if (confirm('是否确认提交？')) {
    var text = 'time,affection,certainty\n';
    var sortedNodes = nodes.sort(function(a, b) { return a.time - b.time });
    for (var i = 0, len = sortedNodes.length; i < len; i++) {
      text += toHHMMSSsss(sortedNodes[i].time) + ',' + sortedNodes[i].affection + ',' + sortedNodes[i].certainty + '\n';
    }
    var blob = new Blob([text], { type: 'text/plain' });
    if (textFile !== null)
      window.URL.revokeObjectURL(textFile);
    textFile = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.download = $('#gameid').val() + '_' + $('#playerid').val() + '.txt';
    a.href = textFile;
    a.click();
  };
})

$('#add-affection-btn').click(function() {
  disableAdd();
  var newTag = $('<div class="tag"></div>');
  newTag.appendTo('#tag-list');
  var selectedAffection = $('.affection-icon.selected').attr('id');
  var position = timeToPos(video.currentTime);
  newTag.addClass('tag-' + selectedAffection);
  newTag.css('left', position - PROGRESS_DRAG_OFFSET);
  newTag.click(function() {
    setPosition(position);
    forcePause();
  })
  currentNode = {
    pos: position,
    time: video.currentTime,
    affection: selectedAffection,
    certainty: $('#certainty-range').val(),
    element: newTag
  };
  nodes.push(currentNode);
});

$('#remove-affection-btn').click(function() {
  enableAdd();
  var tag = currentNode.element;
  var index = nodes.indexOf(currentNode);
  if (index !== -1)
    nodes.splice(index, 1);
  tag.remove();
});

$('.affection-icon').click(function() {
  if ($('#affection-type').hasClass('disabled'))
    return;
  $('.affection-icon').removeClass('selected');
  $(this).addClass('selected');

  var affection = $(this).attr('id');
  var tag = currentNode.element;
  tag.removeClass();
  tag.addClass('tag');
  tag.addClass('tag-' + affection);
  currentNode.affection = affection;
});

$('#certainty-range').change(function() {
  currentNode.certainty = $(this).val();
});

$('#progress-drag').mousedown(function(e) {
  $('body').mouseup(function(e) {
    $('body').unbind('mouseup');
    $('body').unbind('mousemove');
  });
  $('body').mousemove(function(e) {
    var initX = e.clientX;
    if (initX < minX || initX > maxX)
      return;
    var position = initX - offsetLeft;
    setPosition(position);
    checkNode(position);
  })
});

$('#pause-btn').click(pausePlay);
$(document).keyup(function(e) {
  var key = e.keyCode;
  if (key == 32)
    pausePlay();
});

video.addEventListener('timeupdate', function() {
  var position = timeToPos(video.currentTime);
  $('#progress-drag').css('left', position + 'px');
  $('#progress-bar-played').css('width', position + PROGRESS_DRAG_OFFSET + 'px');
  checkNode(position);
});

video.addEventListener('ended', function() {
  paused = true;
  $('#pause-btn').addClass('paused');
  video.pause();
});

function enableAdd() {
  $('#affection-type').addClass('disabled');
  $('#certainty').addClass('disabled');
  $('#add-affection').removeClass('remove');
  $('#certainty-range').prop('disabled', true);
}

function disableAdd() {
  $('#affection-type').removeClass('disabled');
  $('#certainty').removeClass('disabled');
  $('#add-affection').addClass('remove');
  $('#certainty-range').prop('disabled', false);
}

function checkNode(position) {
  for (var i = 0, len = nodes.length; i < len; i++) {
    var node = nodes[i];
    if (Math.abs(node.pos - position) < MIN_POS_DIFF) {
      currentNode = node;
      $('.affection-icon').removeClass('selected');
      $('#' + node.affection).addClass('selected');
      $('#certainty-range').val(node.certainty);
      disableAdd();
      return;
    }
  }
  enableAdd();
}

function timeToPos(time) {
  return time / duration * PROGRESS_BAR_WIDTH;
}

function forcePause() {
  paused = true;
  $('#pause-btn').addClass('paused');
  video.pause();
}

function setPosition(position) {
  $('#progress-drag').css('left', position + 'px');
  $('#progress-bar-played').css('width', position + PROGRESS_DRAG_OFFSET + 'px');
  var currentTime = duration * position / PROGRESS_BAR_WIDTH;
  video.currentTime = currentTime;
}

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

function toHHMMSSsss(sec) {
    var totalSec = parseInt(sec, 10);
    var hours = Math.floor(totalSec / 3600);
    var minutes = Math.floor((totalSec - (hours * 3600)) / 60);
    var seconds = totalSec - (hours * 3600) - (minutes * 60);

    if (hours < 10) hours = "0" + hours;
    if (minutes < 10) minutes = "0" + minutes;
    seconds += sec - totalSec;
    seconds = seconds.toFixed(1);
    if (seconds < 10) seconds = "0" + seconds;
    return hours + ':' + minutes + ':' + seconds;
}
})