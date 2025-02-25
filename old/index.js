(function() {
var video = document.getElementById('main-video');
var playBtn = document.getElementById('play-pause');
var exportBtn = document.getElementById('export');
var cutBtn = document.getElementById('add-point');
var progressPoint = document.getElementById('progress-point');
var cutPointList = document.getElementById('cut-point-list');
var tbody =  document.getElementById('list-tbody');

var width = 480;
var initLeft = progressPoint.offsetLeft;
var duration = 0;

var cutPoints = [];
var moodOptionsText = ['无', '', '喜悦', '乐观', '轻松', '惊奇', '温和', '依赖', '无聊', '悲伤', '恐惧', '焦虑', '藐视', '厌恶', '愤懑', '敌意'];

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

function getPosByTime(time) {
    return time / duration * width + initLeft;
}

(function handlePlayPause() {
    var paused = true;
    var lastCutPoint = 0;
    var textFile = null;

    function playPause() {
        if (paused) {
            video.play();
            paused = false;
        }
        else {
            video.pause();
            paused = true;
        }
        playBtn.classList.toggle('paused');
    }

    function cutEvent() {
        var currentTime = video.currentTime;
        if (currentTime === lastCutPoint)    // duplicated cut point
            return;

        cutPoints.push({time: currentTime});
        cutPoints = cutPoints.sort(function(a, b) { return a.time - b.time; });

        lastCutPoint = currentTime;
        redrawTable();
        redrawProgressBar();
    }

    function redrawProgressBar() {
        cutPointList.innerHTML = '';
        for (var i = 0, len = cutPoints.length; i < len; i++) {
            var pos = getPosByTime(cutPoints[i].time);
            var newPoint = document.createElement('div');
            newPoint.classList.add('cut-point');
            newPoint.style.left = pos + 'px';
            cutPointList.appendChild(newPoint);
            var tooltip = document.createElement('span');
            tooltip.innerHTML = moodOptionsText[cutPoints[i].mood] + ': ' + cutPoints[i].amplitude;
            tooltip.classList.add('tooltiptext');
            newPoint.appendChild(tooltip);
        }
    }

    function redrawTable() {
        tbody.innerHTML = '';
        for (var i = 0, len = cutPoints.length; i < len; i++) {
            var row = tbody.insertRow(i);
            var control = row.insertCell(0)
            var time = row.insertCell(1);
            var mood = row.insertCell(2);
            var amplitude = row.insertCell(3);

            var playBtn = document.createElement('a');
            playBtn.innerHTML = '定位';
            playBtn.href = 'javascript:void(0)';
            (function wrap(i) {
                playBtn.addEventListener('click', function() {
                    video.currentTime = cutPoints[i].time;
                    video.pause();
                    playBtn.classList.add('paused');
                    var currentPos = getPosByTime(video.currentTime);
                    progressPoint.style.left = currentPos + 'px';
                }, false);
            })(i);
            control.appendChild(playBtn);

            var removeBtn = document.createElement('a');
            removeBtn.innerHTML = '删除';
            removeBtn.href = 'javascript:void(0)';
            (function wrap(i) {
                removeBtn.addEventListener('click', function() {
                    cutPoints.splice(i, 1);
                    redrawTable();
                    redrawProgressBar();
                }, false);
            })(i);
            control.appendChild(removeBtn);

            time.innerHTML = toHHMMSSsss(cutPoints[i].time);

            var moodSelect = document.createElement('select');
            for (var j = 0, jlen = moodOptionsText.length; j < jlen; j++) {
                var option = document.createElement('option');
                option.text = moodOptionsText[j];
                option.value = j;
                moodSelect.add(option);
            }
            mood.appendChild(moodSelect);
            if (typeof cutPoints[i].mood !== 'undefined')
                moodSelect.value = cutPoints[i].mood;
            else
                cutPoints[i].mood = '0';
            (function wrap(i) {
                moodSelect.addEventListener('change', function(e) {
                    cutPoints[i].mood = e.target.value;
                    redrawProgressBar();
                }, false);
            })(i);
            
            var amplitudeInput = document.createElement('input');
            amplitudeInput.setAttribute('type', 'range');
            amplitudeInput.setAttribute('min', '1');
            amplitudeInput.setAttribute('max', '7');
            amplitudeInput.setAttribute('step', '1');
            amplitude.appendChild(amplitudeInput);

            var amplitudeVal = document.createElement('div');
            amplitudeVal.innerHTML = '<span style="float:left">1</span><span style="float:right">7</span>';
            amplitude.appendChild(amplitudeVal);
            if (typeof cutPoints[i].amplitude !== 'undefined')
                amplitudeInput.value = cutPoints[i].amplitude;
            else
                cutPoints[i].amplitude = '4';
            (function wrap(i) {
                amplitudeInput.addEventListener('change', function(e) {
                    cutPoints[i].amplitude = e.target.value;
                    redrawProgressBar();
                }, false);
            })(i);
        }
    }

    function exportEvent() {
        var text = 'start,end,mood,amplitude\n';
        cutPoints = cutPoints.sort(function(a, b) { return a.time - b.time; });
        for (var i = 0, len = cutPoints.length - 1; i < len; i++) {
            text += cutPoints[i].time + ',' + cutPoints[i+1].time + ','
                + (typeof cutPoints[i].mood !== 'undefined' ? cutPoints[i].mood : '0') + ','
                + (typeof cutPoints[i].amplitude !== 'undefined' ? cutPoints[i].amplitude : '4') + '\n';
        }
        var data = new Blob([text], { type: 'text/plain' });
        if (textFile !== null)
            window.URL.revokeObjectURL(textFile)
        textFile = window.URL.createObjectURL(data);

        var a = document.createElement('a');
        a.download = 'cut_point.txt';
        a.href = textFile;
        a.click();
    }

    playBtn.addEventListener('click', playPause);
    cutBtn.addEventListener('click', cutEvent);
    exportBtn.addEventListener('click', exportEvent);

    window.addEventListener('keyup', function(e) {
        var key = e.keyCode;

        if (key === 32)
            playPause();
        else if (key === 88)
            cutEvent();
    })
})();

(function handleMouseEvent() {
    var initX = 0;
    var minX = getProgressPointPositionX();
    var maxX = minX + width;

    video.addEventListener('loadedmetadata', function() {
        duration = video.duration;
        video.controls = true;
    })

    progressPoint.addEventListener('mousedown', mousedownEvent);

    function getProgressPointPositionX() {
        var rect = progressPoint.getBoundingClientRect()
        return (rect.left + rect.right) / 2;
    }

    function mousedownEvent(e) {
        initX = e.clientX;
        document.addEventListener('mouseup', mouseupEvent);
        document.addEventListener('mousemove', mousemoveEvent);
    }

    function mouseupEvent() {
        document.removeEventListener('mouseup', mouseupEvent);
        document.removeEventListener('mousemove', mousemoveEvent);
    }

    function mousemoveEvent(e) {
        var offset = e.clientX - initX;
        initX = e.clientX;
        if (initX >= minX && initX <= maxX)
            progressPoint.style.left = (progressPoint.offsetLeft + offset) + 'px';
        var currentX = getProgressPointPositionX();
        var currentTime = duration * (currentX - minX) / width;
        video.currentTime = currentTime;
    }

    setInterval(function() {
        if (video.paused)
            return;
        var currentPos = getPosByTime(video.currentTime);
        progressPoint.style.left = currentPos + 'px';
    }, 30);
})();

})();