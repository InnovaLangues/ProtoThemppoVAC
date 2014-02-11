var TrackManager = {
	buttonPlay: null,
	buttonPause: null,
	buttonStop: null,
	buttonDelete: null,

	container: null,

	tracks: [],

	initialize: function () {
		this.buttonPlay   = $('#tracks-play');
		this.buttonPause  = $('#tracks-pause');
		this.buttonStop   = $('#tracks-stop');
		this.buttonDelete = $('#tracks-delete');

		// Play selected tracks
		$('body').on('click', '#tracks-play', this, function (el) {
			el.data.play();
		});

		// Pause playing elements
		$('body').on('click', '#tracks-pause', this, function (el) {
			el.data.pause();
		});

		// Stop playing elements
		$('body').on('click', '#tracks-stop', this, function (el) {
			el.data.stop();
		});

		// Delete all saved tracks
		$('body').on('click', '#tracks-delete', this, function (el) {
			el.data.deleteAllTracks();
		});
	},

	addTrack: function (fileType, fileName, fileURL) {
		// Enable play button if needed
		this.buttonPlay.prop('disabled', false);
		this.buttonDelete.prop('disabled', false);
	},

	deleteTrack: function () {
		if (tracks.length === 0) {
			this.buttonPlay.prop('disabled', true);
			this.buttonDelete.prop('disabled', true);
		}
	},

	deleteAllTracks: function () {

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
		var data = {};
		data[fileType + '-filename'] = fileName;
		data[fileType + '-blob'] = blob;

        var $manager = this;
        $.ajax({
        	url: 'save.php',
        	data: data,
        	beforeSend: function () {
        		// Display progressbar
        	},
        	success: function (data) {
        		// Hide progressbar

        		// Display new track in list
        		$manager.add(fileType, fileName, data);
        	}
        });
	}
};