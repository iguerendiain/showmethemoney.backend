var http = require("http");
var config = require('./config');
var logger = require('./modules/logger');
var apiFactory = require('./modules/api');
var dbConn = require('./modules/dbConn');
var currencyUpdater = require('./modules/currencyUpdater');

dbConn.init(function(db){
	if (db!=null){
	  	var api = apiFactory.getAPI(db);
	  	var server = http.createServer(api);

  		currencyUpdater.ensureAvailability(api,function(){
	  		server.listen(config.apiPort);
	  		logger.info('SERVER','SMTM API listening on port '+config.apiPort);
	  		currencyUpdater.cronUpdateStart(api);
	  	});

  	}else{
  		logger.error('SERVER','Unable to connect to database');
  	}
});