var cors = require('cors');
var express = require('express');
var bodyParser = require('body-parser');

var auth = require('./auth');
var Dal = require('./dal');
var config = require('../config');
var mainSync = require('../resources/mainSync');
var google = require('../resources/google');
var logger = require('../modules/logger');

exports.getAPI = function(db){
    var app = express();

    app.locals.dal = new Dal(db);

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(cors({origin:true,credentials:true}));

    // Authentication
    app.post('/createSessionWithGoogle', google.createSessionWithGoogle);
    // app.delete('/session', auth.ensureAuthenticated, session.destroyCurrent);
    // app.delete('/session/all', auth.ensureAuthenticated, session.destroyAllSessions);

    // Main Sync
    app.get('/mainSync', auth.ensureAuthenticated, /*auth.isAllowed, */mainSync.get);
    app.post('/mainSync', auth.ensureAuthenticated, /*auth.isAllowed, */mainSync.post);

    return app;
}
