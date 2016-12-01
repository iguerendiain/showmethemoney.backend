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
	var query = "select * from "+table+" where id = $1::int";
	var params = [id];
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

methods.getData = function(table, deleted, userid, orderBy, cb){
	var query = "select * from "+table+" where owner = $1 and deleted = $2 order by $3";
	var params = [userid, deleted, orderBy];

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

methods.upsertData = function(table, fields, properties, data, cb){
	if (table!=null && data!=null && data.length > 0){
		var insertQuery = "insert into "+table+" ("+fields.join(",")+",owner,uuid,deleted,updated) values ";

		var rowsToInsert = [];
		for (var x in data){
			var d = data[x];

			var fieldsToInsert = [];
			for (var property in properties){
				fieldsToInsert.push("'"+d[properties[property]]+"'");
			}

			fieldsToInsert.push(d.owner);									// owner
			fieldsToInsert.push("'"+d.uuid+"'");							// id
			fieldsToInsert.push(false);										// deleted
			fieldsToInsert.push('extract(epoch from CURRENT_TIMESTAMP)');	// updated

			rowsToInsert.push("("+fieldsToInsert.join(",")+")");
		}

		var fieldsToUpdate = [];
		var allFields = fields.slice();
		allFields.push('owner');
		allFields.push('deleted');
		allFields.push('updated');
		
		for (var field in fields){
			fieldsToUpdate.push(fields[field]+"=excluded."+fields[field]);
		}

		insertQuery+=rowsToInsert.join(",") + " on conflict (uuid) do update set "+fieldsToUpdate.join(",")+" returning *";

		self.db.query(insertQuery,function(err,res){
			if (err){
				throw err;
			}else{
				cb(res.rows);
			}
		});
	}else{
		cb([]);
	}
}

methods.saveCurrencies = function(currencies, cb){
	var fields = ["factor","name"];
	self.upsertData("currency", fields, fields, currencies, cb);
}

methods.saveAccounts = function(currencies, cb){
	var fields = ["name","currency"];
	self.upsertData("account", fields, fields, currencies, cb);
}

methods.saveRecords = function(currencies, cb){
	var fields = ["description","account","currency","type","time"];
	self.upsertData("record", fields, fields, currencies, cb);
}

methods.markRecordsAsDeleted = function(records, cb){
	self.markObjectsAsDeleted("record", records);
}

methods.markAccountsAsDeleted = function(accounts, cb){
	self.markObjectsAsDeleted("account", records);
}

methods.markCurrenciesAsDeleted = function(currencies, cb){
	self.markObjectsAsDeleted("currency", records);
}

methods.markObjectsAsDeleted = function(table, data, cb){
	var ids = [];
	for (var d in data){
		if (data[d].id>0){
			ids.push(data[d].id);
		}
	}

	if (ids.length > 0){
		var query = "update "+table+" set deleted = true, updated = now() where id in $1";
		var params = [ids];
		self.runQuery(query, params, cb);
	}else{
		cb();
	}
}

module.exports = Dal;