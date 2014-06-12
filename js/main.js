var player1Ended = false;
var player2Ended = false;
// Connected user
var userId = '';
var isStudent = true;
// media source (model, myrecords, web, local)
var mediaSource = null;
// html video element 1
var player1 = null;
var player1Container = null;
// html video element 2
var player2 = null;
var player2Container = null;
// stop recording button
var stop;
// start recording button
var record;
var recorder; // video && audio recorder
// MIC LEVEL ANALYSER
var audioContext;
// we have to do that before webrtc.js is loaded in order to avoid conflicts
if (window.AudioContext || window.webkitAudioContext) {
    if (window.webkitAudioContext) {
        audioContext = new window.webkitAudioContext();
    } else {
        audioContext = new window.AudioContext();
    }
} else {
    console.log('no audio context');
}
var audioInput = null,
    realAudioInput = null,
    inputPoint = null;
var rafID = null;
var analyserContext = null;
var canvasWidth, canvasHeight;
var gradient;
// file name to save / upload
var fileName;
// file opener caller (video-1, video-2)
var fileButtonCaller;
// ON DOCUMENT READY
$(document).ready(function() {
    // open authentication modal
    var options = {
        "backdrop": "static",
        "keyboard": false,
        "show": true
    };
    $('#authentication-dialog').modal(options);
    $('#authentication-dialog').on('shown.bs.modal', function(e) {
        $('#usr-ok').prop('disabled', true);
        // firefox keep the login used in the textbox
        if ($('#user').val() !== '') {
            $('#usr-ok').prop('disabled', false);
        } else {
            // control text-input
            $('#user').on('input', function() {
                if ($(this).val() !== '') {
                    $('#usr-ok').prop('disabled', false);
                } else {
                    $('#usr-ok').prop('disabled', true);
                }
            });
        }
    });
    $('#authentication-dialog').on('hidden.bs.modal', function(e) {
        // sanitize user_id (for folder creation)
        userId = $('#user').val().replace(' ', '').replace(/[^a-zA-Z0-9]/g, '_');
        // for display let the user friendly name
        $('#user-name').html('<span class="glyphicon glyphicon-user"></span> ' + $('#user').val());
        // init app and bind events
        init();
    });
});
// INIT APP & BIND EVENTS
function init() {
    TrackManager.initialize(userId);
    // stop recording button
    stop = document.getElementById('record-stop');
    stop.disabled = true;
    // start recording button
    record = document.getElementById('record-start');
    record.disabled = false;
    player1Container = $("#video-1-container");
    player2Container = $("#video-2-container");
    // handle file source button click event 
    $('button[data-toggle=modal]').click(function() {
        if (typeof $(this).data('id') !== 'undefined') {
            fileButtonCaller = $(this).data('id');
            if (fileButtonCaller === 'video-1' || fileButtonCaller === 'video-2') {
                // hide all
                $('.modal-item').each(function() {
                    $('#' + this.id).hide();
                });
                // uncheck all radio buttons
                $('.track-select').each(function() {
                    if (this.checked) this.checked = false;
                });
                // reset h5 title
                $('h5.selected-title').text('');
                // show only available options
                $('.dropdown-menu li').each(function() {
                    if ('video-1' === fileButtonCaller) {
                        $(this).css('display', '');
                    } else if ($(this).children().first('a').data('id') !== "my-tracks") {
                        $(this).css('display', 'none');
                    }
                });
            }
            /*RecordRTC.getFromDisk('all', function(dataURL, type) {
                console.log(dataURL + ' | ' + type);
            });*/
        }
    });
    // handle modal file chooser closing event
    $('#file-dialog').on('hidden.bs.modal', function(e) {
        // disable download 'just recorded file' button       
        // $('#download').prop('disabled', true);
        if (fileButtonCaller && fileButtonCaller !== 'undefined') {
            var videoSrc = '';
            //var audioSrc = '';
            var mime = '';
            var hasFile = false;
            if (mediaSource) {
                // open my track or teacher track
                if ($('.track-select:checked')[0] && ('teacher-tracks' === mediaSource || 'my-tracks' === mediaSource)) {
                    var name = $('.track-select:checked').parents('tr').prop('id');
                    var track = TrackManager.getTrack(name);
                    mime = track.extension === 'mp4' ? 'video/mp4' : 'video/webm';
                    videoSrc = track.url;
                    hasFile = true;
                }
                // open web track (youtube)
                else if ('web-track' === mediaSource && $('#open-web-video').val()) {
                    videoSrc = $('#open-web-video').val();
                    // create a new youtube video element :
                    var html = '';
                    html += '<video id="' + fileButtonCaller + '" controls="controls" preload="none" width="100%" height="270">';
                    html += '   <source src="' + videoSrc + '" type="video/youtube" ></source>';
                    html += '</video>';
                    // happend html depending on player called
                    if ('video-1' === fileButtonCaller) {
                        $("#video-1-container").children().remove();
                        $("#video-1-container").append(html);
                        initPlayer1();
                    } else if ('video-2' === fileButtonCaller) {
                        $("#video-2-container").children().remove();
                        $("#video-2-container").append(html);
                        initPlayer2();
                    }
                    TrackManager.togglePlayerButtons();
                }
                // other computer track 
                else if ('local-track' === mediaSource) {
                    //sound1 = null;
                    //sound2 = null;
                    TrackManager.togglePlayerButtons();
                    // everything else is done by handleFileSelect() method
                }
                // from teacher tracks or student tracks
                if ('web-track' !== mediaSource && 'local-track' !== mediaSource && hasFile) {
                    var html = '';
                    // Kind of Chrome Hack... Chrome is not able to play at the same time the same source : http://stackoverflow.com/questions/19375877/chrome-not-play-html5-video-on-duplicated-tags
                    /*if ('video-1' === fileButtonCaller) {
                        videoSrc += '?1';
                        audioSrc += '?1';
                    } else if ('video-2' === fileButtonCaller) {
                        videoSrc += '?2';
                        audioSrc += '?2';
                    }*/
                    html += '<video id="' + fileButtonCaller + '"  src="' + videoSrc + '" preload="none" controls="controls" width="100%" height="270">';
                    //html += '   <source src="' + videoSrc + '" type="'+mime+'" ></source>';
                    html += '</video>';
                    if ('video-1' === fileButtonCaller) {
                        $("#video-1-container").children().remove();
                        $("#video-1-container").append(html);
                        initPlayer1();
                        TrackManager.togglePlayerButtons();
                    } else if ('video-2' === fileButtonCaller) {
                        $("#video-2-container").children().remove();
                        $("#video-2-container").append(html);
                        initPlayer2();
                        TrackManager.togglePlayerButtons();
                    }
                }
            }
        }
    });
    // modal file input change event
    $('#open-file').change(function(e) {
        handleFileSelect(e);
    });
    // drop down menu item change
    $('.dropdown-menu a').click(function(e) {
        var rId = $(this).data('id');
        if (rId && 'undefined' !== rId) {
            mediaSource = rId;
            $('.modal-item').each(function(elem) {
                // find the appropriate view depending on witch category is selected
                if (rId === this.id) {
                    $('#' + rId).show();
                } else {
                    $('#' + this.id).hide();
                }
            });
        }
        $('h5.selected-title').text($(this).text());
    });
    // delete all recorded tracks show confirm
    $('body').on('click', '#tracks-delete', this, function(el) {
        $('#del-all-confirm-dialog').modal('show');
    });
    // download the just recorded file (blob)
    $('body').on('click', '#download', this, function(el) {
        recorder.save();
    });
    // delete all recorded tracks confirm OK
    $('#del-all-confirm-dialog').find('.modal-footer #confirm').on('click', function() {
        var html = '<img width="100%" class="no-video-img" height="270" alt="no image" title="PLease select a video" src="media/poster/poster.jpg"/>';
        TrackManager.deleteAllTracks();
        $("#video-1-container").children().remove();
        $("#video-2-container").children().remove();
        $("#video-1-container").append(html);
        $("#video-2-container").append(html);
        $('#del-all-confirm-dialog').modal('hide');
    });
    // delete one track (modal window button)
    $('body').on('click', '.track-delete', this, function(el) {
        // Get track name
        var trackToRemove = $(this).parents('tr').prop('id');
        var video1Src = $('#video-1').attr('src');
        var video2Src = $('#video-2').attr('src');
        if (video2Src !== undefined || video1Src !== undefined) {
            var html = '<img width="100%" class="no-video-img" height="270" alt="no image" title="PLease select a video" src="media/poster/poster.jpg"/>';
            var arr;
            var file;
            // check if the file we want to delete is used by player 1
            if (video1Src !== undefined) {
                arr = video1Src.split('/');
                file = arr[arr.length - 1];
                if (file === trackToRemove + '.webm') {
                    $("#video-1-container").children().remove();
                    $("#video-1-container").append(html);
                    //sound1 = null;
                    TrackManager.deletePlaying('video-1');
                }
            }
            if (video2Src !== undefined) {
                arr = video2Src.split('/');
                file = arr[arr.length - 1];
                // check if the file we want to delete is used by player 2
                if (file === trackToRemove + '.webm') {
                    $("#video-2-container").children().remove();
                    $("#video-2-container").append(html);
                    //sound2 = null;
                    TrackManager.deletePlaying('video-2');
                }
            }
        }
        // delete video track
        TrackManager.deleteTrack(trackToRemove);
        TrackManager.togglePlayerButtons();
    });
    // handle start recording event
    record.onclick = function() {
        record.disabled = true;
        stop.disabled = false;
        audioUploaded = false;
        videoUploaded = false;
        captureUserMedia(function(stream) {
            recorder = RecordRTC(stream, {
                //autoWriteToDisk: true
            });
            recorder.startRecording();
        });
    };
    // handle stop recording event
    stop.onclick = function() {
        record.disabled = false;
        stop.disabled = true;
        player2.setSrc('');
        //player2.src = '';
        fileName = generateFileName();
        if (recorder) {
            recorder.stopRecording(function(url) {
                // multiple solutions dfor saving the recorded video :
                // - download it immediatly -> recorder.save();
                // - allow user to download it with a button -> button.click -> recorder.save();
                // - upload it to server -> PostBlob (choosen solution for now)
                // - save it in 'browser db' -> writeToDisk
                //recorder.save();
                //recorder.writeToDisk();
                cancelAnalyserUpdates();
                PostBlob(recorder.getBlob(), fileName + '.webm');
                // enable download 'just recorded file' button
                //$('#download').prop('disabled', false);
            });
        }
    };
}

function captureUserMedia(callback) {
    navigator.getUserMedia = navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
    navigator.getUserMedia({
        audio: true,
        video: true
    }, function(stream) {
        /*if (stream.getAudioTracks().length === 0 && stream.getVideoTracks().length === 0) {
            alert('you have no webcam nore mic available on your device');
        } else {*/
        var html = '';
        html += '<video id="video-2" controls="controls" preload="none" width="100%" height="270">';
        html += '   <source src="' + window.URL.createObjectURL(stream) + '" type="video/webm" ></source>';
        html += '</video>';
        $("#video-2-container").children().remove();
        $("#video-2-container").append(html);
        initPlayer2();
        player2.play();
        player2.setMuted(true);
        callback(stream);
        gotStream(stream);
        //}
    }, function(error) {
        console.error(error);
    });
}
// local file selection
function handleFileSelect(evt) {
    var file = evt.target.files[0]; // FileList object
    if (file) {
        var reader = new FileReader();
        reader.onload = (function(theFile) {
            return function(e) {
                if (e.target.result) {
                    var html = '';
                    html += '<video id="' + fileButtonCaller + '" controls="controls" preload="none"  width="100%" height="270">';
                    html += '   <source src="' + e.target.result + '" type="' + theFile.type + '" ></source>';
                    html += '</video>';
                    if ('video-1' === fileButtonCaller) {
                        $("#video-1-container").children().remove();
                        $("#video-1-container").append(html);
                        initPlayer1();
                    } else if ('video-2' === fileButtonCaller) {
                        $("#video-2-container").children().remove();
                        $("#video-2-container").append(html);
                        initPlayer2();
                    }
                }
            };
        })(file);
        reader.readAsDataURL(file);
    }
}

function generateFileName() {
    // Generate unique name
    var date = new Date();
    var month = date.getMonth();
    // The getMonth() method returns the month (from 0 to 11)
    month++;
    if (month < 10) month = '0' + month.toString();
    var day = date.getDate();
    if (day < 10) day = '0' + day.toString();
    var hours = date.getHours();
    if (hours < 10) hours = '0' + hours;
    var minutes = date.getMinutes();
    if (minutes < 10) minutes = '0' + minutes;
    var seconds = date.getSeconds();
    if (seconds < 10) seconds = '0' + seconds;
    return date.getFullYear() + '-' + month + '-' + day + '_' + hours + 'h' + minutes + 'm' + seconds;
}
/**
 *  generate a unique user name
 */
function getUser() {
    var date = new Date();
    var uid = date.getMonth().toString() + date.getDate().toString() + date.getMinutes().toString() + date.getSeconds().toString() + date.getMilliseconds().toString() + (Math.random() * Math.pow(36, 4) << 0).toString(36).slice(-4);
    return uid;
}

function PostBlob(blob, fileName) {
    console.log('PostBlob is invoked', arguments);
    showWaitModal();
    // FormData
    var formData = new FormData();
    formData.append('filename', fileName);
    formData.append('blob', blob);
    var owner = 'student';
    formData.append('owner', owner);
    // user id to create unique folder
    formData.append('uid', userId);
    TrackManager.togglePlayerButtons();
    // POST the Blob
    xhr('save2.php', formData, null, function(fileURL) {});
}

function xhr(url, data, progress, callback) {
    var request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status === 200) {
            //callback(request.responseText);
            var track = JSON.parse(request.responseText);
            console.log(track);
            TrackManager.addTrack(track);
            hideWaitModal();
            var html = '';
            html += '<video id="video-2" controls="controls" preload="none" width="100%" height="270">';
            html += '   <source src="' + track.url + '" type="video/webm" ></source>';
            html += '</video>';
            $("#video-2-container").children().remove();
            $("#video-2-container").append(html);
            initPlayer2();
        }
    };
    request.upload.onprogress = function(e) {
        if (!progress) return;
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
// mp3 encoding callback
function doneEncoding(blob) {
    PostBlob(blob, 'audio', 'audio_' + fileName + '.mp3');
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// MEDIAELEMENT JS PLAYERS 
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function initPlayer1() {
    player1 = new MediaElementPlayer('#video-1', {
        enableAutosize: false,
        pauseOtherPlayers: false,
        features: ['playpause', 'progress', 'current', 'duration', 'tracks', 'volume'],
        success: function(mediaElement, domObject) {
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
        features: ['playpause', 'progress', 'current', 'duration', 'tracks', 'volume'],
        success: function(mediaElement, domObject) {
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
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// MODAL WINDOWS
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function showWaitModal() {
    var progress = '';
    progress += '<div class="modal" id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false">';
    progress += '<div class="modal-dialog">';
    progress += '<div class="modal-content">';
    progress += '   <div class="modal-header">';
    progress += '       <h3>Processing audio and video files...</h3>';
    progress += '   </div>';
    progress += '   <div class="modal-body text-center">';
    progress += '       <img src="css/img/loader.gif">';
    progress += '   </div>';
    progress += '</div>';
    progress += '   </div>';
    progress += '</div>';
    $('body').append(progress);
    $('#pleaseWaitDialog').modal();
}

function hideWaitModal() {
    $('#pleaseWaitDialog').modal('hide');
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////
// MIC LEVEL ANALYSER
///////////////////////////////////////////////////////////////////////////////////////////////////////////
function gotStream(stream) {
    inputPoint = audioContext.createGain();
    // Create an AudioNode from the stream.
    realAudioInput = audioContext.createMediaStreamSource(stream);
    audioInput = realAudioInput;
    audioInput.connect(inputPoint);
    analyserNode = audioContext.createAnalyser();
    analyserNode.smoothingTimeConstant = 0.3;
    analyserNode.fftSize = 2048;
    inputPoint.connect(analyserNode);
    updateAnalyser();
}

function cancelAnalyserUpdates() {
    window.cancelAnimationFrame(rafID);
    // clear the current state
    analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
    rafID = null;
}

function updateAnalyser(time) {
    if (!analyserContext) {
        var canvas = document.getElementById("analyser");
        canvasWidth = canvas.width;
        canvasHeight = canvas.height;
        analyserContext = canvas.getContext('2d');
        gradient = analyserContext.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(1, '#ffff00'); // min level color
        gradient.addColorStop(0.15, '#ff0000'); // max level color
    }
    // mic input level draw code here
    {
        var array = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(array);
        var average = getAverageVolume(array);
        // clear the current state
        analyserContext.clearRect(0, 0, canvasWidth, canvasHeight);
        // set the fill style
        analyserContext.fillStyle = gradient;
        // create the meters
        analyserContext.fillRect(0, canvasHeight - average, canvasWidth, canvasHeight);
    }
    rafID = window.requestAnimationFrame(updateAnalyser);
}

function getAverageVolume(array) {
    var values = 0;
    var average;
    var length = array.length;
    // get all the frequency amplitudes
    for (var i = 0; i < length; i++) {
        values += array[i];
    }
    average = values / length;
    return average;
}