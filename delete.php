<?php
if (isset($_POST['delete-file'])) {

    if (!unlink($_POST['delete-file'])) {
        echo 'error ' . $_POST['delete-file'];
    }
    else {
        echo 'success';
        // get directory from url 
        // url is t_uploads/directory/filename or s_uploads/directory/filename
        $urlArray = explode('/', $_POST['delete-file']);
        $dir = $urlArray[0] . '/' . $urlArray[1] . '/';
        if (file_exists($dir) && is_dir($dir)) {
	        if (count(glob($dir.'/*')) === 0) {
	        	// delete directory
	        	rmdir($dir);
	        }
            
        }
        
    }

}