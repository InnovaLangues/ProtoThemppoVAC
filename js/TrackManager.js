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
     * List of web tracks (teacher models, stored on the server)
     */
    webTracks: [],
    /**
     * List of student tracks (stored on local db)
     */
    studentTracks: [],
    /**
     * selected track for player 1
     */
    player1Track: null,
    /**
     * selected track for player 2
     */
    player2Track: null,
    /**
     * List of tracks which are currently playing
     */
    playing: [],
    /**
     * Initialize the track manager (register events)
     */
    initialize: function(db, uid) {
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
        this.loadWebTracks();
        this.loadStudentTracks(db, uid);
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
    /**
     * Delete a track from server
     */
    deleteStudentTrack: function(id, db) {
        var track = this.getStudentTrack(id);
        if (typeof track !== 'undefined' && null !== track && track.length !== 0) {
            var manager = this;
            var trans = db.transaction(["video"], "readwrite");
            var store = trans.objectStore("video");
            // + is used to convert a string to an int
            var request = store.delete(+id);
            request.onsuccess = function(e) {
                // remove track from UI list 
                manager.s_container.find('#' + id).remove();
                // remove track from array collection
                var trackIndex = manager.getStudentTrackIndex(id);
                manager.studentTracks.splice(trackIndex, 1);
                if (manager.studentTracks.length == 0) {
                    // Add no track line
                    var html = '';
                    html += '<tr class="no-track">';
                    html += '    <td colspan="6" class="text-center"><em>You have no recorded track.</em></td>';
                    html += '</tr>';
                    manager.s_container.append(html);
                }
                manager.togglePlayButton();
                manager.toggleDeleteButton();
            };
            request.onerror = function(e) {
                console.log(e);
            };
        }
    },
    /**
     * Delete all recorded tracks
     */
    deleteAllStudentTracks: function(db) {
        for (var i = 0; i < this.studentTracks.length; i++) {
            var track = this.studentTracks[i];
            if ('student' === track.owner) this.deleteStudentTrack(track.id, db);
        }
        this.togglePlayButton();
        this.toggleDeleteButton();
    },
    /**
     * Load existing tracks from server
     */
    loadWebTracks: function() {
        var manager = this;
        var formData = new FormData();
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (4 === request.readyState && 200 === request.status) {
                var tracks = JSON.parse(request.responseText);
                if (typeof tracks !== 'undefined' && null !== tracks && tracks.length !== 0) {
                    for (var i = 0; i < tracks.length; i++) {
                        var track = tracks[i];
                        manager.addWebTrack(track);
                    }
                }
            }
        };
        request.open('POST', 'list2.php');
        request.send(formData);
    },
    // Add model track to list
    addWebTrack: function(track) {
        this.webTracks.push(track);
        // Only video ar shown in list
        if ('video' === track.type || 'av' === track.type) {
            // Remove no track line if needed
            this.t_container.find('.no-track').remove();
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
            this.t_container.append(html);
        }
    },
    /**
     * Load all student videos from local db
     **/
    loadStudentTracks: function(db, uid) {
        var manager = this;
        var trans = db.transaction(["video"]);
        var store = trans.objectStore("video");
        var index = store.index('uName');
        // get only user videos
        var key = IDBKeyRange.only(uid);
        var cursorRequest = index.openCursor(key);
        cursorRequest.onsuccess = function(e) {
            var result = e.target.result;
            if ( !! result == false) return;
            manager.addStudentTrack(result.value);
            result.
            continue ();
        };
        cursorRequest.onerror = function() {
            console.log('error loading videos for user id : ' + uid);
        };
    },
    /**
     * Add student track to list
     **/
    addStudentTrack: function(track) {
        var url = window.URL.createObjectURL(track.video);
        // Add track to list (student)
        this.studentTracks.push(track);
        // Remove no track line
        this.s_container.find('.no-track').remove();
        // Display new track
        var html = '';
        html += '<tr id="' + track.id + '" data-name="' + track.tName + '">';
        html += '    <td class="text-center"><input type="radio" class="track-select" name="select" id="select-' + track.id + '" value="1"/></td>';
        // icone
        html += '    <td>';
        html += '       <span class="h2 glyphicon glyphicon-film"></span> ';
        html += '    </td>';
        // name
        html += '    <td>' + track.tName + '</td>';
        html += '    <td>';
        html += '       <a href="' + url + '" target="_blank" type="application/octet-stream" download class="track-download btn btn-sm btn-default" role="button">';
        html += '           <span class="glyphicon glyphicon-download-alt"></span>';
        html += '           <span class="sr-only">Download</span>';
        html += '       </a>';
        // Delete button
        html += '       <button class="track-delete btn btn-sm btn-danger" role="button">';
        html += '           <span class="glyphicon glyphicon-trash"></span>';
        html += '           <span class="sr-only">Delete</span>';
        html += '       </button>';
        html += '    </td>';
        this.s_container.append(html);
        this.toggleDeleteButton();
    },
    /**
     * Start playing selected tracks (on both players)
     **/
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
        }
        if (player2 && player2Src !== '') {
            player2.play();
            manager.playing.push('video-2');
        }
        // Manage buttons state
        this.togglePlayerButtons();
    },
    /**
     * Pause selected tracks which are currently playing (both players)
     */
    pause: function() {
        this.paused = true;
        for (var i = 0; i < this.playing.length; i++) {
            var player = this.playing[i];
            if (player1 && 'video-1' === player) {
                player1.pause();
            } else if (player2 && 'video-2' === player) {
                player2.pause();
            }
        }
        // Manage buttons state
        this.togglePlayerButtons();
    },
    /**
     * Stop selected tracks which are currently playing (both players)
     */
    stop: function() {
        this.paused = false;
        for (var i = 0; i < this.playing.length; i++) {
            var player = this.playing[i];
            if (player1 && 'video-1' === player) {
                player1.pause();
                player1.setCurrentTime(0);
            } else if (player2 && 'video-2' === player) {
                player2.pause();
                player2.setCurrentTime(0);
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
        if ((this.playing.length === 0 || this.paused) && (this.studentTracks.length !== 0 || this.webTracks.length !== 0) && hasSource) {
            enabled = true;
        }
        this.buttonPlay.prop('disabled', !enabled);
    },
    /**
     * Check if pause button needs to be enabled and enable/disable it
     */
    togglePauseButton: function() {
        var enabled = false;
        if ((this.studentTracks.length !== 0 || this.webTracks.length !== 0) && this.playing.length !== 0 && !this.paused) {
            enabled = true;
        }
        this.buttonPause.prop('disabled', !enabled);
    },
    /**
     * Check if stop button needs to be enabled and enable/disable it
     */
    toggleStopButton: function() {
        var enabled = false;
        if ((this.studentTracks.length !== 0 || this.webTracks.length !== 0) !== 0 && this.playing.length !== 0) {
            enabled = true;
        }
        this.buttonStop.prop('disabled', !enabled);
    },
    /**
     * Check if delete all button needs to be enabled and enable/disable it
     */
    toggleDeleteButton: function() {
        var enabled = false;
        if (this.studentTracks.length !== 0) {
            enabled = true;
        }
        this.buttonDelete.prop('disabled', !enabled);
    },
    getStudentTrack: function(id) {
        var track = null;
        var trackIndex = this.getStudentTrackIndex(id);
        if (null !== trackIndex) {
            track = this.studentTracks[trackIndex];
        }
        return track;
    },
    getStudentTrackIndex: function(id) {
        var index = null;
        for (var i = 0; i < this.studentTracks.length; i++) {
            var currentTrack = this.studentTracks[i];
            if (id == currentTrack.id) {
                index = i;
                break;
            }
        }
        return index;
    },
    getWebTrack: function(name) {
        var track = null;
        var trackIndex = this.getWebTrackIndex(name);
        if (null !== trackIndex) {
            track = this.webTracks[trackIndex];
        }
        return track;
    },
    /**
     * Retrieve the track index in web track list by name
     */
    getWebTrackIndex: function(name) {
        var index = null;
        for (var i = 0; i < this.webTracks.length; i++) {
            var currentTrack = this.webTracks[i];           
            if (name == currentTrack['name']) {
                index = i;
                break;
            }
        }
        return index;
    },
    deletePlaying: function(player) {
        for (var i = 0; i < this.playing.length; i++) {
            var currentTrack = this.playing[i];
            if (player === currentTrack) {
                this.playing.splice(i, 1);
                break;
            }
        }
    }
};