var cors = require('cors');
var express = require('express');
var bodyParser = require('body-parser');

var auth = require('./auth');
var Dal = require('./dal');
var config = require('../config');
var currency = require('../resources/currency');
var mainSync = require('../resources/mainSync');
var google = require('../resources/google');
var logger = require('../modules/logger');

exports.getAPI = function(db){
    var app = express();

    app.locals.dal = new Dal(db);

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended:true}));
    app.use(cors({origin:true,credentials:true}));

    // app.use(function(req, res, next) {
    //     res.setHeader('Access-Control-Allow-Origin', config.apiUrl);
    //     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    //     res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    //     res.header('Content-Type', 'application/json');
    //     next();
    // });

    // Authentication
    app.post('/sessionFromGoogle', google.createSession);
    // app.delete('/session', auth.ensureAuthenticated, session.destroyCurrent);
    // app.delete('/session/all', auth.ensureAuthenticated, session.destroyAllSessions);

    // Main Sync
    app.get('/mainSync', auth.ensureAuthenticated, /*auth.isAllowed, */mainSync.get);
    app.post('/mainSync', auth.ensureAuthenticated, /*auth.isAllowed, */mainSync.post);

    // Currency
    app.get('/currency', /*auth.ensureAuthenticated, */currency.get);

    return app;
}
