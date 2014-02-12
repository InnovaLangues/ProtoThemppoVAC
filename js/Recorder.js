var Recorder = {
	/**
	 * Preview user Webcam
	 */
	preview: null,

	/**
	 * Start recording HTML button
	 */
	buttonStart: null,
	
	/**
	 * Stop recording HTML button
	 */
	buttonStop:  null,

	/**
	 * Current video recorder
	 */
	recordVideo: null,

	/**
	 * Current audio recorder
	 */
	recordAudio: null,

	/**
	 * Initialize the recorder
	 */
	initialize: function () {
		this.buttonStart = $('#record-start');
		this.buttonStop  = $('#record-stop');
		this.preview     = $('#record-preview');

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
		// Disable record button
		this.buttonStart.prop('disabled', true);

        // Get the correct Media device for current browser
        navigator.getMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

        var recorder = this;

		// Try to enable media device
        navigator.getMedia(
        	// Constraints
        	{ audio: true, video: true }, 

        	// Success callback => start recording
        	function (stream) {
        		// Start preview
        		var preview = recorder.preview.get(0);
        		preview.src = window.URL.createObjectURL(stream);
        		preview.play();

				// Initialize audio recorder
	            recorder.recordAudio = RecordRTC(stream, {
					//bufferSize: 16384,
					//sampleRate: 45000
				});

	            // initialize video recorder
	            recorder.recordVideo = RecordRTC(stream, {
	                type: 'video'
	            });

	            recorder.recordAudio.startRecording();
	            recorder.recordVideo.startRecording();

	            // Enable stop recording button
	            recorder.buttonStop.prop('disabled', false);
        	},

        	function (err) {
        		return false;
        	}
        );
	},

	/**
	 * Stop recording
	 */
	stop: function () {
		
		// alert('coucou');

		// Disable start button
		this.buttonStart.disabled = false;
        this.buttonStop.disabled  = true;	

        // Generate unique name
        var fileName = Math.round(Math.random() * 99999999) + 99999999;

        // Stop audio recorder
        this.recordAudio.stopRecording();
        TrackManager.save('audio', 'audio' + fileName, this.recordAudio.getBlob());

        // Stop video recorder
        this.recordVideo.stopRecording();
        TrackManager.save('video', 'video' + fileName, this.recordVideo.getBlob());

        // Stop previewing media device
        this.preview.prop('src', '');
	}
};