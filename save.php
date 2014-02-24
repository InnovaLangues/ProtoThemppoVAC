<?php
ini_set('display_errors', 'on');
ini_set('upload_max_filesize', '1G');

// Muaz Khan     - https://github.com/muaz-khan 
// MIT License   - https://www.webrtc-experiment.com/licence/
// Documentation - https://github.com/muaz-khan/WebRTC-Experiment/tree/master/RecordRTC
foreach (array('video', 'audio') as $type) {
    if (isset($_FILES[$type . '-blob'])) {
		$filename = trim($_POST[$type . '-filename']);
        $path = trim('uploads/' . $filename);

        if (!move_uploaded_file($_FILES[$type . '-blob']['tmp_name'], $path)) {
            // echo 'error : ' . $_FILES[$type . '-blob']['error'] ;
            echo 'error';
        }
		else {
			$fileInfo = pathinfo($path);
			$track = array (
	    		'type'         => 'wav' == $fileInfo['extension'] ? 'audio' : 'video',
	    		'name'         => $fileInfo['filename'],
	    		'url'          => $path,
	    		'recorded'     => true,
	    		'deletable'    => true,
                'downloadable' => true,
	    	);

			echo json_encode($track);
		}
    }
}