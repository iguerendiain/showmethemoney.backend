var async = require('async');
var logger = require('../modules/logger');

exports.get = function(req, res){
	var dal = req.app.locals.dal;
	var userid = req.user.id;

	var callback = function(results){cb(null, results)};

	async.parallel({
		records:function(cb){dal.getAllRecordsOwnedBy(userid, function(result){cb(null,result);});},
		currencies:function(cb){dal.getAllCurrenciesOwnedBy(userid, function(result){cb(null,result);});},
		accounts:function(cb){dal.getAllAccountsOwnedBy(userid, function(result){cb(null,result);});},
		recordsToDelete:function(cb){dal.getDeletedRecordsOwnedBy(userid, function(result){cb(null,result);});},
		currenciesToDelete:function(cb){dal.getDeletedCurrenciesOwnedBy(userid, function(result){cb(null,result);});},
		accountsToDelete:function(cb){dal.getDeletedAccountsOwnedBy(userid, function(result){cb(null,result);});}
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

	async.parallel({
		currencies:function(cb){dal.isOwnerOfCurrencies(mainSyncData.currencies, userid, function(result){cb(null, result);});},
		records:function(cb){dal.isOwnerOfRecords(mainSyncData.records, userid, function(result){cb(null, result);});},
		accounts:function(cb){dal.isOwnerOfAccounts(mainSyncData.accounts, userid, function(result){cb(null, result);});},
		currenciesToDelete:function(cb){dal.isOwnerOfCurrencies(mainSyncData.currenciesToDelete, userid, function(result){cb(null, result);});},
		recordsToDelete:function(cb){dal.isOwnerOfRecords(mainSyncData.recordsToDelete, userid, function(result){cb(null, result);});},
		accountsToDelete:function(cb){dal.isOwnerOfAccounts(mainSyncData.accountsToDelete, userid, function(result){cb(null, result);});}
	}, function(err, result){
		if (	result.currencies==true && result.records==true && result.accounts==true &&
				result.currenciesToDelete==true && result.recordsToDelete==true && result.accountsToDelete==true){
			
			for (var c in mainSyncData.currencies){
				mainSyncData.currencies[c].owner = userid;
			}

			for (var a in mainSyncData.accounts){
				mainSyncData.accounts[a].owner = userid;
			}

			for (var r in mainSyncData.records){
				mainSyncData.records[r].owner = userid;
			}

			async.series([
				function(cb){dal.saveCurrencies(mainSyncData.currencies,function(result){cb(null, result);});},
				function(cb){dal.saveAccounts(mainSyncData.accounts,function(result){cb(null, result);});},
				function(cb){dal.saveRecords(mainSyncData.records,function(result){cb(null, result);});},
				function(cb){dal.markRecordsAsDeleted(mainSyncData.recordsToDelete,function(){cb(null);});},
				function(cb){dal.markAccountsAsDeleted(mainSyncData.accountsToDelete,function(){cb(null);});},
				function(cb){dal.markCurrenciesAsDeleted(mainSyncData.currenciesToDelete,function(){cb(null);});}
			],function(){
				res.status(200).send();
			});
		}else{
			res.status(403).send();
		}
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
