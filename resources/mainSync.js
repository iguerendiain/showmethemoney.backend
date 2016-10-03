var async = require('async');
var dbConn = require('../modules/dbConn');
var logger = require('../modules/logger');

exports.get = function(req, res){
	var db = dbConn;

	var callback = function(results){cb(null, results)};

	async.parallel({
		records:function(cb){getAllRecords(db,cb);},
		currencies:function(cb){getAllCurrencies(db,cb);},
		accounts:function(cb){getAllAccounts(db,cb);},
		recordsToDelete:function(cb){getDeletedRecords(db,cb);},
		currenciesToDelete:function(cb){getDeletedCurrencies(db,cb);},
		accountsToDelete:function(cb){getDeletedAccounts(db,cb);}
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
	var db = dbConn;

	async.series([
		function(seriesCB){
			async.parallel([
				function(cb){saveNewCurrencies(db, mainSyncData.currencies, cb);},
				function(cb){saveNewAccounts(db, mainSyncData.accounts, cb);},
				function(cb){saveNewRecords(db, mainSyncData.records, cb);}
			],seriesCB);
		},
		function(seriesCB){
			async.parallel([
				function(cb){markRecordsAsDeleted(db, mainSyncData.recordsToDelete, cb);},
				function(cb){markAccountsAsDeleted(db, mainSyncData.accountsToDelete, cb);},
				function(cb){markCurrenciesAsDeleted(db, mainSyncData.currenciesToDelete, cb);}
			],seriesCB);
		}
	],function(){
		res.status(200).send();
	});
}


var getAllRecords = function(db, cb){
	getAll(db.Record,cb);
}

var getAllCurrencies = function(db, cb){
	getAll(db.Currency,cb);
}

var getAllAccounts = function(db, cb){
	getAll(db.Account,cb);
}

var getDeletedRecords = function(db, cb){
	getAllDeleted(db.Record,cb);
}

var getDeletedCurrencies = function(db, cb){
	getAllDeleted(db.Currency,cb);
}

var getDeletedAccounts = function(db, cb){
	getAllDeleted(db.Account,cb);
}

var saveNewRecords = function(db, records, cb){
	saveNew(db.Record, records, cb);
}

var saveNewCurrencies = function(db, currencies, cb){
	saveNew(db.Currency, currencies, cb);
}

var saveNewAccounts = function(db, accounts, cb){
	saveNew(db.Account, accounts, cb);
}

var markRecordsAsDeleted = function(db, records, cb){
	markAsDeleted(db.Record, records, cb);
}

var markCurrenciesAsDeleted = function(db, currencies, cb){
	markAsDeleted(db.Currency, currencies, cb);
}

var markAccountsAsDeleted = function(db, accounts, cb){
	markAsDeleted(db.Account, accounts, cb);
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

var getAll = function(model, cb){
	model.findAll({where:{deleted:false}}).then(function(results){cb(null,results);});
}

var getAllDeleted = function(model, cb){
	model.findAll({where:{deleted:true}}).then(function(results){cb(null,results);});
}

var saveNew = function(model, data, cb){
	model.bulkCreate(data).then(function(result){cb(null,result);});
}

var markAsDeleted = function(model, data, cb){
	var toDelete = [];

	for (var x in data){
		toDelete.push(data[x].id);
	}

	model.update({deleted:true},{where:{id:{$in:toDelete}}}).then(function(results){cb(null,results);});
}
