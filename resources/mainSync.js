var async = require('async');
var logger = require('../modules/logger');

exports.get = function(req, res){
	var dal = req.app.locals.dal;
	var userid = req.user.id;

	var callback = function(results){cb(null, results)};

	async.parallel({
		records:function(cb){dal.getAllRecordsOwnedBy(userid, function(result){cb(null,result);});},
		accounts:function(cb){dal.getAllAccountsOwnedBy(userid, function(result){cb(null,result);});},
		recordsToDelete:function(cb){dal.getDeletedRecordsOwnedBy(userid, function(result){cb(null,result);});},
		accountsToDelete:function(cb){dal.getDeletedAccountsOwnedBy(userid, function(result){cb(null,result);});}
	},function(err,results){
		buildAndSendMainSyncData(
			req,
			res,
			results.accounts,
			results.records,
			results.accountsToDelete,
			results.recordsToDelete
		);
	});
}

exports.post = function(req, res){
	var mainSyncData = req.body;
	var dal = req.app.locals.dal;
	var userid = req.user.id;

	async.parallel({
		records:function(cb){dal.isOwnerOfRecords(mainSyncData.records, userid, function(result){cb(null, result);});},
		accounts:function(cb){dal.isOwnerOfAccounts(mainSyncData.accounts, userid, function(result){cb(null, result);});},
		recordsToDelete:function(cb){dal.isOwnerOfRecords(mainSyncData.recordsToDelete, userid, function(result){cb(null, result);});},
		accountsToDelete:function(cb){dal.isOwnerOfAccounts(mainSyncData.accountsToDelete, userid, function(result){cb(null, result);});}
	}, function(err, result){
		if (	result.records==true && result.accounts==true &&
				result.recordsToDelete==true && result.accountsToDelete==true){
			
			for (var a in mainSyncData.accounts){
				mainSyncData.accounts[a].owner = userid;
			}

			for (var r in mainSyncData.records){
				mainSyncData.records[r].owner = userid;
			}

			async.series([
				function(cb){dal.saveAccounts(mainSyncData.accounts,cb);},
				function(cb){dal.saveRecords(mainSyncData.records,cb);},
				function(cb){dal.markRecordsAsDeleted(mainSyncData.recordsToDelete,cb);},
				function(cb){dal.markAccountsAsDeleted(mainSyncData.accountsToDelete,cb);}
			],function(){
				res.status(200).send();
			});
		}else{
			res.status(403).send();
		}
	});
}

var buildAndSendMainSyncData = function(req, res, accounts, records, accountsToDelete, recordsToDelete){
	res.status(200).send({
			accounts:accounts,
			records:records,
			accountsToDelete:accountsToDelete,
			recordsToDelete:recordsToDelete
	});
}
