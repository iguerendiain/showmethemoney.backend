var async = require('async');
var logger = require('../modules/logger');

exports.get = function(req, res){
	var dal = req.app.locals.dal;
	var userid = req.user.id;

	var callback = function(results){cb(null, results)};

	async.parallel({
		records:function(cb){dal.getAllRecordsOwnedBy(userid, cb);},
		currencies:function(cb){dal.getAllCurrenciesOwnedBy(userid, cb);},
		accounts:function(cb){dal.getAllAccountsOwnedBy(userid, cb);},
		recordsToDelete:function(cb){dal.getDeletedRecordsOwnedBy(userid, cb);},
		currenciesToDelete:function(cb){dal.getDeletedCurrenciesOwnedBy(userid, cb);},
		accountsToDelete:function(cb){dal.getDeletedAccountsOwnedBy(userid, cb);}
	},function(err,results){
		buildAndSendMainSyncData(
			req,
			res,
			results.accounts,
			results.records,
			results.currencies,
			results.accountsToDelete,
			results.recordsToDelete,
			results.currenciesToDelete
		);
	});
}

exports.post = function(req, res){
	var mainSyncData = req.body;
	var dal = req.app.locals.dal;
	var userid = req.user.id;

	async.series([
		function(seriesCB){
			async.parallel([
				function(cb){saveCurrencies(mainSyncData.currencies, cb);},
				function(cb){saveAccounts(mainSyncData.accounts, cb);},
				function(cb){saveRecords(mainSyncData.records, cb);}
			],seriesCB);
		},
		function(seriesCB){
			async.parallel([
				function(cb){markRecordsAsDeleted(mainSyncData.recordsToDelete, cb);},
				function(cb){markAccountsAsDeleted(mainSyncData.accountsToDelete, cb);},
				function(cb){markCurrenciesAsDeleted(mainSyncData.currenciesToDelete, cb);}
			],seriesCB);
		}
	],function(){
		res.status(200).send();
	});
}

var buildAndSendMainSyncData = function(req, res, accounts, records, currencies, accountsToDelete, recordsToDelete, currenciesToDelete){
	res.status(200).send({
			accounts:accounts,
			currencies:currencies,
			records:records,
			accountsToDelete:accountsToDelete,
			currenciesToDelete:currenciesToDelete,
			recordsToDelete:recordsToDelete
	});
}