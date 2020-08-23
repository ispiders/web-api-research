<?php

$jsonfile = $argv[1];

function download($url, $name, $path, $retryCount = 1, $maxCount = 1) {

    $filename = './' . $path . '/' . $name;

    if (file_exists($filename)) {
        return $filename;
    }

    echo "download $url => $filename\n";

    $img = @file_get_contents($url);

    if ($img) {
        file_put_contents($filename, $img);
    }
    else {

        if ($retryCount >= $maxCount) {
            echo "failed $retryCount times to download $url, abort\n";
            return false;
        }

        echo "fail to download $url \n";
        echo "$retryCount times, sleep 500ms then retry\n";

        $f = fopen('./failed-downloads.log', 'a+');
        fwrite($f, "$url\n");
        fclose($f);

        usleep(500000);

        return download($url, $name, $path, $retryCount + 1);
    }

    echo "sleep 200ms after a success download\n";
    usleep(200000);

    return $filename;
}

if (file_exists($jsonfile)) {
    $files = json_decode(file_get_contents($jsonfile), true);

    foreach ($files as $file) {
        foreach ($file as $key => $arr) {
            if (!empty($arr[0])) {
                download($arr[0], $arr[1], 'download');
            }
        }
    }
}
else {
    echo 'json file not found';
    exit;
}
