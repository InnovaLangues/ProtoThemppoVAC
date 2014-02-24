<?php
$path = 'uploads/';
$tracks = array ();

// Get all existing files
$directory = dir($path);
if ($directory) {
    while ($entry = $directory->read()) {
        $filename = $path . $entry;
        if (is_file($filename)) {
            // Current element is a file => check type
            $fileInfo = pathinfo($entry);
            if (!empty($fileInfo) && !empty($fileInfo['extension']) && in_array($fileInfo['extension'], array ('wav', 'webm'))) {
            	// Audio or video file
            	$tracks[] = array (
            		'type'         => 'wav' == $fileInfo['extension'] ? 'audio' : 'video',
            		'name'         => $fileInfo['filename'],
            		'url'          => $filename,
                    'recorded'     => true,
                    'deletable'    => true,
                    'downloadable' => true,
            	);
            }
        }
    }
    $directory->close();
}

echo json_encode($tracks);