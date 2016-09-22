var dbConn = require('../modules/dbConn');
var logger = require('../modules/logger');

exports.get = function(req, res){
	// var db = req.app.locals.sequelize;
	var db = dbConn;

	db.Record.findAll().then(function(records){
		db.Currency.findAll().then(function(currencies){
	  	db.Account.findAll().then(function(accounts){
				res.status(200).send({
						accounts:accounts,
						currencies:currencies,
						records:records
				});
			});
		});
	});
}

exports.post = function(req, res){
	var mainSyncData = req.body;
	var db = dbConn;

	db.Currency.bulkCreate(mainSyncData.currencies).then(function(){
		db.Account.bulkCreate(mainSyncData.accounts).then(function(){
			db.Record.bulkCreate(mainSyncData.records).then(function(){
				res.status(200).send();
			});
		});
	});
}
