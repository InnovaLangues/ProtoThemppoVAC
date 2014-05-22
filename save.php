<?php
if (isset($_POST["uid"])) {
    $uid = trim($_POST["uid"]);
} else {
    echo 'no uid';
    die;
}

foreach (array('video', 'audio', 'av') as $type) {
    
    if (isset($_FILES["${type}-blob"])) {
        
        $fileName = trim($_POST["${type}-filename"]);
        
        $owner = trim($_POST["${type}-owner"]);
        
        //$uid = trim($_POST["uid"]);
        
        $dir = $owner == "student" ? "s_uploads/" . $uid : "t_uploads/" . $uid;
        // create directory only if not exists
        if (!file_exists($dir) && !is_dir($dir)) {
            mkdir($dir, 0777);
        }
        
        $url = $dir . '/' . $fileName;
        
        if (!move_uploaded_file($_FILES["${type}-blob"]["tmp_name"], $url)) {
            echo ("problem moving uploaded file");
        } else {
            $fileInfo = pathinfo($url);            
            $extension = $fileInfo['extension'];
            $type = 'video';
            if (($extension == 'wav') || ($extension == 'mp3')) {
                $type = 'audio';
            }
            $track = array(
                'type' => $type, 
                'name' => $fileInfo['filename'], 
                'url' => $url, 
                'recorded' => true, 
                'deletable' => true, 
                'downloadable' => true, 
                'extension' => $extension, 
                'owner' => $owner,
                'uid' => $uid
            );
            
            echo json_encode($track);
        }
    }
}
