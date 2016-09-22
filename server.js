var http = require("http");
var config = require('./config');
var logger = require('./modules/logger');
var apiFactory = require('./modules/api');
var dbConn = require('./modules/dbConn');

dbConn.init(function(){
  var api = apiFactory.getAPI(dbConn);
  var server = http.createServer(api);

  server.listen(config.apiPort);

  logger.info('SERVER','SMTM API listening on port '+config.apiPort);
});
