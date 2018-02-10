(function() {
var video = document.getElementById('main-video');
var playBtn = document.getElementById('play-pause');
var exportBtn = document.getElementById('export');
var cutBtn = document.getElementById('add-point');
var progressPoint = document.getElementById('progress-point');
var cutPoints = [0];

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

        cutPoints.push(currentTime);
        lastCutPoint = currentTime;
    }

    function exportEvent() {
        var text = 'start,end\n';
        var sortedCutPoints = cutPoints.sort(function(a, b) { return a - b; });
        for (var i = 0, len = sortedCutPoints.length - 1; i < len; i++) {
            text += sortedCutPoints[i] + ',' + sortedCutPoints[i+1] + '\n';
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
    var width = 320;
    var minX = getProgressPointPositionX();
    var maxX = minX + width;
    var initLeft = progressPoint.offsetLeft;
    var duration = 0;

    video.addEventListener('loadedmetadata', function() {
        duration = video.duration;
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
        var currentPos = video.currentTime / duration * width + initLeft;
        progressPoint.style.left = currentPos + 'px';
    }, 30);
})();

})();