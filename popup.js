// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

let commandParsing = document.getElementById('curl-command-parsing');
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

commandParsing.onclick = function(element) {
	let fromTxt = $("#from-txt");
	let toTxt = $("#to-txt");
	toTxt.val("");
	
	let rows = $("#from-txt").val().split("\n")
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
	
	let curl = "";
	curl += "curl -v --connect-timeout 5 --max-time 10 \\\n";
	curl += parseHeader(header);
	curl += "'" + url + "'";
	if (body != null && body != "") {
		curl += " \\\n"
		curl += "-d '" + body + "'";
	}
	
	toTxt.val(curl);
};
