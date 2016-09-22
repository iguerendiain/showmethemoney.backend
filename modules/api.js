var cors = require('cors');
var express = require('express');
var bodyParser = require('body-parser');

var config = require('../config');
var mainSync = require('../resources/mainSync');
var logger = require('../modules/logger');

exports.getAPI = function(sequelize){
    var app = express();

    app.locals.sequelize = sequelize;

    app.use(bodyParser.json());
    app.use(cors({origin:true,credentials:true}));

    // Main Sync
    app.get('/mainSync', mainSync.get);
    app.post('/mainSync', mainSync.post);

    return app;
}
