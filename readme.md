This branch only works with Firefox (v30+)

## Features :

- record audio and video in one file (webm container)
- save students videos using indexedDB

## Known bugs :

- can not replay a recorded video
- can not use video player slider to navigate through video (only for recorded videos)


## Uses [RecrdRTC](https://www.webrtc-experiment.com/RecordRTC/AudioVideo-on-Firefox.html)

How RecordRTC encodes wav/webm?

|Media File|Bitrate/Framerate|encoders|Framesize|additional info|
| ------------- |-------------|-------------|-------------|-------------|
|Audio File (WAV) | 1411 kbps | pcm_s16le |44100 Hz|stereo, s16|
|Video File (WebM)|60 kb/s | (whammy) vp8 codec yuv420p|--|SAR 1:1 DAR 4:3, 1k tbr, 1k tbn, 1k tbc (default)|
