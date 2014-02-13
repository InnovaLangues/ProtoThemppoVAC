var TrackManager = {
	buttonPlay: null,
	buttonPause: null,
	buttonStop: null,
	buttonDelete: null,

	container: null,

	tracks: {},

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

		// Delete a track
		$('body').on('click', '.track-delete', this, function (el) {
			// Get track name
			var trackToRemove = $(this).parents('tr').prop('id');
			el.data.deleteTrack(trackToRemove);
			return false;
		});
	},

	addTrack: function (fileType, fileName, fileURL) {
		// Enable play button if needed
		this.buttonPlay.prop('disabled', false);
		this.buttonDelete.prop('disabled', false);

		// Add track to list
		this.tracks[fileName] = {
			type: fileType,
			name: fileName,
			url: fileURL
		};

		// Remove no track line if needed
		this.container.find('.no-track').remove();

		// Display new track
		var html = '';
		html += '<tr id="' + fileName + '">';

		// Add track info
        html += '    <td><input type="checkbox" value="" name=""/></td>';
        html += '    <td></td>';

        html += '    <td>';
        if ('audio' === fileType) {
        	html += '	<span class="glyphicon glyphicon-music"></span> ';
        }
        else if ('video' === fileType) {
        	html += '	<span class="glyphicon glyphicon-film"></span> ';
        }
        html +=          fileName;
        html += '    </td>';

        html += '    <td></td>';
        html += '    <td class="text-right">';

        // Download button
        var file = fileName + ('audio' === fileType ? '.wav' : '.webm');
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

	},

	deleteTrack: function (fileName) {
		if (!fileName) return;

		var track = this.tracks[fileName];
		if (typeof track !== 'undefined' && null != track && track.length !== 0) {
			var manager = this;

			// Delete file from server
	        var formData = new FormData();
	        formData.append('delete-file', track.url);

	        var request = new XMLHttpRequest();
	        request.onreadystatechange = function() {
	            if (4 == request.readyState && 200 == request.status) {
	            	// Remove track from list
	                manager.container.find('#' + track.name).remove();
					delete manager.tracks[fileName];

					if (manager.tracks.length === 0) {
						// Add no track line
						var html = '';
						html += '<tr class="no-track">';
	                    html += '    <td colspan="5" class="text-center"><em>You have no recorded track.</em></td>';
	                    html += '</tr>';

	                    manager.container.append(html);

	                    // Change buttons state if needed
						this.buttonPlay.prop('disabled', true);
						this.buttonDelete.prop('disabled', true);
					}
	            }
	        };

	        request.open('POST', 'delete.php');
        	request.send(formData);
	    }
	},

	deleteAllTracks: function () {
		this.buttonPlay.prop('disabled', true);
		this.buttonDelete.prop('disabled', true);

		for (var track in this.tracks) {
			this.deleteTrack(track);
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
            			manager.addTrack(track.type, track.name, track.url);
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

		// Display progressbar

		// Send file to server
		var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
            if (4 == request.readyState && 200 == request.status) {
                // Hide progressbar

        		// Display new track in list
        		manager.addTrack(fileType, fileName, request.responseText);
            }
        };

        // Update progressbar
        // request.onprogress = function(e) {
        //     if (progress) progress.value = e.loaded;
        // };

        request.open('POST', 'save.php');
        request.send(formData);
	}
};