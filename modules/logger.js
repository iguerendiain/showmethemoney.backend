var moment = require('moment');
var colors = require('colors');

exports.log = function (type,tag,msg){

	var date = moment().format('YYYY.MM.DD HH:mm:ss.SS') + ': ';
	var type = '['+type+'] ';
	var tag = tag+': ';

	var logString = date.cyan + type + tag + msg;

	console.log(logString.bold);
}

exports.info = function(tag,msg){
	exports.log('INFO'.blue,tag.yellow,msg.green);
}

exports.error = function(tag,msg){
	exports.log('ERROR'.red,tag.yellow,msg.red);
}