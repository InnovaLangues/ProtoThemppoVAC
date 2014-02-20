<?php

$uploadDir = 'uploads/';
if (!empty($_REQUEST['file'])) {
	$path = $uploadDir . $_REQUEST['file'];
	if (is_file($path)) {
		// File exists

		// set the headers, prevent caching
		header("Pragma: public");
		header("Expires: -1");
		header("Cache-Control: public, must-revalidate, post-check=0, pre-check=0");
		header('Content-Disposition: attachment; filename="' . $path . '"');
	}
	else {
		echo "The file requested does not exist.";
	}
}
else {
	echo 'You must specify a file to download. None given.';
}
