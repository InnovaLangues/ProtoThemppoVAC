<?php

$uploadDir = 'uploads/';

if (!empty($_REQUEST['file'])) {
    $path = $uploadDir . $_REQUEST['file'];

    if (is_file($path)) {

        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename=' . basename($path));
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($path));
        ob_clean();
        flush();
        readfile($path);
        exit;
    } else {
        echo "The file requested does not exist.";
    }
} else {
    echo 'You must specify a file to download. None given.';
}
