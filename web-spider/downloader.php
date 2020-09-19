<?php

$jsonfile = $argv[1];

function download($url, $name, $path, $retryCount = 1, $maxCount = 1) {

    $filename = $path . '/' . $name;

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

            $f = fopen($path . '/failed-downloads.log', 'a+');
            fwrite($f, "$url\n");
            fclose($f);

            return false;
        }

        echo "fail to download $url \n";
        echo "$retryCount times, sleep 500ms then retry\n";

        usleep(500000);

        return download($url, $name, $path, $retryCount + 1);
    }

    echo "sleep 200ms after a success download\n";
    usleep(200000);

    return $filename;
}

if (file_exists($jsonfile)) {
    $files = json_decode(file_get_contents($jsonfile), true);
    $dir = dirname($jsonfile);

    mkdir($dir . '/download');

    foreach ($files as $file) {

        download($file, basename($file), $dir . '/download');
    }
}
else {
    echo 'json file not found';
    exit;
}

// nohup php download.php files.json &
