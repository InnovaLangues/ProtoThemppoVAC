var TrackManager = {
    /**
     * Player buttons : Play button
     */
    buttonPlay: null,
    /**
     * Player buttons : Pause button
     */
    buttonPause: null,
    /**
     * Player buttons : Stop button
     */
    buttonStop: null,
    /**
     * Delete all tracks button
     */
    buttonDelete: null,
    /**
     * Where new tracks must be appended (student)
     */
    s_container: null,
    /**
     * Where new tracks must be appended (models / teacher)
     */
    t_container: null,
    /**
     * List of all tracks
     */
    tracks: [],
    /**
     * Player is paused ?
     */
    paused: false,
    /**
     * List of tracks which are currently playing
     */
    playing: [],
    /**
     * Initialize the track manager (register events)
     */
    initialize: function() {
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
        this.loadTracks();

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

        // Delete all saved tracks
        $('body').on('click', '#tracks-delete', this, function(el) {
            el.data.deleteAllTracks();
            return false;
        });

        // Select/Unselect all tracks
        $('body').on('change', '#tracks-select', this, function(el) {
            if ($(this).is(':checked')) { // Select all
                el.data.selectAllTracks();
            }
            else { // Unselect all
                el.data.unselectAllTracks();
            }
            return false;
        });

        // Manage Select all state
        $('body').on('change', '.track-select', this, function(el) {
            var checked = $('.track-select:checked').length;
            var $selectAll = $('#tracks-select');
            if ($(this).is(':checked')) {
                if (checked === el.data.tracks.length) {
                    $selectAll.prop('checked', true);
                    $selectAll.prop('indeterminate', false);
                }
                else {
                    $selectAll.prop('checked', false);
                    $selectAll.prop('indeterminate', true);
                }
            }
            else {
                if (0 === checked) {
                    $selectAll.prop('checked', false);
                    $selectAll.prop('indeterminate', false);
                }
                else {
                    $selectAll.prop('checked', false);
                    $selectAll.prop('indeterminate', true);
                }
            }

            el.data.togglePlayButton();
        });

        // Delete a track
        $('body').on('click', '.track-delete', this, function(el) {
            // Get track name
            var trackToRemove = $(this).parents('tr').prop('id');
            el.data.deleteTrack(trackToRemove);
            return false;
        });
    },
    addTrack: function(track) {
        // Add track to list (student + models / audio + video / audio / video)
        this.tracks.push(track);

        // Only video ar shown in list (corresponding audio files (if exists) are autoamtically retrieved)
        if ('video' === track.type || 'av' === track.type) {

            // Remove no track line if needed
            if (track.owner === 'student') {
                this.s_container.find('.no-track').remove();
            }
            else if (track.owner === 'teacher')
                this.t_container.find('.no-track').remove();

            // Display new track
            var html = '';
            html += '<tr id="' + track.name + '">';

            html += '    <td class="text-center"><input type="checkbox" class="track-select" name="select-' + track.name + '" id="select-' + track.name + '" value="1"/></td>';

            // Track name
            html += '    <td>';

            html += '	<span class="h2 glyphicon glyphicon-film"></span> ';

            html += '    </td>';

            html += '    <td>' + track.name + '</td>';

            html += '	 <td id="waveform-' + track.name + '"></td>';

            html += '	 <td id="duration-' + track.name + '"></td>';

            html += '    <td>';
            if (track.downloadable) {
                // Download button
                var file = track.name + '.' + track.extension;//('audio' === track.type ? '.wav' : '.webm');
                html += '	<a href="download.php?file=' + file + '" target="_blank" class="track-download btn btn-sm btn-default" role="button">';
                html += '		<span class="glyphicon glyphicon-download-alt"></span>';
                html += '		<span class="sr-only">Download</span>';
                html += '	</a>';
            }

            if (track.deletable) {
                // Delete button
                html += '	<button class="track-delete btn btn-sm btn-danger" role="button">';
                html += '		<span class="glyphicon glyphicon-trash"></span>';
                html += '		<span class="sr-only">Delete</span>';
                html += '	</button>';
            }
            html += '    </td>';

            if (track.owner === 'student')
                this.s_container.append(html);
            else if (track.owner === 'teacher')
                this.t_container.append(html);

            this.toggleDeleteButton();
        }
    },
    /**
     * Delete a track from server
     */
    deleteTrack: function(fileName) {
        var track = this.getTrack(fileName);
 
        if (typeof track !== 'undefined' && null !== track && track.length !== 0) {
            var manager = this;
            
            // Delete file from server
            var formData = new FormData();
            formData.append('delete-file', track.url);

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
     * Unselect all tracks
     */
    selectAllTracks: function() {
        $('.track-select').prop('checked', true);
        this.togglePlayButton();
    },
    /**
     * Select all tracks
     */
    unselectAllTracks: function() {
        $('.track-select').prop('checked', false);
        this.togglePlayButton();
    },
    /**
     * Delete all recorded tracks
     */
    deleteAllTracks: function() {
        for (var i = 0; i < this.tracks.length; i++) {
            var track = this.tracks[i];
            if ('student' === track.owner)
                this.deleteTrack(track.name);
        }

        this.togglePlayButton();
        this.toggleDeleteButton();
    },
    /**
     * Load existing tracks from server
     */
    loadTracks: function() {
        var manager = this;

        var formData = new FormData();
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (4 == request.readyState && 200 == request.status) {
                var tracks = JSON.parse(request.responseText);

                if (typeof tracks != 'undefined' && null != tracks && tracks.length !== 0) {
                    for (var i = 0; i < tracks.length; i++) {
                        var track = tracks[i];
                        manager.addTrack(track);
                    }
                }
            }
        };

        request.open('GET', 'list.php');
        request.send(formData);
    },
    /**
     * Start playing selected tracks
     */
    play: function() {
        this.paused = false;
        var manager = this;
        var player1Src = '';
        var player2Src = '';
        if (player1)
            player1Src = $('#' + player1.media.id).attr('src');
        if (player2)
            player2Src = $('#' + player2.media.id).attr('src');
        if (player1 && player1Src !== '') {
            player1.play();
            manager.playing.push('video-1');
            if (sound1 !== null)
                sound1.play();
        }
        if (player2 && player2Src !== '') {
            player2.play();
            manager.playing.push('video-2');
            if (sound2 !== null)
                sound2.play();
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
                if(sound1)
                    sound1.pause();
            }
            else if (player2 && 'video-2' === player) {
                player2.pause();
                if(sound2)
                    sound2.pause();
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
                if(sound1){
                    sound1.pause();
                    sound1.currentTime = 0;
                }
            }
            else if (player2 && 'video-2' === player) {
                player2.pause();
                player2.setCurrentTime(0);
                if(sound2){
                    sound2.pause();
                    sound2.currentTime = 0;
                }
            }
        }

        //$('#player').empty().append('<div class="row"><img src="media/poster/poster.jpg" class="col-md-offset-3 col-md-6" /></div>');

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

        if ((this.playing.length === 0 || this.paused) && this.tracks.length !== 0) {
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
    save: function(fileType, fileName, blob) {
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
                }
                else {
                    console.log('Track Manger Save Error');
                }
            }
        };

        request.upload.onprogress = function(e) {
            /*if (!progress)
             return;
             if (e.lengthComputable) {
             progress.value = (e.loaded / e.total) * 100;
             progress.textContent = progress.value; // Fallback for unsupported browsers.
             }
             
             if (progress.value == 100) {
             progress.value = 0;
             }*/
        };

        request.open('POST', 'save.php');
        request.send(formData);
    },
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