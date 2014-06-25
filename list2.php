<?php

/**
 * Get all model tracks (from teachers)
 **/

// change path to get model medias (teacher...)
$path = 't_uploads/';

// Get all existing files (models from teacher)
$directory = dir($path);

if ($directory) {
    
    while ($entry = $directory->read()) {
        $filename = $path . $entry;
        
        if (is_file($filename)) {
            
            // Current element is a file => check type
            $fileInfo = pathinfo($entry);
            if (!empty($fileInfo) && !empty($fileInfo['extension']) && in_array($fileInfo['extension'], array('mp3', 'wav', 'webm', 'mp4'))) {
                
                $extension = $fileInfo['extension'];
                
              
                    $type = 'av';
                
                // add new media to tracks array
                $tracks[] = array(
					'type' => $type, 
					'name' => $fileInfo['filename'], 
					'url' => $filename, 
					'recorded' => false, 
					'deletable' => false, 
					'downloadable' => false, 
					'extension' => $extension, 
					'owner' => 'teacher'
				);
            }
        }
    }
    $directory->close();
}

echo json_encode($tracks);
