var TrackManager = {
	buttonPlay: null,
	buttonPause: null,
	buttonStop: null,
	buttonDelete: null,

	container: null,

	tracks: [],

	playing: {},

	initialize: function () {
		// Load tracks
		this.loadTracks();

		// Store buttons
		this.buttonPlay   = $('#tracks-play');
		this.buttonPause  = $('#tracks-pause');
		this.buttonStop   = $('#tracks-stop');
		this.buttonDelete = $('#tracks-delete');

		this.container = $('#tracks-list tbody');

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
			if ($(this).is(':checked')) {
				el.data.buttonPlay.prop('disabled', false);

				if (checked === el.data.tracks.length) {
					$('#tracks-select').prop('checked', true);
					$('#tracks-select').prop('indeterminate', false);
				}
				else {
					$('#tracks-select').prop('checked', false);
					$('#tracks-select').prop('indeterminate', true);
				}
			}
			else {
				if (0 === checked) {
					el.data.buttonPlay.prop('disabled', true);
					$('#tracks-select').prop('checked', false);
					$('#tracks-select').prop('indeterminate', false);
				}
				else {
					$('#tracks-select').prop('checked', false);
					$('#tracks-select').prop('indeterminate', true);
				}
			}
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
		// Enable button if needed
		this.buttonDelete.prop('disabled', false);

		// Add track to list
		this.tracks.push(track);

		// Remove no track line if needed
		this.container.find('.no-track').remove();

		// Display new track
		var html = '';
		html += '<tr id="' + track.name + '">';

        html += '    <td><input type="checkbox" class="track-select" name="select-' + track.name + '" id="select-' + track.name + '" value="1" /></td>';
        
        // Track name
		html += '    <td>';
        if ('audio' === track.type) {
        	html += '	<span class="glyphicon glyphicon-music"></span> ';
        }
        else if ('video' === track.type) {
        	html += '	<span class="glyphicon glyphicon-film"></span> ';
        }
        html +=          track.name;
        html += '    </td>';

        // Media player
        html += '    <td>';
        if ('audio' == track.type) {
        	html += '	<audio id="player-' + track.name + '" controls="true">';
        	html += '		<source type="audio/wav" src="' + track.url + '" />';
        	html += '	</audio>';
        }
        else {
        	html += '	<video id="player-' + track.name + '" class="" poster="media/poster/poster.jpg" controls="controls" preload="none">';
            html += '   	<source type="video/webm" src="' + track.url + '" />';
            html += '	</video>';
        }
        html += '    </td>';

        html += '	 <td id="waveform-' + track.name + '"></td>';
        html += '    <td class="text-right">';

        // Download button
        var file = track.name + ('audio' === track.type ? '.wav' : '.webm');
        html += '        <a href="download.php?file=' + file + '" target="_blank" class="track-download btn btn-sm btn-default" role="button">';
        html += '            <span class="glyphicon glyphicon-download-alt"></span> Download track';
        html += '        </a>';

        // Delete button
        html += '        <button class="track-delete btn btn-sm btn-danger" role="button">';
        html += '            <span class="glyphicon glyphicon-trash"></span> Delete track';
        html += '        </button>';

        html += '    </td>';
        html += '</tr>';

		this.container.append(html);

		// var waveform = new Waveform({
		// 	container: document.getElementById('waveform-' + track.name),
		// 	innerColor: '#333',
		// 	data: [0.5, 1.0, 0.5, 1.0]
		// });
		// Draw waveform
		/*SC.get(track.url, function (track) {
			

			waveform.dataFromSoundCloudTrack(track);
			var streamOptions = waveform.optionsForSyncedStream();
			SC.stream(track.uri, streamOptions, function(stream) {
				window.exampleStream = stream;
			});
		});*/
	},

	deleteTrack: function (fileName) {
		if (!fileName) return;

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

	                    // Change buttons state if needed
						manager.buttonPlay.prop('disabled', true);
						manager.buttonDelete.prop('disabled', true);
					}
	            }
	        };

	        request.open('POST', 'delete.php');
        	request.send(formData);
	    }
	},

	selectAllTracks: function () {
		$('.track-select').prop('checked', true);

		this.buttonPlay.prop('disabled', false);
	},

	unselectAllTracks: function () {
		$('.track-select').prop('checked', false);

		this.buttonPlay.prop('disabled', true);
	},

	deleteAllTracks: function () {
		this.buttonPlay.prop('disabled', true);
		this.buttonDelete.prop('disabled', true);

		for (var i = 0; i < this.tracks.length; i++) {
			var track = this.tracks[i];
			this.deleteTrack(track.name);
		}
	},

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

	play: function () {
		// Manage buttons state
		this.buttonPlay.prop('disabled', true);
		this.buttonPause.prop('disabled', false);
		this.buttonStop.prop('disabled', false);

		// Start playing selected tracks
		var toPlay = $('.track-select:checked');
		toPlay.each(function(index) {
			// Get track name from ID
			var id = $(this).prop('id');
			var name = id.substr(7, id.length);

			// Retrieve and start corresponding player
			var player = $('#player-' + name).get(0);
			player.play();
		})
	},

	pause: function () {
		// Manage buttons state
		this.buttonPause.prop('disabled', true);
		this.buttonPlay.prop('disabled', false);
		this.buttonStop.prop('disabled', false);	
	},

	stop: function () {
		// Manage buttons state
		this.buttonStop.prop('disabled', true);
		this.buttonPause.prop('disabled', true);
		this.buttonPlay.prop('disabled', false);
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
            	console.log(request.responseText);
            	if ('error' != request.responseText) {
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

	getTrack: function (fileName) {
		var track = null;

		var trackIndex = this.getTrackIndex(fileName);
		if (null !== trackIndex) {
			track = this.tracks[trackIndex];
		}

		return track;
	},

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