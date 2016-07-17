<!DOCTYPE html>
<html>
<head>
	<meta http-equiv="content-type" content="text/html;charset=utf-8">
	<title>xiaoyuan</title>
</head>
<body>


<?php
	
	function p($str){
		echo "<pre>";
		print_r($str);
		echo "</pre>";
	}
	function ps($str){
		p($str);
		die();
	}
	/*
	 *@$url string 远程图片地址
	 *@$dir string 目录，可选 ，默认当前目录（相对路径）
	 *@$filename string 新文件名，可选
	 */
	function GrabImage($url, $dir='', $filename=''){
		if(empty($url)){
			return false;
		}
		// 优化  通过存入的filename来判断是不是图片  filename的数据可以从value.name 来
		$ext = strrchr($filename, '.');
		if($ext != '.gif' && $ext != ".jpg" && $ext != ".bmp" && $ext != ".jpeg"){
			echo "不是图片格式！";
			// return false;
		}
	  	// 为空就当前目录
		if(empty($dir))$dir = './';

		$dir = realpath($dir);
	 	// 目录+文件
		$filename = $dir . (empty($filename) ? '/'.time().'.jpeg' : '/'.$filename);
	    // 开始捕捉 
		ob_start(); 
		readfile($url); 
		$img = ob_get_contents(); 
		ob_end_clean(); 
		$size = strlen($img); 
		$fp2 = fopen($filename , "a"); 
		fwrite($fp2, $img); 
		fclose($fp2); 
		return $filename; 
	} 




	$client_id = "e15f9541f2ef7953de96944dd65f7f88";
	$redirect_uri = "http://www.xiaoyuanromance.top";
	$redirect_uri = urlencode($redirect_uri);
	$response_type = "code";
	$state = "75f6fc0cb633a026a2bd5ffe386a0777";
	$client_secret = "75f6fc0cb633a026a2bd5ffe386a0777";
	//$scope = "http://bbs.byr.cn/";
	$grant_type = "authorization_code";

	// 获取认证码 authorization_code
	$authorize_url = "http://bbs.byr.cn/oauth2/authorize?response_type=$response_type&client_id=$client_id&";
	$authorize_url .= "redirect_uri=$redirect_uri&state=$state";

	$string = file_get_contents($authorize_url);

	$string = str_replace('action="/oauth2/authorize/finishClientAuth"', 'action="http://bbs.byr.cn/oauth2/authorize/finishClientAuth"', $string);
	echo $string;
	$query_string = $_SERVER['QUERY_STRING'];
	// p($query_string);
	$authorization_code = explode("&", $query_string);
	$authorization_code = explode("=", $authorization_code[1]);
	$code = $authorization_code[1];
	// ps($code);
	if(!$code){
		return;
	}
	//  通过authorization Code 获取 Access Token
	$access_token_url = "http://bbs.byr.cn/oauth2/token";

// p($access_token_url);

	$post_data = array(
		'client_id' => $client_id,
		'client_secret' => $client_secret,
		'redirect_uri' => $redirect_uri,
		'grant_type' => $grant_type,
		'code' => $code,
	); 
	$post_data = http_build_query($post_data);
	// use curl post
	// 1.初始化 创建一个新curl资源
	$ch =  curl_init();
	// 2.设置URL和相应选项
	curl_setopt($ch, CURLOPT_URL, $access_token_url);
	curl_setopt($ch, CURLOPT_HEADER, 0);
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
	// CURLOPT_RETURNTRANSFER 设置为1才能返回实际数据否则是bool类型
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	// 3.抓取URL并把它传递给浏览器
	$res_json = curl_exec($ch);
	// 4.关闭cURL资源，释放系统资源
	curl_close($ch);
	$res_arr = json_decode($res_json,true);
	if($res_arr){
		$access_token = $res_arr['access_token'];
		$refresh_token = $res_arr['refresh_token'];
	}
// p($res_arr);

	// ------------------------------------(Optional) 权限自动续期，获取 Acces_token
	// $auto_refresh_access_token_url = "http://bbs.byr.cn/oauth2/token";
	// $post_data = array(
	// 	'oauth_token' => $access_token,
	// 	'client_id' => $client_id,
	// 	'client_secret' => $client_secret,
	// 	'redirect_uri' => $redirect_uri,
	// 	'grant_type' => "refresh_token",
	// 	'refresh_token' => $refresh_token,
	// ); 
	// $post_data = http_build_query($post_data);
	// // 1.初始化 创建一个新curl资源
	// $ch =  curl_init();
	// // 2.设置URL和相应选项
	// curl_setopt($ch, CURLOPT_URL, $auto_refresh_access_token_url);
	// curl_setopt($ch, CURLOPT_HEADER, 0);
	// curl_setopt($ch, CURLOPT_POST, 1);
	// curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
	// // CURLOPT_RETURNTRANSFER 设置为1才能返回实际数据否则是bool类型
	// curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	// // 3.抓取URL并把它传递给浏览器
	// $res_json = curl_exec($ch);
	// // 4.关闭cURL资源，释放系统资源
	// curl_close($ch);
	// $res_arr = json_decode($res_json,true);

	// p($res_arr);
	// -----------------------------------使用 Access token 获取用户信息
	$pre_url = "https://bbs.byr.cn/open";
	$query_url = "/user/getinfo.json";
	$url = $pre_url.$query_url;

	$res_json = file_get_contents($url.'?oauth_token='.$access_token);
// p($res_json);
//**************/
	$res_arr = json_decode($res_json,true);
// p('---------------');
// p($res_arr );
// p('---------------');

	// -----------------------------------获取用户信息
	$pre_url = "https://bbs.byr.cn/open";
	$query_url = "/user/query/ln2.json";
	$url = $pre_url.$query_url;
// p($url);
	$res_json = file_get_contents($url.'?oauth_token='.$access_token);
// p($res_json);
	//**************/
	$res_arr = json_decode($res_json,true);
// p('---------------');
// p($res_arr );
// p('---------------');

	// -----------------------------------获取板块信息
	$pre_url = "https://bbs.byr.cn/open";
	$query_url = "/section.json";
	$url = $pre_url.$query_url;

	// p($url.'?oauth_token='.$access_token);
		$res = file_get_contents($url.'?oauth_token='.$access_token);
	// p($res);
	//**************
		$res_arr = json_decode($res,true);
	// p('---------------');
	// p($res_arr );
	// ps('---------------');

	// 6是休闲娱乐
	// -----------------------------------获取指定分区的信息
	$pre_url = "https://bbs.byr.cn/open";
	$query_url = "/section/6.json";
	$url = $pre_url.$query_url;

	// p($url.'?oauth_token='.$access_token);
		$res = file_get_contents($url.'?oauth_token='.$access_token);
	// p($res);
	//**************
		$res_arr = json_decode($res,true);
	// p('---------------');
	// p($res_arr );
	// p('---------------');

	// -----------------------------------获取指定版面的信息
			$pre_url = "https://bbs.byr.cn/open";
			// $query_url = "/board/Picture.json";
			$query_url = "/board/Travel.json";

			$url = $pre_url.$query_url;
			$mode =2;
			$count =50;
			$start_page = 1;
			$end_page = 2;
			$theme_article = array();
			for($i=$start_page;$i<$end_page;$i++){
				$get_data ="&mode=".$mode."&count=".$count."&page=".$i;
				$res = file_get_contents($url.'?oauth_token='.$access_token.$get_data);
				$res_arr = json_decode($res,true);
				foreach ($res_arr['article'] as $key => $value) {
					if($value['has_attachment'] == 1){
						array_push($theme_article, $value);
					}
					
				}
			}

	// p($theme_article);
	//  获取当前主题的信息
	$pic = array();
	$temp = array();
	foreach ($theme_article as $key => $value) {
		// $query_url = "/article/Picture/".$value['id'].".json";
		$query_url = "/article/Travel/".$value['id'].".json";
		$url = $pre_url.$query_url;
		// p($url.'?oauth_token='.$access_token);
		$res = file_get_contents($url.'?oauth_token='.$access_token);
		$res_arr = json_decode($res,true);
// p($res_arr['attachment']['file']);
		foreach ($res_arr['attachment']['file'] as $key => $value) {
			$att_file_url = str_replace('open/attachment','att',$value['url']);
			$temp['pic_url'] = $att_file_url;
			$temp['pic_name'] = $value['name'];
			array_push($pic, $temp);
		}
		
	}

	p($pic);
	foreach ($pic as $key => $value) {
		echo "<img src= ".$value['pic_url']." style=width:100px;height:100px/>";
		// GrabImage($value['pic_url'],"./pic/",$value['pic_name']);
	    GrabImage("$value","./travel/",$value['pic_name']);
	}

	
	
	
	 







?>






</body>
</html>
