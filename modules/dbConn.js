var mongoose = require('mongoose');
var config = require('../config');
var logger = require('../modules/logger.js')

exports.connect = function(){
	mongoose.connect(config.dbUri);
	mongoose.connection.on('error', function(err) {
	  logger.error('MONGODB','Could not connect to MongoDB. Did you forget to run `mongod`?');
	});
}
