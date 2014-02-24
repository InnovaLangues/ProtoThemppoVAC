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
	 * Where new tracks must be appended
	 */
	container: null,

	/**
	 * List of all recorded tracks
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
	initialize: function () {
		// Store buttons
		this.buttonPlay   = $('#tracks-play');
		this.buttonPause  = $('#tracks-pause');
		this.buttonStop   = $('#tracks-stop');
		this.buttonDelete = $('#tracks-delete');

		this.container = $('#tracks-list tbody');

		// Load tracks
		this.loadTracks();

		// Play selected tracks
		$('body').on('click', '#tracks-play', this, function (el) {
			el.data.play();
			return false;
		});

		// Pause playing elements
		$('body').on('click', '#tracks-pause', this, function (el) {
			el.data.pause();
			return false;
		});

		// Stop playing elements
		$('body').on('click', '#tracks-stop', this, function (el) {
			el.data.stop();
			return false;
		});

		// Delete all saved tracks
		$('body').on('click', '#tracks-delete', this, function (el) {
			el.data.deleteAllTracks();
			return false;
		});

		// Select/Unselect all tracks
		$('body').on('change', '#tracks-select', this, function (el) {
			if ($(this).is(':checked')) { // Select all
				el.data.selectAllTracks();
			}
			else { // Unselect all
				el.data.unselectAllTracks();
			}
			return false;
		});

		$('body').on('change', '.track-select', this, function (el) {
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
		$('body').on('click', '.track-delete', this, function (el) {
			// Get track name
			var trackToRemove = $(this).parents('tr').prop('id');
			el.data.deleteTrack(trackToRemove);
			return false;
		});
	},

	addTrack: function (track) {
		// Add track to list
		this.tracks.push(track);

		// Remove no track line if needed
		this.container.find('.no-track').remove();

		// Display new track
		var html = '';
		html += '<tr id="' + track.name + '">';

        html += '    <td class="text-center"><input type="checkbox" class="track-select" name="select-' + track.name + '" id="select-' + track.name + '" value="1" /></td>';
        
        // Track name
		html += '    <td>';
        
		if ('audio' === track.type) {
        	html += '	<span class="h2 glyphicon glyphicon-music"></span> ';
        }
        else if ('video' === track.type) {
        	html += '	<span class="h2 glyphicon glyphicon-film"></span> ';
        }
        html += '    </td>';

        html += '    <td>' + track.name + '</td>';

        html += '	 <td id="waveform-' + track.name + '"></td>';

        html += '	 <td id="duration-' + track.name + '"></td>';

        html += '    <td>';
        // Download button
        var file = track.name + ('audio' === track.type ? '.wav' : '.webm');
        html += '        <a href="download.php?file=' + file + '" target="_blank" class="track-download btn btn-sm btn-default" role="button">';
        html += '            <span class="glyphicon glyphicon-download-alt"></span>';
        html += '			 <span class="sr-only">Download</span>';
        html += '        </a>';

        // Delete button
	    html += '        <button class="track-delete btn btn-sm btn-danger" role="button">';
	    html += '            <span class="glyphicon glyphicon-trash"></span>';
	    html += '			 <span class="sr-only">Delete</span>';
	    html += '        </button>';
		html += '    </td>';        

		this.container.append(html);

		if ('audio' === track.type) {
			// Create waveform for each audio track
			var manager = this;
			var waveform = Object.create(WaveSurfer);

			// Add waveform
			waveform.init({
				height: 64,
			    container: '#waveform-' + track.name,
			    waveColor: '#777777',
			    progressColor: '#3276b1',
			    minPxPerSec: 40,
			    fillParent: false
			});

			waveform.load(track.url);

			track.waveformReady = false;
			waveform.on('ready', function () {
				track.waveformReady = true;
				manager.togglePlayButton();
				
				var duration = waveform.backend.getDuration();

				var hours = Math.floor(duration / 3600);
				if (0 != hours) {
					duration = duration % 3600;
				}

				var minutes = Math.floor(duration / 60);
				if (0 != minutes) {
					duration = duration % 60;
				}

				var seconds = Math.round(duration);

				if (hours < 10) {
					hours = '0' + hours;
				}
				if (minutes < 10) {
					minutes = '0' + minutes;
				}
				if (seconds < 10) {
					seconds = '0' + seconds;
				}

				var durationStr = '';
				if ('00' != hours) {
					durationStr += hours + ':';
				}
				durationStr += minutes + ':' + seconds;

				$('#duration-' + track.name).append(durationStr);
			});

			track.waveform = waveform;
		}

		this.toggleDeleteButton();
	},

	/**
	 * Delete a track from server
	 */
	deleteTrack: function (fileName) {
		var track = this.getTrack(fileName);
		if (typeof track !== 'undefined' && null != track && track.length !== 0) {
			var manager = this;

			// Delete file from server
	        var formData = new FormData();
	        formData.append('delete-file', track.url);

	        var request = new XMLHttpRequest();
	        request.onreadystatechange = function () {
	            if (4 == request.readyState && 200 == request.status) {
	            	// Remove track from list
	                manager.container.find('#' + track.name).remove();
					
	                var trackIndex = manager.getTrackIndex(fileName);
					manager.tracks.splice(trackIndex, 1);

					if (manager.tracks.length == 0) {
						// Add no track line
						var html = '';
						html += '<tr class="no-track">';
	                    html += '    <td colspan="5" class="text-center"><em>You have no recorded track.</em></td>';
	                    html += '</tr>';

	                    manager.container.append(html);
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
	selectAllTracks: function () {
		$('.track-select').prop('checked', true);
		this.togglePlayButton();
	},

	/**
	 * Select all tracks
	 */
	unselectAllTracks: function () {
		$('.track-select').prop('checked', false);
		this.togglePlayButton();
	},

	/**
	 * Delete all recorded tracks
	 */
	deleteAllTracks: function () {
		for (var i = 0; i < this.tracks.length; i++) {
			var track = this.tracks[i];
			this.deleteTrack(track.name);
		}

		this.togglePlayButton();
		this.toggleDeleteButton();
	},

	/**
	 * Load existing tracks from server
	 */
	loadTracks: function () {
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
	play: function () {
		this.paused = false;

		var manager = this;

		// Start playing selected tracks
		var toPlay = $('.track-select:checked');
		toPlay.each(function(index) {
			// Get track name from ID
			var id = $(this).prop('id');
			var name = id.substr(7, id.length);

			var track = manager.getTrack(name);
			if ('audio' === track.type) {
				// Play audio from waveform JS
				track.waveform.play();
			}
			else {
				// Play video
			}

			manager.playing.push(track);
		});

		// Manage buttons state
		this.togglePlayButton();
		this.togglePauseButton();
		this.toggleStopButton();
	},

	/**
	 * Pause selected tracks which are currently playing
	 */
	pause: function () {
		this.paused = true;

		for (var i = 0; i < this.playing.length; i++) {
			var track = this.playing[i];
			if ('audio' === track.type) {
				// Audio track
				track.waveform.pause();
			}
			else {
				// Video track
			}
		}

		// Manage buttons state
		this.togglePlayButton();
		this.togglePauseButton();
		this.toggleStopButton();
	},

	/**
	 * Stop selected tracks which are currently playing
	 */
	stop: function () {
		this.paused = false;

		for (var i = 0; i < this.playing.length; i++) {
			var track = this.playing[i];
			if ('audio' === track.type) {
				// Audio track
				track.waveform.stop();
			}
			else {
				// Video track
			}
		}

		// Remove list of currently playing
		this.playing = [];

		// Manage buttons state
		this.togglePlayButton();
		this.togglePauseButton();
		this.toggleStopButton();
	},

	/**
	 * Check if play button needs to be enabled and enable/disable it
	 */
	togglePlayButton: function () {
		var enabled = false;

		if ( (this.playing.length === 0 || this.paused) && this.tracks.length !== 0) {
			// There are tracks
			var selectedTracks = $('.track-select:checked');
			if (selectedTracks.length !== 0) {
				// There are selected tracks
				var manager = this;

				// Check if selected tracks are ready
				var waveformReady = true;
				selectedTracks.each(function (index) {
					// Get track name from ID
					var id = $(this).prop('id');
					var name = id.substr(7, id.length);
					
					var track = manager.getTrack(name);
					if ('audio' === track.type && !track.waveformReady) {
						// There is a non ready track => can't enable play button
						waveformReady = false;
						return false; // Break the loop
					}
				});

				if (waveformReady) {
					// All waveform are loaded => we can enable play button
					enabled = true;
				}
			}
		}

		this.buttonPlay.prop('disabled', !enabled);
	},
	
	/**
	 * Check if pause button needs to be enabled and enable/disable it
	 */
	togglePauseButton: function () {
		var enabled = false;
		if (this.tracks.length !== 0 && this.playing.length !== 0 && !this.paused) {
			enabled = true;
		}

		this.buttonPause.prop('disabled', !enabled);
	},
	
	/**
	 * Check if stop button needs to be enabled and enable/disable it
	 */
	toggleStopButton: function () {
		var enabled = false;
		if (this.tracks.length !== 0 && this.playing.length !== 0) {
			enabled = true;
		}

		this.buttonStop.prop('disabled', !enabled);
	},

	/**
	 * Check if delete all button needs to be enabled and enable/disable it
	 */
	toggleDeleteButton: function () {
		var enabled = false;
		if (this.tracks.length !== 0) {
			enabled = true;
		}

		this.buttonDelete.prop('disabled', !enabled);
	},

	/**
	 * Save files on server
	 */
	save: function (fileType, fileName, blob) {
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
            		console.log('error');
            	}
            }
        };

        request.open('POST', 'save.php');
        request.send(formData);
	},

	/**
	 * Retrieve the track object in tracks list from its name
	 */
	getTrack: function (fileName) {
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
	getTrackIndex: function (fileName) {
		var index = null;
		for (var i = 0; i < this.tracks.length; i++) {
			var currentTrack = this.tracks[i];
			if (fileName == currentTrack['name']) {
				index = i;
				break;
			}
		}

		return index;	
	}
};