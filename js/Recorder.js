var Recorder = {
	/**
	 * Start recording HTML button
	 */
	buttonStart: null,
	
	/**
	 * Stop recording HTML button
	 */
	buttonStop:  null,

	preview: null,

	connection: null,

	currentStream: null,

	/**
	 * Initialize the recorder
	 */
	initialize: function () {
		this.buttonStart = $('#record-start');
		this.buttonStop  = $('#record-stop');

		var recorder = this;

		// Init recorder
		this.connection = new RTCMultiConnection();
		this.connection.connect();
		this.connection.onstream = function (e) {
			e.type == 'local';
			recorder.currentStream = e.streamid;
			recorder.preview = e.mediaElement;

			recorder.startPreview();

			recorder.connection.streams[recorder.currentStream].startRecording({
		        audio: true,
		        video: true
		    });
		};

		// Start recording
		$('body').on('click', '#record-start', this, function (el) {
			el.data.start();
			return false;
		});

		// Stop recording
		$('body').on('click', '#record-stop', this, function (el) {
			el.data.stop();
			return false;
		});
	},

	/**
	 * Start recording
	 */
	start: function () {
		var recorder = this;

		this.connection.sessionid = (Math.random() * 999999999999).toString().replace('.', '');
		this.connection.open();

		// Disable record button
		this.buttonStart.prop('disabled', true);
		this.buttonStop.prop('disabled', false);
	},

	/**
	 * Stop recording
	 */
	stop: function () {
		// Disable start button
		this.buttonStart.prop('disabled', false);
        this.buttonStop.prop('disabled', true);	

        if (typeof this.connection.streams != 'undefined' && this.connection.streams != null && this.connection.streams.length != 0
        	&& typeof this.connection.streams[this.currentStream] != 'undefined' && this.connection.streams[this.currentStream] != null && this.connection.streams[this.currentStream].length != 0) {
	        
			var recorder = this;
	        this.connection.streams[this.currentStream].stopRecording(function(audioBlob, videoBlob) {
		        // Generate unique name
		        var fileName = Math.round(Math.random() * 99999999) + 99999999;

		        // Stop video recorder
		        TrackManager.save('video', 'video' + fileName, videoBlob);

		        // Stop audio recorder
		        TrackManager.save('audio', 'audio' + fileName, audioBlob);

		        recorder.stopPreview();
		        recorder.connection.close();
	        });
    	}
	},

	startPreview: function () {
		this.preview.className = 'col-md-12';
		this.preview.volume = 1;
		this.preview.muted = false;
		this.preview.controls = false;

		$('#recorder').empty().append(this.preview);
	},

	stopPreview: function () {
		this.preview.pause();
		$('#recorder').empty().append('<img src="media/poster/poster.jpg" class="col-md-12" />');
	}
};