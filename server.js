var http = require("http");
var config = require('./config');
var logger = require('./modules/logger');
var apiFactory = require('./modules/api');
var dbConn = require('./modules/dbConn');

dbConn.init(function(db){
	if (db!=null){
	  	var api = apiFactory.getAPI(db);
	  	var server = http.createServer(api);

	  	server.listen(config.apiPort);

	  	logger.info('SERVER','SMTM API listening on port '+config.apiPort);
  	}else{
  		logger.error('SERVER','Unable to connect to database');
  	}
});