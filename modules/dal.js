var uuid = require('node-uuid');
var log = require('./logger');

var methods = Dal.prototype;

var self;

function Dal(db){
	this.db = db;
	self = this;
}

methods.getOneUserByEmail = function(email,cb){
	var query = "select * from person where email = $1::text";
	var params = [email];
	self.runQueryForOneRecord(query,params,cb);
}

methods.getUser = function(id,cb){
	self.getById("person",id,cb);
}

methods.getFirstOrNull = function(results){
	if (results!=null && results.length > 0){
		return results[0];
	}else{
		return null;
	}
}

methods.runQueryForOneRecord = function(query, params, cb){
	self.db.query(query+" limit 1", params, function(err, results){
		if (err==null){
			cb(self.getFirstOrNull(results.rows));
		}else{
      		log.error("DB","Error running query: "+err);
			process.exit(1);
		}
	});
}

methods.runQuery = function(query, params, cb){
	self.db.query(query, params, cb);
}

methods.createUserFromGoogleTokenInfoResponse = function(googleTokenInfo, cb){
	var query = "insert into person (email,name,firstname,lastname,avatar,google) values ($1,$2,$3,$4,$5,$6)";
	var userEmail = googleTokenInfo.email;

	var params = [
		userEmail,
		googleTokenInfo.name,
		googleTokenInfo.given_name,
		googleTokenInfo.family_name,
		googleTokenInfo.picture,
		googleTokenInfo.sub
	];

	self.runQuery(query,params,function(){
		self.getOneUserByEmail(userEmail, cb);
	});
}

methods.createSessionForUser = function(user, clientId, clientType, cb){
	self.getClientByIdAndType(clientId, clientType, function(client){
		if (client==null){
			self.createClient(clientId, clientType, user.id, function(client){
				self.createSession(client,user,cb);
			});
		}else{
			self.createSession(client,user,cb);
		}
	});
}

methods.isClientTypeValid = function(clientType){
	switch (clientType){
		case 'android':
		case 'web':
			return true;
		default:
			return false;
	}
}

methods.getClientByIdAndType = function(clientId, clientType, cb){
	var query = "select * from client where clientid = $1 and type = $2";
	var params = [clientId, clientType];

	self.runQueryForOneRecord(query, params, cb);
}

methods.getClient = function(id,cb){
	methods.getById("client",id,cb);
}

methods.getById = function(table, id, cb){
	var query = "select * from $1 where id = $2::int";
	var params = [table,id];
	self.runQueryForOneRecord(query,params,cb);
}

methods.createClient = function(clientid, clienttype, userid, cb){
	var query = "insert into client (clientid, type, owner) values ($1, $2, $3::int)";
	var params = [clientid, clienttype, userid];

	self.runQuery(query, params, function(){
		self.getClientByIdAndType(clientid,clienttype,cb);
	});
}

methods.createSession = function(client,user,cb){
	var sessionToken = uuid.v4();
	var query = "insert into session (token, client, owner) values ($1, $2::int, $3::int)";
	var params = [sessionToken, client.id, user.id];

	self.runQuery(query, params, function(){
		self.getSessionByToken(sessionToken, cb);
	});
}

methods.getSessionByToken = function(token,cb){
	var query = "select * from session where token = $1";
	var params = [token];

	self.runQueryForOneRecord(query, params, cb);
}


methods.getAllRecordsOwnedBy = function(userid, cb){
}

methods.getAllCurrenciesOwnedBy = function(userid, cb){
}

methods.getAllAccountsOwnedBy = function(userid, cb){
}

methods.getDeletedRecordsOwnedBy = function(userid, cb){
}

methods.getDeletedCurrenciesOwnedBy = function(userid, cb){
}

methods.getDeletedAccountsOwnedBy = function(userid, cb){
}

methods.saveNewCurrencies = function(currencies, userid, cb){
}

methods.saveNewAccounts = function(accounts, userid, cb){
}

methods.saveNewRecords = function(records, userid, cb){
}

methods.markRecordsAsDeleted = function(records, userid, cb){
}

methods.markAccountsAsDeleted = function(accounts, userid, cb){
}

methods.markCurrenciesAsDeleted = function(currencies, userid, cb){
}

module.exports = Dal;
