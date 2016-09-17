var http = require("http");
var config = require('./config');
var logger = require('./modules/logger');
var dbConn = require('./modules/dbConn');
var apiFactory = require('./modules/api');

dbConn.connect();
var api = apiFactory.getAPI();
var server = http.createServer(api);

server.listen(config.apiPort);

logger.info('SERVER','SMTM API listening on port '+config.apiPort);
