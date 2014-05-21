<?php
if (isset($_POST['delete-file'])) {
    if (!unlink($_POST['delete-file'])) {
        echo 'error';
    }
    else {
        echo 'success';
    }
}