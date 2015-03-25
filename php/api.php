<?php

include_once '../vendor/autoload.php';

use Httpful\Request;

$url = $_GET['url'];
$token = @$_GET['token'];
$method = @$_GET['method'];
$content = @$_GET['content'];


if ($method === 'post') {
    $request = Request::post($url);
}
else if ($method === 'put') {
    $request = Request::put($url);
}
else if ($method === 'delete') {
    $request = Request::delete($url);
}
else { //get
    $request = Request::get($url);
}

if($content) $request->sendsJson()->body($content);

if($token) $request->xAuthToken($token);


$response = $request->send();

// print_r($response);

$res = json_encode($response->body);

$callback_func_name = @$_GET["callback"];

if($callback_func_name) echo $callback_func_name."(".$res.");"; //JSONP
else echo $res; // raw JSON
exit;
