
var player1Ended = false;
var player2Ended = false;

// Connected user
var isStudent = true;

// media source (model, myrecords, web, local)
var mediaSource = null;

// html video element 1
var player1 = null;
var player1Container = null;

// html video element 2
var player2 = null;
var player2Container = null;


// sound that will be associated with video 1
var sound1 = null;

// sound that will be associated with video 2
var sound2 = null;

// stop recording
/*var stop = null;
 // start recording
 var record = null;*/

var stop = document.getElementById('record-stop');
// start recording
var record = document.getElementById('record-start');

// modal 1
var fileDialog1 = null;

// progress bar container
// var progressCtnr = document.getElementById('progressCtnr');

// wich kind of browser
var isFirefox = !!navigator.mozGetUserMedia;
var videoFile = !!navigator.mozGetUserMedia ? 'video.gif' : 'video.webm';

// recordAudio and recordVideo are used for merged VIDEO + AUDIO file
// recordVideo is used only for video
// audioRecorder is used for mp3 export
var recordAudio, recordVideo, audioRecorder;

// SPECTRUM ANALYSER
var audioContext = new AudioContext();
var audioInput = null,
        realAudioInput = null,
        inputPoint = null;
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;

// worker for merging audio + video
var workerPath = location.href.replace(location.href.split('/').pop(), '') + 'libraries/ffmpeg-asm.js';
var worker;
// file name to save / upload
var fileName;


// file opener
// caller (video-1, video-2, audio-1, audio-2)
var fileButtonCaller;

// INIT
$(document).ready(function() {

    TrackManager.initialize();
    // modal dialog
    fileDialog1 = $('#file-dialog-1');

    player1Container = $("#video-1-container");
    playerContainer = $("#video-2-container");


    record.disabled = false;
    stop.disabled = true;

    // handle modal file chooser opening event
    $('button[data-toggle=modal]').click(function() {
        if (typeof $(this).data('id') !== 'undefined') {
            fileButtonCaller = $(this).data('id');
        }
    });

    // handle modal file chooser closing event
    $('#file-dialog').on('hidden.bs.modal', function(e) {

        if (fileButtonCaller && fileButtonCaller !== 'undefined') {
            var videoSrc = '';
            var audioSrc = '';
            var mime = '';
            if ('teacher-tracks' === mediaSource) {

                $('.track-select:checked').each(function(index) {
                    var name = $(this).parents('tr').prop('id');
                    // get video media
                    var track = TrackManager.getTrack(name);
                    console.log(track);
                    mime = track.extension === 'mp4' ? 'video/mp4' : 'video/webm';
                    videoSrc = track.url;
                    // replace video par audio dans name
                    audioSrc = track.url.replace("video", "audio").replace(track.extension, "mp3");

                });

            }
            else if ('my-tracks' === mediaSource) {

                $('.track-select:checked').each(function(index) {

                    var name = $(this).parents('tr').prop('id');
                    // get video media
                    var track = TrackManager.getTrack(name);
                    mime = track.extension === 'mp4' ? 'video/mp4' : 'video/webm';
                    videoSrc = track.url;
                    // replace video with audio in "name"
                    audioSrc = track.url.replace("video", "audio").replace(track.extension, "mp3");

                });
            }
            else if ('web-track' === mediaSource) {

                videoSrc = $('#open-web-video').val();

                // create a new youtube video element :
                var html = '';
                html += '<video id="' + fileButtonCaller + '" controls="controls" preload="none"  width="480" height="270">';
                html += '   <source src="' + videoSrc + '" type="video/youtube" ></source>';
                html += '</video>';

                // happend html depending on player called
                if ('video-1' === fileButtonCaller) {
                    $("#video-1-container").children().remove();
                    $("#video-1-container").append(html);
                    initPlayer1();
                }
                else if ('video-2' === fileButtonCaller) {
                    $("#video-2-container").children().remove();
                    $("#video-2-container").append(html);
                    initPlayer2();
                }

                sound1 = null;
                sound2 = null;

                TrackManager.togglePlayerButtons();
            }
            else if ('local-track' === mediaSource) {
                sound1 = null;
                sound2 = null;
                TrackManager.togglePlayerButtons();
                // everything else is done by handleFileSelect() method
            }

            // from teacher tracks or student tracks
            if ('web-track' !== mediaSource && 'local-track' !== mediaSource) {
                var html = '';
                html += '<video id="' + fileButtonCaller + '"  src="' + videoSrc + '" controls="controls" width="480" height="270">';
                //html += '   <source src="' + videoSrc + '" type="'+mime+'" ></source>';
                html += '</video>';
                if ('video-1' === fileButtonCaller) {
                    $("#video-1-container").children().remove();
                    $("#video-1-container").append(html);
                    sound1 = new Audio(audioSrc);
                    initPlayer1();
                    TrackManager.togglePlayerButtons();
                }
                else if ('video-2' === fileButtonCaller) {
                    //player2.setSrc(videoSrc);
                    $("#video-2-container").children().remove();
                    $("#video-2-container").append(html);
                    sound2 = new Audio(audioSrc);
                    initPlayer2();
                    TrackManager.togglePlayerButtons();
                }
            }
        }
    });


    // abonner le bouton douverture de la fenêtre modale
    $('#open-file').change(function(e) {
        handleFileSelect(e);
    });

    $('.dropdown-menu a').click(function(e) {
        var rId = $(this).data('id');

        if (rId && 'undefined' !== rId) {
            mediaSource = rId;
            $('.modal-item').each(function(elem) {
                //console.log('id ' + rId + ' this ' + this.id);
                if (rId === this.id) {
                    //console.log('show ' + rId);
                    $('#' + rId).show();
                }
                else {
                    //console.log('hide ' + this.id);
                    $('#' + this.id).hide();
                }
            });
        }
        $(this).parents(".btn-group").find('#btn-title').text($(this).text());
    });



});

// handle start recording event
record.onclick = function() {
    record.disabled = true;
    stop.disabled = false;
    navigator.getUserMedia({audio: true, video: true}, function(stream) {

        var html = '';
        html += '<video id="video-2" controls="controls" preload="none"  width="480" height="270">';
        html += '   <source src="' + window.URL.createObjectURL(stream) + '" type="video/webm" ></source>';
        html += '</video>';

        $("#video-2-container").children().remove();
        $("#video-2-container").append(html);
        initPlayer2();

        //player2.setSrc(window.URL.createObjectURL(stream));
        player2.play();

        // var legalBufferValues = [256, 512, 1024, 2048, 4096, 8192, 16384];
        // sample-rates in at least the range 22050 to 96000.
        /*recordAudio = RecordRTC(stream, {
         // bufferSize: 2048,
         //sampleRate: 44100
         });*/

        //recordAudio.startRecording();

        // spectrum analyzer and Recorder instanciation (for mp3 export)
        gotStream(stream);

        audioRecorder.clear();
        audioRecorder.record();

        if (!isFirefox) {
            recordVideo = RecordRTC(stream, {
                type: 'video'
            });
            recordVideo.startRecording();
        }
        stop.disabled = false;
    }, function(error) {
        alert(JSON.stringify(error, null, '\t'));
    });

};

// handle stop recording event
stop.onclick = function() {

    record.disabled = false;
    stop.disabled = true;

    player2.setSrc('');
    fileName = generateFileName();

    // process files
    //recordAudio.stopRecording(function() {
    recordVideo.stopRecording(function() {
        // audio + video -> post blob after convertion
        //convertStreams(recordVideo.getBlob(), recordAudio.getBlob());
        audioRecorder.stop();
        audioRecorder.exportMP3(doneEncoding);

        //PostBlob(recordAudio.getBlob(), 'audio', 'audio_' + fileName + '.wav');
        PostBlob(recordVideo.getBlob(), 'video', 'video_' + fileName + '.webm');

    });
    //});
};
// local file selection
function handleFileSelect(evt) {

    var file = evt.target.files[0]; // FileList object

    if (file) {
        var reader = new FileReader();
        reader.onload = (function(theFile) {
            return function(e) {
                var html = '';
                html += '<video id="' + fileButtonCaller + '" controls="controls" preload="none"  width="480" height="270">';
                html += '   <source src="' + e.target.result + '" type="' + theFile.type + '" ></source>';
                html += '</video>';
                if ('video-1' === fileButtonCaller) {
                    $("#video-1-container").children().remove();
                    $("#video-1-container").append(html);
                    initPlayer1();
                    //player1.setSrc(e.target.result);
                }
                else if ('video-2' === fileButtonCaller) {
                    //player2.setSrc(e.target.result);
                    $("#video-2-container").children().remove();
                    $("#video-2-container").append(html);
                    initPlayer2();
                }
            };
        })(file);
        reader.readAsDataURL(file);
        fileDialog1.modal('hide');
    }
}


function generateFileName() {
    // Generate unique name
    var date = new Date();

    var month = date.getMonth();
    if (month < 10)
        month = '0' + month.toString();

    var day = date.getDay();
    if (day < 10)
        day = '0' + day.toString();

    var hours = date.getHours();
    if (hours < 10)
        hours = '0' + hours;

    var minutes = date.getMinutes();
    if (minutes < 10)
        minutes = '0' + minutes;

    var seconds = date.getSeconds();
    if (seconds < 10)
        seconds = '0' + seconds;

    return date.getFullYear() + '-' + month + '-' + day + '_' + hours + 'h' + minutes + 'm' + seconds;
}

function processInWebWorker() {
    var blob = URL.createObjectURL(new Blob(['importScripts("' + workerPath + '");var now = Date.now;function print(text) {postMessage({"type" : "stdout","data" : text});};onmessage = function(event) {var message = event.data;if (message.type === "command") {var Module = {print: print,printErr: print,files: message.files || [],arguments: message.arguments || [],TOTAL_MEMORY: message.TOTAL_MEMORY || false};postMessage({"type" : "start","data" : Module.arguments.join(" ")});postMessage({"type" : "stdout","data" : "Received command: " +Module.arguments.join(" ") +((Module.TOTAL_MEMORY) ? ".  Processing with " + Module.TOTAL_MEMORY + " bits." : "")});var time = now();var result = ffmpeg_run(Module);var totalTime = now() - time;postMessage({"type" : "stdout","data" : "Finished processing (took " + totalTime + "ms)"});postMessage({"type" : "done","data" : result,"time" : totalTime});}};postMessage({"type" : "ready"});'], {
        type: 'application/javascript'
    }));

    var worker = new Worker(blob);
    URL.revokeObjectURL(blob);
    return worker;
}



function convertStreams(videoBlob, audioBlob) {
    var vab;
    var aab;
    var buffersReady;
    var workerReady;
    var posted = false;

    var fileReader1 = new FileReader();
    fileReader1.onload = function() {
        vab = this.result;

        if (aab)
            buffersReady = true;

        if (buffersReady && workerReady && !posted)
            postMessage();
    };
    var fileReader2 = new FileReader();
    fileReader2.onload = function() {
        aab = this.result;

        if (vab)
            buffersReady = true;

        if (buffersReady && workerReady && !posted)
            postMessage();
    };

    fileReader1.readAsArrayBuffer(videoBlob);
    fileReader2.readAsArrayBuffer(audioBlob);

    if (!worker) {
        console.log('NEW WORKER INSTANCE');
        worker = processInWebWorker();
    }


    worker.onmessage = function(event) {
        var message = event.data;

        //var progress = getProgress(event.data.from, event.data.to);
        if (message.type === "ready") {
            console.log('WORKER READY');
            workerReady = true;
            if (buffersReady)
                postMessage();
        } else if (message.type === "stdout") {
            //console.log(message);
        } else if (message.type === "start") {
            console.log('WORKER STARTED');
        } else if (message.type === "done") {
            console.log('WORKER DONE');

            var result = message.data[0];
            //console.log(JSON.stringify(result));

            var blob = new Blob([result.data], {
                type: 'video/mp4'
            });

            //console.log(JSON.stringify(blob));

            fileName = 'av_' + generateFileName() + '.mp4';
            PostBlob(blob, 'av', fileName);
            worker = null;
        }
    };
    worker.onerror = function(e) {
        console.log(e.message);
    };
    var postMessage = function() {
        posted = true;
// video encoded with mpeg4 codec and audio with vorbis....
        worker.postMessage({
            type: 'command',
            arguments: ['-i', videoFile, '-i', 'audio.wav', '-c:v', 'mpeg4', '-c:a', 'aac', '-b:v', '500k', '-b:a', '256k', '-strict', 'experimental', 'output.mp4'],
            files: [
                {
                    data: new Uint8Array(vab),
                    name: videoFile
                },
                {
                    data: new Uint8Array(aab),
                    name: "audio.wav"
                }
            ]
        });
    };
}



function PostBlob(blob, fileType, fileName) {
    console.log('PostBlob is invoked', arguments);
    // FormData
    var formData = new FormData();
    formData.append(fileType + '-filename', fileName);
    formData.append(fileType + '-blob', blob);

    var owner = isStudent ? 'student' : 'teacher';
    formData.append(fileType + '-owner', owner);


    // POST the Blob
    xhr('save.php', formData, null, function(fileURL) {

    });
}

function deleteAudioVideoFiles() {
    deleteFiles.disabled = true;
    if (!fileName)
        return;
    var formData = new FormData();
    formData.append('delete-file', fileName);
    xhr('delete.php', formData, null, function(response) {
        console.log(response);
    });
    fileName = null;
    progressCtnr.innerHTML = '';
}

function xhr(url, data, progress, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status === 200) {
            //callback(request.responseText);
            var track = JSON.parse(request.responseText);
            TrackManager.addTrack(track);
            console.log('success');
            console.log(track);

            if ('video' === track.type) {
                var html = '';
                html += '<video id="video-2" controls="controls"  width="480" height="270">';
                html += '   <source src="' + track.url + '" type="video/webm" ></source>';
                html += '</video>';
                $("#video-2-container").children().remove();
                $("#video-2-container").append(html);
                initPlayer2();
            }
            else if ('audio' === track.type) {
                sound2 = new Audio(track.url);
            }
        }
    };

    request.upload.onprogress = function(e) {
        if (!progress)
            return;
        if (e.lengthComputable) {
            progress.value = (e.loaded / e.total) * 100;
            progress.textContent = progress.value; // Fallback for unsupported browsers.
        }

        if (progress.value === 100) {
            progress.value = 0;
        }
    };
    request.open('POST', url);
    request.send(data);
}


function drawWave(buffers) {
    var canvas = document.getElementById("wavedisplay");
    drawBuffer(canvas.width, canvas.height, canvas.getContext('2d'), buffers[0]);
}


function cancelAnalyserUpdates() {
    window.cancelAnimationFrame(rafID);
    rafID = null;
}

function updateAnalysers(time) {
    //console.log(time);
    if (!analyserContext) {
        var canvas = document.getElementById("analyser");
        canvasWidth = canvas.width;
        canvasHeight = canvas.height;
        analyserContext = canvas.getContext('2d');
    }

    // analyzer draw code here
    {
        var SPACING = 3;
        var BAR_WIDTH = 1;
        var numBars = Math.round(canvasWidth / SPACING);
        var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);

        analyserNode.getByteFrequencyData(freqByteData);

        analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
        analyserContext.fillStyle = '#F6D565';
        analyserContext.lineCap = 'round';
        var multiplier = analyserNode.frequencyBinCount / numBars;

        // Draw rectangle for each frequency bin.
        for (var i = 0; i < numBars; ++i) {
            var magnitude = 0;
            var offset = Math.floor(i * multiplier);
            // gotta sum/average the block, or we miss narrow-bandwidth spikes
            for (var j = 0; j < multiplier; j++)
                magnitude += freqByteData[offset + j];
            magnitude = magnitude / multiplier;
            var magnitude2 = freqByteData[i * multiplier];
            analyserContext.fillStyle = "hsl( " + Math.round((i * 360) / numBars) + ", 100%, 50%)";
            analyserContext.fillRect(i * SPACING, canvasHeight, BAR_WIDTH, -magnitude);
        }
    }

    rafID = window.requestAnimationFrame(updateAnalysers);
}


function gotStream(stream) {
    inputPoint = audioContext.createGain();

    // Create an AudioNode from the stream.
    realAudioInput = audioContext.createMediaStreamSource(stream);
    audioInput = realAudioInput;
    audioInput.connect(inputPoint);

    analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    inputPoint.connect(analyserNode);

// for audio MP3 export
    audioRecorder = new Recorder(inputPoint);

    zeroGain = audioContext.createGain();
    zeroGain.gain.value = 0.0;
    inputPoint.connect(zeroGain);
    zeroGain.connect(audioContext.destination);
    updateAnalysers();
}

// mp3 encoding callback
function doneEncoding(blob) {

    /*console.log(blob);
     fileName = generateFileName();//Math.round(Math.random() * 99999999) + 99999999;*/
    PostBlob(blob, 'audio', 'audio_' + fileName + '.mp3');
}

function initPlayer1() {
    player1 = new MediaElementPlayer('#video-1', {
        enableAutosize: false,
        pauseOtherPlayers: false,
        features: ['playpause', 'progress', 'current', 'duration', 'tracks', 'volume', 'fullscreen'],
        success: function(mediaElement, domObject) {
            mediaElement.addEventListener('timeupdate', function(e) {

            }, false);

            mediaElement.addEventListener('ended', function(e) {
                player1Ended = true;
                TrackManager.deletePlaying('video-1');
                TrackManager.togglePlayerButtons();
            }, false);
        },
        error: function() {
            console.log('PLayer 1 error');
        }
    });
}

function initPlayer2() {
    player2 = new MediaElementPlayer('#video-2', {
        enableAutosize: false,
        pauseOtherPlayers: false,
        features: ['playpause', 'progress', 'current', 'duration', 'tracks', 'volume', 'fullscreen'],
        success: function(mediaElement, domObject) {
            mediaElement.addEventListener('timeupdate', function(e) {
                //document.getElementById('current-time').innerHTML = mediaElement.currentTime;
            }, false);

            mediaElement.addEventListener('ended', function(e) {
                player2Ended = true;
                TrackManager.deletePlaying('video-2');
                TrackManager.togglePlayerButtons();
            }, false);
        },
        error: function() {
            console.log('PLayer 2 error');
        }
    });
}
