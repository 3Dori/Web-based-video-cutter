$(function() {
var video = $('#video-main')[0];
var duration = video.duration;
var VIDEO_TIME_CHANGE_STEP = 5;
var PROGRESS_DRAG_OFFSET = 7;
var minX = $('#progress-bar-played').offset().left + 8.5;
var progressBarWidth = $('#tag-view').width() - 17;
var maxX = minX + progressBarWidth;
var offsetLeft = $('#progress-bar').offset().left + PROGRESS_DRAG_OFFSET;
var submitProgressBarWidth = 813;
var MIN_POS_DIFF = 1;
var paused = true;
var nodes = [];
var currentNode;
var disabled = true;
var textFile;

$(window).resize(function() {
  minX = $('#progress-bar-played').offset().left + 8.5;
  progressBarWidth = $('#tag-view').width() - 17;
  maxX = minX + progressBarWidth;
  offsetLeft = $('#progress-bar').offset().left + PROGRESS_DRAG_OFFSET;
  newPosition = video.currentTime / video.duration * progressBarWidth;
  setPosition(newPosition);
  for (var i = 0, len = nodes.length; i < len; i++) {
    var node = nodes[i];
    node.element.css('left', timeToPos(node.time) - PROGRESS_DRAG_OFFSET + 'px');
  }
});

video.addEventListener('loadedmetadata', function() {
  duration = video.duration;
});

$('#submit').click(function() {
  $('#row').addClass('disabled');
  forcePause();
  $('#confirm-tags').css('display', 'block');
  $('#confirm-tags-tag-list').empty();
  for (var i = 0, len = nodes.length; i < len; i++) {
    var node = nodes[i];
    var pos = node.time / video.duration * submitProgressBarWidth - PROGRESS_DRAG_OFFSET;
    var newTag = $('<div class="tag"></div>');
    (function() {
      var certaintyTag = $('<div class="certainty-tag disabled">确<br/>信<br/>度<br/><span class="certainty-value"></span></div>');
      certaintyTag.appendTo(newTag);
      certaintyTag.find('.certainty-value').text(node.certainty);
      newTag.hover(function() {
        certaintyTag.removeClass('disabled');
      }, function() {
        certaintyTag.addClass('disabled');
      });
    })();
    newTag.appendTo('#confirm-tags-tag-list');
    newTag.addClass('tag-' + node.affection);
    newTag.css('left', pos);
  }
});

$('#back-to-edit').click(function() {
  $('#row').removeClass('disabled');
  $('#confirm-tags').css('display', 'none');
});

$('#next-step').click(function() {
  $('#confirm-tags').css('display', 'none');
  $('#confirm-info').css('display', 'block');

  $('#confirm-gameid').val($('#gameid').val());
  $('#confirm-gender').val($('#gender').val());
  $('#confirm-identity').val($('#identity').val());
  $('#confirm-playerid').val($('#playerid').val());
});

$('#prev-step').click(function() {
  $('#confirm-tags').css('display', 'block');
  $('#confirm-info').css('display', 'none');
});

$('#confirm-submit').click(function() {
  var text = 'time,affection,certainty\n';
  var sortedNodes = nodes.sort(function(a, b) { return a.time - b.time });
  for (var i = 0, len = sortedNodes.length; i < len; i++) {
    text += toHHMMSS(sortedNodes[i].time, true) + ',' + sortedNodes[i].affection + ',' + sortedNodes[i].certainty + '\n';
  }
  var blob = new Blob([text], { type: 'text/plain' });
  if (textFile !== null)
    window.URL.revokeObjectURL(textFile);
  textFile = window.URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.download = $('#confirm-gameid').val() + '_' + $('#confirm-playerid').val() + '_' + $('#confirm-gender').val() + '_' + $('#confirm-identity').val() + '.txt';
  console.log(a.download)
  a.href = textFile;
  a.click();
});

$('#add-affection').click(function() {
  disableAdd();
  forcePause();
  resetAffectionAndCertainty();
  var newTag = $('<div class="tag"></div>');
  newTag.appendTo('#tag-list');
  var selectedAffection = $('.affection-icon.selected').attr('id') || 'unselected';
  var time = video.currentTime;
  var certainty = $('#certainty-range').val();
  newTag.addClass('tag-' + selectedAffection);
  newTag.css('left', timeToPos(time) - PROGRESS_DRAG_OFFSET);
  newTag.click(function(e) {
    e.stopPropagation();
    setPosition(timeToPos(time));
    forcePause();
  });
  var certaintyTag = $('<div class="certainty-tag disabled">确<br/>信<br/>度<br/><span class="certainty-value"></span></div>');
  certaintyTag.appendTo(newTag);
  certaintyTag.find('.certainty-value').text(certainty);
  newTag.hover(function() {
    certaintyTag.removeClass('disabled');
  }, function() {
    certaintyTag.addClass('disabled');
  });
  currentNode = {
    time: time,
    affection: selectedAffection,
    certainty: certainty,
    element: newTag
  };
  nodes.push(currentNode);
  sortNodes();
});

$('#remove-affection').click(function() {
  enableAdd();
  var tag = currentNode.element;
  var index = nodes.indexOf(currentNode);
  if (index !== -1)
    nodes.splice(index, 1);
  tag.remove();
});

$('#prev-affection').click(function() {
  var index = nodes.indexOf(currentNode);
  if (index !== -1) {
    if (index === 0)
      return;
    currentNode = nodes[index - 1];
    setPosition(timeToPos(currentNode.time));
  }
  else {
    if (nodes.length === 0)
      return;
    var time = video.currentTime;
    if (nodes[0].time > time)
      return;
    if (nodes[nodes.length-1].time < time) {
      currentNode = nodes[nodes.length-1];
      setPosition(timeToPos(currentNode.time));
      return;
    }
    for (var i = 1, len = nodes.length; i < len; i++) {
      if (nodes[i-1].time < time && nodes[i].time > time) {
        currentNode = nodes[i-1];
        setPosition(timeToPos(currentNode.time));
        return;
      }
    }
  }
});

$('#next-affection').click(function() {
  var index = nodes.indexOf(currentNode);
  if (index !== -1) {
    if (index === nodes.length-1)
      return;
    currentNode = nodes[index + 1];
    setPosition(timeToPos(currentNode.time));
  }
  else {
    if (nodes.length === 0)
      return;
    var time = video.currentTime;
    if (nodes[0].time > time) {
      currentNode = nodes[0];
      setPosition(timeToPos(currentNode.time));
      return;
    }
    if (nodes[nodes.length-1].time < time)
      return;
    for (var i = 1, len = nodes.length; i < len; i++) {
      if (nodes[i-1].time < time && nodes[i].time > time) {
        currentNode = nodes[i];
        setPosition(timeToPos(currentNode.time));
        return;
      }
    }
  }
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
  var certainty = $(this).val()
  currentNode.certainty = certainty;
  currentNode.element.find('.certainty-value').text(certainty);
});

$('#progress-drag').mousedown(function(e) {
  $('body').mouseup(function(e) {
    $('body').unbind('mouseup');
    $('body').unbind('mousemove');
  });
  $('body').mousemove(function(e) {
    changeProgressByMousePos(e.clientX);
  })
});

$('#progress-bar').click(function(e) {
  changeProgressByMousePos(e.clientX);
})

$('#pause-btn').click(pausePlay);
$(document).keyup(function(e) {
  var key = e.keyCode;
  if (key == 32)
    pausePlay();
  if (key == 39)
    playNextSecs();
  if (key == 37)
    playPrevSecs();
});

video.addEventListener('timeupdate', function() {
  var position = timeToPos(video.currentTime);
  $('#progress-drag').css('left', position + 'px');
  $('#progress-bar-played').css('width', position + PROGRESS_DRAG_OFFSET - 2 + 'px');
  $('#current-time').text(toHHMMSS(video.currentTime));
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
  $('#add-remove-affection').removeClass('remove');
  $('#certainty-range').prop('disabled', true);
}

function disableAdd() {
  $('#affection-type').removeClass('disabled');
  $('#certainty').removeClass('disabled');
  $('#add-remove-affection').addClass('remove');
  $('#certainty-range').prop('disabled', false);
}

function resetAffectionAndCertainty() {
  $('.affection-icon').removeClass('selected');
  $('#neutral').addClass('selected');
  $('#certainty-range').val('3');
}

function sortNodes() {
  nodes.sort(function(n1, n2) {
    return n1.time - n2.time;
  });
}

function changeProgressByMousePos(pos) {
  if (pos < minX || pos > maxX)
    return;
  var position = pos - offsetLeft;
  setPosition(position);
  // checkNode(position);
}

function checkNode(position) {
  for (var i = 0, len = nodes.length; i < len; i++) {
    var node = nodes[i];
    var time = video.currentTime;
    if (Math.abs((node.time - time) / duration * progressBarWidth) < MIN_POS_DIFF) {
      currentNode = node;
      $('.affection-icon').removeClass('selected');
      $('#' + node.affection).addClass('selected');
      $('#certainty-range').val(node.certainty);
      disableAdd();
      return;
    }
  }
  $('.affection-icon').removeClass('selected');
  currentNode = null;
  enableAdd();
}

function timeToPos(time) {
  return time / duration * progressBarWidth;
}

function forcePause() {
  paused = true;
  $('#pause-btn').addClass('paused');
  video.pause();
}

function setPosition(position) {
  $('#progress-drag').css('left', position + 'px');
  $('#progress-bar-played').css('width', position + PROGRESS_DRAG_OFFSET - 2 + 'px');
  var currentTime = duration * position / progressBarWidth;
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

function playPrevSecs() {
  video.currentTime = Math.max(0, video.currentTime - VIDEO_TIME_CHANGE_STEP);
}

function playNextSecs() {
  video.currentTime = Math.min(video.currentTime + VIDEO_TIME_CHANGE_STEP, duration);
}

function toHHMMSS(sec, milli) {
    var totalSec = parseInt(sec, 10);
    var hours = Math.floor(totalSec / 3600);
    var minutes = Math.floor((totalSec - (hours * 3600)) / 60);
    var seconds = totalSec - (hours * 3600) - (minutes * 60);

    if (hours < 10) hours = "0" + hours;
    if (minutes < 10) minutes = "0" + minutes;
    seconds += sec - totalSec;
    if (milli)
      seconds = seconds.toFixed(1);
    else
      seconds = parseInt(seconds, 10);
    if (seconds < 10) seconds = "0" + seconds;
    return hours + ':' + minutes + ':' + seconds;
}
})