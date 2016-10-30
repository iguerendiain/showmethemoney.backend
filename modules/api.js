var cors = require('cors');
var express = require('express');
var bodyParser = require('body-parser');

var config = require('../config');
var mainSync = require('../resources/mainSync');
var google = require('../resources/google');
var logger = require('../modules/logger');

exports.getAPI = function(sequelize){
    var app = express();

    app.locals.sequelize = sequelize;

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(cors({origin:true,credentials:true}));

    // Authentication
    app.post('/createSessionWithGoogle', google.createSessionWithGoogle);

    // Main Sync
    app.get('/mainSync', mainSync.get);
    app.post('/mainSync', mainSync.post);

    return app;
}
