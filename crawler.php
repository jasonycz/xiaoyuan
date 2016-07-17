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





	$url = "https://bbs.byr.cn/";
//******GET方式
	$ch = curl_init($url); 
p($url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true) ; // 获取数据返回  
	curl_setopt($ch, CURLOPT_BINARYTRANSFER, true) ; // 在启用 CURLOPT_RETURNTRANSFER 时候将获取数据返回  
	$res_json = curl_exec($ch) ;  
	   
p($res_json);
















