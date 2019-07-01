// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const TAG_CLIENT = "ONESTORE_CLIENT:";
const TAG_SERVICE = "ONESTORE_SERVICE:";
const HEADER = "#  REQUEST HEADER  #";
const BODY = "#  REQUEST BODY  #";

function getValue(row) {
	if (row == 'undefined' || row == null) {
		return "";
	}
	
	const TAG = row.indexOf(TAG_SERVICE) > -1 ? TAG_SERVICE : TAG_CLIENT;
	
	return row.substr(row.indexOf(TAG)+TAG.length+1, row.length);
}

function parseHeader(header) {
	let result = "";
	$.each(header.split(/], /g), function (index, value) {
		result += "-H '" + value.replace(/^{|]}/g, '').replace(/=\[/g, ': ') + "' \\\n";
	});
	
	return result;
}

function generateCurlCommand(header, body, url, toTxt, chkPost) {
	let curl = "";
	curl += "curl -v --connect-timeout 5 --max-time 10 \\\n";
	curl += parseHeader(header);
	if (body != null && body != "") {
		curl += "-d '" + body + "' \\\n";
		if (chkPost) {
			curl += url + "\n";
		} else {
			curl += "-X GET " + url + "\n";
		}
	} else {
		curl += url + "\n";
	}
	
	toTxt.val(curl);
	
	// console.log("CURL command has been generated.");
}

function copyToClipboard(toTxt) {
	var $temp = $("<textarea>");
	$("body").append($temp);	
	$temp.val(toTxt.val()).select();
	document.execCommand("copy");
	$temp.remove();
	
	// console.log("CURL command has been copied to clipboard.");
}

function showInfoPopup() {
	if ($(".popuptext").is(":visible") == false) {
		$(".popuptext").fadeIn().delay(1500).fadeOut();
	}
}

$(function () {
	$("#chk-post").change(function() {
		$("#curl-command-parsing").trigger("click");
	});	
	
	$("#curl-command-parsing").click(function() {
		let fromTxt = $("#from-txt");
		let toTxt = $("#to-txt");
		let chkPost = $("#chk-post");
		let isPost = $("#chk-post").is(":checked");
		toTxt.val("");
		
		// console.log("isPost: " + isPost);
		
		if (fromTxt.val() == "") {
			return;
		}
		
		let rows = $("#from-txt").val().split("\n");
		let headerBegin = false;
		let url = "";
		let header = "";
		let body = "";
		$.each(rows, function(index, value) {
			if (value.indexOf(TAG_CLIENT) == -1 && value.indexOf(TAG_SERVICE) == -1) {
				return;
			}
				
			if (value.indexOf(HEADER) > -1) {
				url = getValue(rows[index-1]);
				headerBegin = true;
			} else if (value.indexOf(BODY) > -1) {
				headerBegin = false;
				body += getValue(rows[index+1]);
				return false;
			} else if (headerBegin) {
				header += getValue(value);
			}
		});
		
		generateCurlCommand(header, body, url, toTxt, isPost);
		copyToClipboard(toTxt);
		showInfoPopup();
	});
});