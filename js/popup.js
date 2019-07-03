// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

const TAG_CLIENT = 'ONESTORE_CLIENT:';
const TAG_SERVICE = 'ONESTORE_SERVICE:';
// const LOG_URL = '#  REQUEST URL  #';
const LOG_HEADER = '#  REQUEST HEADER  #';
const LOG_BODY = '#  REQUEST BODY  #';

function getValue(row) {
	if (row == 'undefined' || row == null) {
		return '';
	}
	
	let tagServiceIndex = row.indexOf(TAG_SERVICE);
	let tagClientIndex = row.indexOf(TAG_CLIENT);
	
	if (tagServiceIndex == -1 && tagClientIndex == -1) {
		return '';
	}
	
	const TAG = tagServiceIndex > -1 ? TAG_SERVICE : TAG_CLIENT;
	
	return row.substr(row.indexOf(TAG)+TAG.length+1, row.length).trim();
}

function parseHeader(header) {
	let result = '';
	$.each(header.split(/], /g), function (index, value) {
		result += '-H "' + value.replace(/^{|]}/g, '').replace(/=\[/g, ': ').replace(/["]+/g, '') + '" \\\n';
	});
	
	return result;
}

function generateCurlCommand(header, body, url, toTxt, isPost, isToFile, isPrettyXml) {
	let curl = '';
	// curl += "curl -v --connect-timeout 5 --max-time 10 \\\n";
	curl += 'curl \\\n';
	curl += parseHeader(header);
	if (isPost) {
		curl += appendPostParam(url, body);
	} else {
		curl += appendGetParam(url, body);
	}

	if (isPrettyXml) {
		curl += appendPrettyXml(isPrettyXml);
	}
	
	curl += appendToFile(isToFile);
	
	curl += '\n'
	toTxt.val(curl);
	
	// console.log("CURL command has been generated.");
}

function appendGetParam(url, body) {
	let param = '';
	if (body != '') {
		param = '?' + body;
	}
	return '-X GET "' + url + param + '"';
}

function appendPostParam(url, body) {
	let returnVal = '';
	if (body != '') {
		returnVal += '-d "' + body + '" \\\n';
	}
	returnVal += url;
	
	return returnVal;
}

function appendPrettyXml(isPrettyXml) {
	if (isPrettyXml) {
		return ' | xmllint --format -';
	} else {
		return '';
	}
}

function appendToFile(isToFile) {
	if (isToFile) {
		return ' >> response.txt';
	} else {
		return '';
	}
}

function copyToClipboard(toTxt) {
	var $temp = $('<textarea>');
	$('body').append($temp);	
	$temp.val(toTxt.val()).select();
	document.execCommand('copy');
	$temp.remove();
	
	// console.log("CURL command has been copied to clipboard.");
}

function showInfoPopup() {
	if ($('.popuptext').is(':visible') == false) {
		$('.popuptext').fadeIn().delay(1500).fadeOut();
	}
}

$(function () {
	$('#chk-post, #chk-to-file, #chk-pretty-xml').change(function() {
		$('#curl-command-parsing').trigger('click');
	});	
	
	$('#curl-command-parsing').click(function() {
		let fromTxt = $('#from-txt');
		let toTxt = $('#to-txt');
		let isPost = $('#chk-post').is(':checked'), isToFile = $('#chk-to-file').is(':checked'), isPrettyXml = $('#chk-pretty-xml').is(':checked');
		toTxt.val('');
		
		// console.log("isPost: " + isPost);
		
		if (fromTxt.val() == '') {
			return;
		}
		
		let rows = $('#from-txt').val().split('\n');
		let headerBegin = false;
		let url = '';
		let header = '';
		let body = '';
		$.each(rows, function(index, value) {
			if (value.indexOf(TAG_CLIENT) == -1 && value.indexOf(TAG_SERVICE) == -1) {
				return;
			}
			
			if (value.indexOf(LOG_HEADER) > -1) {
				url = getValue(rows[index-1]);
				headerBegin = true;
			} else if (value.indexOf(LOG_BODY) > -1) {
				headerBegin = false;
				body += getValue(rows[index+1]);
				return false;
			} else if (headerBegin) {
				header += getValue(value);
			}
		});
		
		generateCurlCommand(header, body, url, toTxt, isPost, isToFile, isPrettyXml);
		copyToClipboard(toTxt);
		showInfoPopup();
	});
});