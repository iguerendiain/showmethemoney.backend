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
	var limit;
	if (query.trim().toLowerCase().startsWith("select")){
		limit = " limit 1";
	}else{
		limit = "";
	}

	self.db.query(query+limit, params, function(err, results){
		if (err==null){
			cb(self.getFirstOrNull(results.rows));
		}else{
      		log.error("DB","Error running query: "+err);
			process.exit(1);
		}
	});
}

methods.runQuery = function(query, params, cb){
	self.db.query(query, params, function(err, results){
		if (err==null){
			cb(results.rows);
		}else{
      		log.error("DB","Error running query: "+err);
			process.exit(1);
		}
	});
}

methods.createUserFromGoogleTokenInfoResponse = function(googleTokenInfo, cb){
	var query = "insert into person (email,name,firstname,lastname,avatar,google) values ($1,$2,$3,$4,$5,$6) returning *";

	var params = [
		googleTokenInfo.email,
		googleTokenInfo.name,
		googleTokenInfo.given_name,
		googleTokenInfo.family_name,
		googleTokenInfo.picture,
		googleTokenInfo.sub
	];

	self.runQueryForOneRecord(query, params, cb);
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
	var query = "insert into client (clientid, type, owner) values ($1, $2, $3::int) returning *";
	var params = [clientid, clienttype, userid];

	self.runQueryForOneRecord(query, params, cb);
}

methods.createSession = function(client,user,cb){
	var sessionToken = uuid.v4();
	var query = "insert into session (token, client, owner) values ($1, $2::int, $3::int) returning *";
	var params = [sessionToken, client.id, user.id];

	self.runQueryForOneRecord(query, params, cb);
}

methods.getSessionByToken = function(token,cb){
	var query = "select * from session where token = $1";
	var params = [token];

	self.runQueryForOneRecord(query, params, cb);
}

methods.getData = function(table, deleted, orderBy, userid, cb){
	var query = "select * from $1 where owner = $2 and deleted = $3 orderBy $4";
	var params = [table, userid, deleted, orderBy];

	self.runQuery(query, params, cb);
}


methods.getAllRecordsOwnedBy = function(userid, cb){
	self.getData("record", false, userid, "time desc", cb);
}

methods.getAllCurrenciesOwnedBy = function(userid, cb){
	self.getData("currency", false, userid, "name asc", cb);
}

methods.getAllAccountsOwnedBy = function(userid, cb){
	self.getData("account", false, userid, "name asc", cb);
}

methods.getDeletedRecordsOwnedBy = function(userid, cb){
	self.getData("record", true, userid, "time desc", cb);
}

methods.getDeletedCurrenciesOwnedBy = function(userid, cb){
	self.getData("currency", true, userid, "name asc", cb);
}

methods.getDeletedAccountsOwnedBy = function(userid, cb){
	self.getData("account", true, userid, "name asc", cb);
}

methods.saveData = function(table, fields, properties, data, cb){
	fields.push("owner");
	properties.push("owner");

	var tempTableQuery = "create temp table ram_"+table+" (like "+table+") on commit drop";
	var insertQuery = "insert into ram_"+table+" ("+fields.join(",")+",id,deleted,updated) values ";

	var rowsToInsert = [];
	for (var d in data){
		var fieldsToInsert = [];
		for (var property in properties){
			fieldsToInsert.push(d[property]);
		}
		fieldsToInsert.push(-1);			// id
		fieldsToInsert.push(false);			// deleted
		fieldsToInsert.push(-1);			// updated

		rowsToInsert.push("("+fieldsToInsert.join(",")+")");
	}

	insertQuery+=rowsToInsert.join(",");

	var upsertQuery = 	"with upsert as (update "+table+" real set "+fieldsToUpdate.join(",")+" from ram_"+table+" ram where real.id = ram.id returning ram.id) "+
						"insert into "+table+" ("+fields.join(",")+") select "+fields.join(",")+" from ram_"+table+" left join upsert using(id) where upsert.id is null group by "+table+".id returning *";

	db.query('begin',function(){
		db.query(tempTableQuery, function(){
			self.runQuery(upsertQuery,null,cb);
		});
	});

}

methods.saveCurrencies = function(currencies, cb){
	self.saveData("currency",["name","factor"],["name","factor"],currencies,cb);
}

methods.saveAccounts = function(accounts, cb){
	self.saveData("account",["name","currency"],["name","currency"],currencies,cb);
}

methods.saveRecords = function(records, cb){
	var fields = ["description","account","currency","type","time"];
	self.saveData("record",fields,fields,currencies,cb);
}

methods.markRecordsAsDeleted = function(records, cb){
	cb();
}

methods.markAccountsAsDeleted = function(accounts, cb){
	cb();
}

methods.markCurrenciesAsDeleted = function(currencies, cb){
	cb();
}

module.exports = Dal;
