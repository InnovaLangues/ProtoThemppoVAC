var TrackManager = {
    /**
     * Where new tracks must be append (student)
     */
    s_container: null,
    /**
     * Where new tracks must be append (models / teacher)
     */
    t_container: null,
    /**
     * List of all tracks
     */
    tracks: [],
    /**
     * List of tracks which are currently playing
     */
    playing: [],
    /**
     * Initialize the track manager (register events)
     */
    initialize: function(userFolder) {
        // Store buttons
        this.buttonPlay = $('#tracks-play');
        this.buttonPause = $('#tracks-pause');
        this.buttonStop = $('#tracks-stop');
        this.buttonDelete = $('#tracks-delete');
        // student tracks container
        this.s_container = $('#stracks-container tbody');
        // model tracks container
        this.t_container = $('#ttracks-container tbody');
        // Load tracks
        this.loadTracks(userFolder);
        // Play selected tracks
        $('body').on('click', '#tracks-play', this, function(el) {
            el.data.play();
            return false;
        });
        // Pause playing elements
        $('body').on('click', '#tracks-pause', this, function(el) {
            el.data.pause();
            return false;
        });
        // Stop playing elements
        $('body').on('click', '#tracks-stop', this, function(el) {
            el.data.stop();
            return false;
        });
    },
    addTrack: function(track) {
        // Add track to list (student + models / audio + video / audio / video)
        this.tracks.push(track);
        // Only video ar shown in list (corresponding audio files (if exists) are automatically retrieved)
        if ('video' === track.type || 'av' === track.type) {
            // Remove no track line if needed
            if (track.owner === 'student') {
                this.s_container.find('.no-track').remove();
            } else if (track.owner === 'teacher') this.t_container.find('.no-track').remove();
            // Display new track
            var html = '';
            html += '<tr id="' + track.name + '">';
            html += '    <td class="text-center"><input type="radio" class="track-select" name="select" id="select-' + track.name + '" value="1"/></td>';
            // icone
            html += '    <td>';
            html += '       <span class="h2 glyphicon glyphicon-film"></span> ';
            html += '    </td>';
            // name
            html += '    <td>' + track.name + '</td>';
            html += '    <td>';
            if (track.downloadable) {
                // Download button
                var file = track.uid + '/' + track.name + '.' + track.extension; //('audio' === track.type ? '.wav' : '.webm');
                html += '   <a href="download.php?file=' + file + '" target="_blank" class="track-download btn btn-sm btn-default" role="button">';
                html += '       <span class="glyphicon glyphicon-download-alt"></span>';
                html += '       <span class="sr-only">Download</span>';
                html += '   </a>';
            }
            if (track.deletable) {
                // Delete button
                html += '   <button class="track-delete btn btn-sm btn-danger" role="button">';
                html += '       <span class="glyphicon glyphicon-trash"></span>';
                html += '       <span class="sr-only">Delete</span>';
                html += '   </button>';
            }
            html += '    </td>';
            if (track.owner === 'student') this.s_container.append(html);
            else if (track.owner === 'teacher') this.t_container.append(html);
            this.toggleDeleteButton();
        }
    },
    /**
     * Delete a track from server
     */
    deleteTrack: function(fileName, isAudio) {
        var track = this.getTrack(fileName);
        if (typeof track !== 'undefined' && null !== track && track.length !== 0) {
            var manager = this;
            var url = isAudio ? track.url.replace('video', 'audio').replace('webm', 'mp3') : track.url;
            // Delete file from server
            var formData = new FormData();
            formData.append('delete-file', url);
            var request = new XMLHttpRequest();
            request.onreadystatechange = function() {
                if (4 == request.readyState && 200 == request.status) {
                    // Remove track from list
                    manager.s_container.find('#' + track.name).remove();
                    var trackIndex = manager.getTrackIndex(fileName);
                    manager.tracks.splice(trackIndex, 1);
                    if (manager.tracks.length == 0) {
                        // Add no track line
                        var html = '';
                        html += '<tr class="no-track">';
                        html += '    <td colspan="6" class="text-center"><em>You have no recorded track.</em></td>';
                        html += '</tr>';
                        manager.s_container.append(html);
                    }
                    manager.togglePlayButton();
                    manager.toggleDeleteButton();
                }
            };
            request.open('POST', 'delete.php');
            request.send(formData);
        }
    },
    /**
     * Delete all recorded tracks
     */
    deleteAllTracks: function() {
        for (var i = 0; i < this.tracks.length; i++) {
            var track = this.tracks[i];
            if ('student' === track.owner) this.deleteTrack(track.name);
        }
        this.togglePlayButton();
        this.toggleDeleteButton();
    },
    /**
     * Load existing tracks from server
     */
    loadTracks: function(uid) {
        var manager = this;
        var formData = new FormData();
        formData.append('uid', uid);
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (4 === request.readyState && 200 === request.status) {
                var tracks = JSON.parse(request.responseText);
                if (typeof tracks !== 'undefined' && null !== tracks && tracks.length !== 0) {
                    for (var i = 0; i < tracks.length; i++) {
                        var track = tracks[i];
                        manager.addTrack(track);
                    }
                }
            }
        };
        request.open('POST', 'list.php');
        request.send(formData);
    },
    /**
     * Start playing selected tracks (on both players)
     */
    play: function() {
        this.paused = false;
        var manager = this;
        var player1Src = '';
        var player2Src = '';

        // !! players && sounds are in main.js
        if (player1) player1Src = $('#' + player1.media.id).attr('src');
        if (player2) player2Src = $('#' + player2.media.id).attr('src');
        if (player1 && player1Src !== '') {
            player1.play();
            manager.playing.push('video-1');
            if (sound1 !== null) sound1.play();
        }
        if (player2 && player2Src !== '') {
            player2.play();
            manager.playing.push('video-2');
            if (sound2 !== null) {
                sound2.play();
            }
        }
        // Manage buttons state
        this.togglePlayerButtons();
    },
    /**
     * Pause selected tracks which are currently playing
     */
    pause: function() {
        this.paused = true;
        for (var i = 0; i < this.playing.length; i++) {
            var player = this.playing[i];
            if (player1 && 'video-1' === player) {
                player1.pause();
                if (sound1) sound1.pause();
            } else if (player2 && 'video-2' === player) {
                player2.pause();
                if (sound2) sound2.pause();
            }
        }
        // Manage buttons state
        this.togglePlayerButtons();
    },
    /**
     * Stop selected tracks which are currently playing
     */
    stop: function() {
        this.paused = false;
        for (var i = 0; i < this.playing.length; i++) {
            var player = this.playing[i];
            if (player1 && 'video-1' === player) {
                player1.pause();
                player1.setCurrentTime(0);
                if (sound1) {
                    //sound1.currentTime = 0;
                    sound1.pause();
                }
            } else if (player2 && 'video-2' === player) {
                player2.pause();
                player2.setCurrentTime(0);
                if (sound2) {
                    sound2.pause();
                    //sound2.currentTime = 0;
                }
            }
        }
        // Remove list of currently playing
        this.playing = [];
        // Manage buttons state
        this.togglePlayerButtons();
    },
    togglePlayerButtons: function() {
        this.togglePlayButton();
        this.togglePauseButton();
        this.toggleStopButton();
    },
    /**
     * Check if play button needs to be enabled and enable/disable it
     */
    togglePlayButton: function() {
        var enabled = false;
        var hasSource = false;
        // check that player1 && player2 have a source
        if ((player1 && ($('#' + player1.media.id).attr('src') !== undefined || $('#' + player1.media.id + ' source').attr('src') !== undefined)) && (player2 && $('#' + player2.media.id).attr('src') !== undefined)) {
            hasSource = true;
        }
        if ((this.playing.length === 0 || this.paused) && this.tracks.length !== 0 && hasSource) {
            enabled = true;
        }
        this.buttonPlay.prop('disabled', !enabled);
    },
    /**
     * Check if pause button needs to be enabled and enable/disable it
     */
    togglePauseButton: function() {
        var enabled = false;
        if (this.tracks.length !== 0 && this.playing.length !== 0 && !this.paused) {
            enabled = true;
        }
        this.buttonPause.prop('disabled', !enabled);
    },
    /**
     * Check if stop button needs to be enabled and enable/disable it
     */
    toggleStopButton: function() {
        var enabled = false;
        if (this.tracks.length !== 0 && this.playing.length !== 0) {
            enabled = true;
        }
        this.buttonStop.prop('disabled', !enabled);
    },
    /**
     * Check if delete all button needs to be enabled and enable/disable it
     */
    toggleDeleteButton: function() {
        var enabled = false;
        if (this.tracks.length !== 0) {
            enabled = true;
        }
        this.buttonDelete.prop('disabled', !enabled);
    },
    /**
     * Save files on server
     */
    /*save: function(fileType, fileName, blob) {
        console.log('save');
        var manager = this;
        // FormData
        var formData = new FormData();
        var file = fileName + ('audio' === fileType ? '.wav' : '.webm');
        formData.append(fileType + '-filename', file);
        formData.append(fileType + '-blob', blob);
        // Send file to server
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (4 == request.readyState && 200 == request.status) {
                if (null != request.responseText && request.responseText.length != 0 && 'error' != request.responseText) {
                    var track = JSON.parse(request.responseText);
                    // Display new track in list
                    manager.addTrack(track);
                } else {
                    console.log('Track Manger Save Error');
                }
            }
        };
        request.upload.onprogress = function(e) {
           
        };
        request.open('POST', 'save.php');
        request.send(formData);
    },*/
    /**
     * Retrieve the track object in tracks list from its name
     */
    getTrack: function(fileName) {
        var track = null;
        var trackIndex = this.getTrackIndex(fileName);
        if (null !== trackIndex) {
            track = this.tracks[trackIndex];
        }
        return track;
    },
    /**
     * Retrieve the track index in tracks list from its name
     */
    getTrackIndex: function(fileName) {
        var index = null;
        for (var i = 0; i < this.tracks.length; i++) {
            var currentTrack = this.tracks[i];
            if (fileName == currentTrack['name']) {
                index = i;
                break;
            }
        }
        return index;
    },
    deletePlaying: function(fileName) {
        for (var i = 0; i < this.playing.length; i++) {
            var currentTrack = this.playing[i];
            if (fileName == currentTrack) {
                this.playing.splice(i, 1);
                break;
            }
        }
    }
};