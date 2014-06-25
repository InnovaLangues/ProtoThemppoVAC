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
// file name to save
var fileName;
// file opener caller (video-1, video-2)
var fileButtonCaller;
// INDEXED DB
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
if (!window.indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB. Saving your videos will not be available.");
}
var dbRequest;
var db;
const DB_NAME = "videos";
const DB_VERSION = 3;
var videoData; // array of videos for the user
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

    dbRequest = window.indexedDB.open(DB_NAME, DB_VERSION);
    dbRequest.onerror = function(event) {
        alert("Database error: " + event.target.errorCode);
    };
    dbRequest.onsuccess = function(event) {
        db = dbRequest.result;
        TrackManager.initialize(db, userId);
        videoData = [];
    };
    dbRequest.onupgradeneeded = function(event) {
        console.log('on upgrade needed');
        var db = event.target.result;
        // Create an objectStore for this database
        var objectStore = db.createObjectStore("video", {
            keyPath: "id",
            autoIncrement: true
        });
        // Create an index to search videos by user name. We may have duplicates
        // so we can't use a unique index.
        objectStore.createIndex("uName", "uName", {
            unique: false
        });
        
        objectStore.transaction.oncomplete = function(event) {
            console.log('transaction complete');
            // Store values in the newly created objectStore.
            var videosObjectStore = db.transaction("video", "readwrite").objectStore("video");
            for (var i in videoData) {
                videosObjectStore.add(videoData[i]);
            }
        }
    };
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
        }
    });
    // handle modal file chooser closing event
    $('#file-dialog').on('hidden.bs.modal', function(e) {
        // disable download 'just recorded file' button
        //$('#download').prop('enabled', false);
        $('#download').prop('disabled', true);
        if (fileButtonCaller && fileButtonCaller !== 'undefined') {
            var videoSrc = '';
            //var audioSrc = '';
            var mime = '';
            var hasFile = false;
            var track;
            if (mediaSource) {
                // open my track
                if ($('.track-select:checked')[0] && 'my-tracks' === mediaSource) {
                    var id = $('.track-select:checked').parents('tr').prop('id');
                    track = TrackManager.getStudentTrack(id);
                    // mime = track.extension === 'mp4' ? 'video/mp4' : 'video/webm';
                    mime = track.video.type; // video is a blob file if from student
                    videoSrc = window.URL.createObjectURL(track.video);
                    hasFile = true;
                }
                // open teacher track
                else if ($('.track-select:checked')[0] && 'teacher-tracks' === mediaSource) {
                    var name = $('.track-select:checked').parents('tr').prop('id');
                    track = TrackManager.getWebTrack(name);
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
                    TrackManager.togglePlayerButtons();
                    // everything else is done by handleFileSelect() method
                }
                // from teacher tracks or student tracks
                if ('web-track' !== mediaSource && 'local-track' !== mediaSource && hasFile) {
                    var html = '';                   
                    html += '<video id="' + fileButtonCaller + '"  src="' + videoSrc + '" preload="none" type="' + mime + '" controls="controls" width="100%" height="270">';
                    html += '</video>';
                    if ('video-1' === fileButtonCaller) {
                        $("#video-1-container").children().remove();
                        $("#video-1-container").append(html);
                        initPlayer1();
                        TrackManager.togglePlayerButtons(); 
                        TrackManager.player1Track = track;

                    TrackManager.selected.push();0
                    } else if ('video-2' === fileButtonCaller) {
                        $("#video-2-container").children().remove();
                        $("#video-2-container").append(html);
                        initPlayer2();
                        TrackManager.togglePlayerButtons();
                        TrackManager.player2Track = track;
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
    // delete all recorded tracks confirm OK
    $('#del-all-confirm-dialog').find('.modal-footer #confirm').on('click', function() {
        var html = '<img width="100%" class="no-video-img" height="270" alt="no image" title="PLease select a video" src="media/poster/poster.jpg"/>';
        TrackManager.deleteAllStudentTracks(db);
        $("#video-1-container").children().remove();
        $("#video-2-container").children().remove();
        $("#video-1-container").append(html);
        $("#video-2-container").append(html);
        $('#del-all-confirm-dialog').modal('hide');
    });
    // delete one track (modal window button) -> Only student records
    $('body').on('click', '.track-delete', this, function(el) {
        // Get track id
        var trackId = $(this).parents('tr').prop('id');
        var el = document.getElementById(trackId);

         var html = '<img width="100%" class="no-video-img" height="270" alt="no image" title="PLease select a video" src="media/poster/poster.jpg"/>';
  
        // check if the file we want to delete is used by player 1
        if (TrackManager.player1Track && TrackManager.player1Track.tName === el.dataset.name) {
            $("#video-1-container").children().remove();
            $("#video-1-container").append(html);
            TrackManager.deletePlaying('video-1');
        }

        // check if the file we want to delete is used by player 2
        if (TrackManager.player2Track  && TrackManager.player2Track.tName === el.dataset.name) {
            $("#video-2-container").children().remove();
            $("#video-2-container").append(html);
            TrackManager.deletePlaying('video-2');
        }

        // delete video track (it is a student video)
        TrackManager.deleteStudentTrack(trackId, db);
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
                // stop vu meter
                cancelAnalyserUpdates();
                player2.setSrc(url);

                var transaction = db.transaction(["video"], "readwrite");
                var objectStore = transaction.objectStore("video");                    
                var request = objectStore.put({ uName: userId, video: recorder.getBlob(), tName: fileName, owner: "student" });
                request.onsuccess = function (evt) {
                    console.log(evt.target);
                    TrackManager.loadUserVideos(db, userId);
                };
                request.onerror = function(e) {
                    console.log(e.value);
                };
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