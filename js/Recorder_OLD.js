var Recorder = {
    /**
     * Start recording HTML button
     */
    buttonStart: null,
    /**
     * Stop recording HTML button
     */
    buttonStop: null,
    preview: null,
    connection: null,
    currentStream: null,
    /**
     * Initialize the recorder
     */
    initialize: function() {
        this.buttonStart = $('#record-start');
        this.buttonStop = $('#record-stop');

        var recorder = this;

        // Init recorder
        this.connection = new RTCMultiConnection();
        
        /*this.connection.session = {
            audio : true,
            video : true
        };*/
        this.connection.connect();

        this.connection.onstream = function(e) {
            e.type === 'local';
            recorder.currentStream = e.streamid;
            recorder.preview = e.mediaElement;
            console.log(e.mediaElement);
            recorder.startPreview();

            recorder.connection.streams[recorder.currentStream].startRecording({
                audio: true,
                video: true
            });
        };

        this.connection.onmute = function(e) {
            //console.log('MUTED');
        };

        this.connection.onerror = function(e) {
            // e.userid
           console.log(e);
        }

        // Start recording
        $('body').on('click', '#record-start', this, function(el) {
            el.data.start();
            return false;
        });

        // Stop recording
        $('body').on('click', '#record-stop', this, function(el) {
            el.data.stop();
            return false;
        });
    },
    /**
     * Start recording
     */
    start: function() {
        //var recorder = this;

        this.connection.sessionid = (Math.random() * 999999999999).toString().replace('.', '');
        /*this.connection.bandwidth = {
         audio: 50,
         video: 256
         };*/

        this.connection.open();

        // Disable record button
        this.buttonStart.prop('disabled', true);
        this.buttonStop.prop('disabled', false);
    },
    /**
     * Stop recording
     */
    stop: function() {
        // Disable start button
        this.buttonStart.prop('disabled', false);
        this.buttonStop.prop('disabled', true);


        if (typeof this.connection.streams !== 'undefined' && this.connection.streams !== null && this.connection.streams.length !== 0
                && typeof this.connection.streams[this.currentStream] !== 'undefined' && this.connection.streams[this.currentStream] !== null
                && this.connection.streams[this.currentStream].length !== 0)
        {

            var recorder = this;
            var cStreamId = this.currentStream;
            this.connection.streams[cStreamId].stopRecording(function(audioBlob, videoBlob) {
                
                console.log(audioBlob);
                console.log(videoBlob);
                
                // Generate unique name
                var date = new Date();

                var month = date.getMonth();
                if (month < 10)
                    month = '0' + month.toString();

                var day = date.getDay();
                if (day < 10)
                    day = '0' + day.toString();

                var hours = date.getHours();
                if (hours < 10)
                    hours = '0' + hours;

                var minutes = date.getMinutes();
                if (minutes < 10)
                    minutes = '0' + minutes;

                var seconds = date.getSeconds();
                if (seconds < 10)
                    seconds = '0' + seconds;

                var fileName = date.getFullYear() + '-' + month + '-' + day + '_' + hours + 'h' + minutes + 'm' + seconds;               
                
                // TODO export recorded track to mp3 ( ogg ? )

                // Save video on the server
                TrackManager.save('video', 'video_' + fileName, videoBlob);

                // Save audio on the server
                TrackManager.save('audio', 'audio_' + fileName, audioBlob);
                
                // ffmpeg can remerge audio && video 
                recorder.connection.close();
                recorder.stopPreview();
            //});
            }, {audio: true, video: true});

        }
    },
    startPreview: function() {
        this.preview.className = 'col-md-offset-3 col-md-6';
        this.preview.volume = 1;
        this.preview.muted = false;
        this.preview.controls = false;

        $('#recorder').empty().append(this.preview);
    },
    stopPreview: function() {
        //this.preview.pause();
        this.preview.src = '';
        $('#recorder').empty().append('<div class="row"><img src="media/poster/poster.jpg" class="col-md-offset-3 col-md-6" /></div>');
    }
};