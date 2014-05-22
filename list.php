<?php

// student tracks
if (isset($_POST["uid"])) {
    $uid = trim($_POST["uid"]);

    
    $path = 's_uploads/' . $uid . '/';
    $tracks = array();
    
    // Get all existing files (student)
    $directory = dir($path);
    if ($directory) {
        while ($entry = $directory->read()) {
            $filename = $path . $entry;
            
            // file
            if (is_file($filename)) {
                
                // Current element is a file => check type
                $fileInfo = pathinfo($entry);
                if (!empty($fileInfo) && !empty($fileInfo['extension']) && in_array($fileInfo['extension'], array('mp3', 'wav', 'webm', 'mp4'))) {
                    
                    $extension = $fileInfo['extension'];
                    
                    // webm
                    $type = 'video';
                    
                    // audio
                    if (($extension == 'wav') || ($extension == 'mp3')) {
                        $type = 'audio';
                    } else if ($extension == 'mp4') {
                        $type = 'av';
                    }
                    
                    // add new media to tracks array
                    $tracks[] = array(
                        'type' => $type, 
                        'name' => $fileInfo['filename'], 
                        'url' => $filename, 
                        'recorded' => true, 
                        'deletable' => true, 
                        'downloadable' => true, 
                        'extension' => $extension, 
                        'owner' => 'student'
                    );
                }
            }
        }
        $directory->close();
    }
}

// change path to get model medias (teacher...)
$path2 = 't_uploads/';

// Get all existing files (models from teacher)
$directory2 = dir($path2);

if ($directory2) {
    
    while ($entry = $directory2->read()) {
        $filename = $path2 . $entry;
        
        if (is_file($filename)) {
            
            // Current element is a file => check type
            $fileInfo = pathinfo($entry);
            if (!empty($fileInfo) && !empty($fileInfo['extension']) && in_array($fileInfo['extension'], array('mp3', 'wav', 'webm', 'mp4'))) {
                
                $extension = $fileInfo['extension'];
                
                // webm
                $type = 'video';
                
                // audio
                if (($extension == 'wav') || ($extension == 'mp3')) {
                    $type = 'audio';
                } else if ($extension == 'mp4') {
                    $type = 'av';
                }
                
                // add new media to tracks array
                $tracks[] = array('type' => $type, 'name' => $fileInfo['filename'], 'url' => $filename, 'recorded' => false, 'deletable' => false, 'downloadable' => false, 'extension' => $extension, 'owner' => 'teacher');
            }
        }
    }
    $directory2->close();
}

echo json_encode($tracks);
