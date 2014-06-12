<?php
if (isset($_POST["uid"])) {
    $uid = trim($_POST["uid"]);
} else {
    echo 'no uid';
    die;
}

if (isset($_FILES["blob"])) {
    
    $fileName = trim($_POST["filename"]);
    
    $owner = trim($_POST["owner"]);
    
    //$uid = trim($_POST["uid"]);
    
    $dir = 's_uploads/' . $uid;
     //$owner == "student" ? "s_uploads/" . $uid : "t_uploads/" . $uid;
    // create directory only if not exists
    if (!file_exists($dir) && !is_dir($dir)) {
        mkdir($dir, 0777);
    }
    
    $url = $dir . '/' . $fileName;
    
    if (!move_uploaded_file($_FILES["blob"]["tmp_name"], $url)) {
        echo ("problem moving uploaded file");
    } else {
        $fileInfo = pathinfo($url);
        $extension = $fileInfo['extension'];
        $type = 'video';
        $track = array('type' => $type, 'name' => $fileInfo['filename'], 'url' => $url, 'recorded' => true, 'deletable' => true, 'downloadable' => true, 'extension' => $extension, 'owner' => $owner, 'uid' => $uid);
        
        echo json_encode($track);
    }
}
