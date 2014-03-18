<?php

foreach (array('video', 'audio', 'av') as $type) {

    if (isset($_FILES["${type}-blob"])) {

        $fileName = trim($_POST["${type}-filename"]);
        
        $owner = trim($_POST["${type}-owner"]);
        
        $uploadDirectory = $owner == "student" ? "s_uploads/" . $fileName : "t_uploads/" . $fileName;
        if (!move_uploaded_file($_FILES["${type}-blob"]["tmp_name"], $uploadDirectory)) {
            echo("problem moving uploaded file");
        } else {
            $fileInfo = pathinfo($uploadDirectory);

            $extension = $fileInfo['extension'];
            $type = 'video';
            if (($extension == 'wav') || ($extension == 'mp3')) {
                $type = 'audio';
            }
            $track = array(
                'type' => $type,
                'name' => $fileInfo['filename'],
                'url' => $uploadDirectory,
                'recorded' => true,
                'deletable' => true,
                'downloadable' => true,
                'extension' => $extension,
                'owner' => $owner
            );

            echo json_encode($track);
        }
    }
}
