/************************************/
/*									*/
/*				PLATFORM			*/
/*									*/
/************************************/

var async = require('async');
var S = require('string');
var uuid = require('node-uuid');
var log = require('./logger');

var TAG = "DAL";

var methods = Dal.prototype;

var self;

function Dal(db){
	this.db = db;
	self = this;
}

/************************************/
/*									*/
/*				HELPERS				*/
/*									*/
/************************************/

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

	log.info(TAG, "runQueryForOneRecord: "+query+" -- ["+params+"]");
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
	var queryLog = query+" -- ["+params+"]";
	log.info(TAG, "runQuery: "+queryLog);
	self.db.query(query, params, function(err, results){
		if (err==null){
			cb(results.rows);
		}else{
      		log.error("DB","Error running query: "+queryLog+" -- Error thrown: "+err);
			process.exit(1);
		}
	});
}

methods.getById = function(table, id, cb){
	var query = "select * from "+table+" where id = $1::int";
	var params = [id];
	self.runQueryForOneRecord(query,params,cb);
}

/************************************/
/*									*/
/*				AUTH				*/
/*									*/
/************************************/
methods.getOneUserByEmail = function(email,cb){
	var query = "select * from person where email = $1::text";
	var params = [email];
	self.runQueryForOneRecord(query,params,cb);
}

methods.getUser = function(id,cb){
	self.getById("person",id,cb);
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

/************************************************/
/*												*/
/*				HIGH LEVEL HELPERS				*/
/*												*/
/************************************************/
methods.getData = function(table, deleted, userid, orderBy, cb){
	var query = "select * from "+table+" where owner = $1 and deleted = $2 order by $3";
	var params = [userid, deleted, orderBy];

	self.runQuery(query, params, cb);
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

		log.info(TAG, "upsertData: "+insertQuery);
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

methods.markObjectsAsDeleted = function(table, data, cb){
	/*

		For some weird reason I do not understand yet
		the query using the parameters do not work
		while the query built directly with the
		parameters inside does work.

		I'll leave commented the "right" way of doing
		this query for a future time when I can fix
		this.

	*/

	var uuids = [];
	for (var d in data){
		if (!S(data[d].uuid).isEmpty()){
			// uuids.push(data[d].uuid);
			uuids.push("'"+data[d].uuid+"'");
		}
	}

	if (uuids.length > 0){
		// var query = "update "+table+" set deleted = true, updated = extract(epoch from CURRENT_TIMESTAMP) where uuid in ($1)";
		// var params = [uuids];

		var uglyUUIDs = uuids.join();
		var query = "update "+table+" set deleted = true, updated = extract(epoch from CURRENT_TIMESTAMP) where uuid in ("+uglyUUIDs+")";
		self.runQuery(query, []/*params*/, cb);
	}else{
		cb();
	}
}

methods.isOwner = function(table, data, owner, cb){
	if (table==null || owner<=0){
		cb(false);
	}else if (data==null || data.length <= 0){
		cb(true);
	}else{
		var query = "select count(1) as c from "+table+" where uuid in ($1) and owner != $2";
		var uuids = [];

		for (var d in data){
			uuids.push(data[d].uuid);
		}

		var params = [uuids, owner];

		self.runQueryForOneRecord(query, params, function(result){
			if (result.c>0){
				cb(false);
			}else{
				cb(true);
			}
		});
	}
}

/************************************/
/*									*/
/*				RECORDS				*/
/*									*/
/************************************/
methods.getAllRecordsOwnedBy = function(userid, cb){
	var query = 
		"select r.*,case when count(t.tag)=0 then null else array_agg(t.tag) end as tags "+
		"from record r "+
		"left join tag_record x on x.recorduuid = r.uuid "+
		"left join tag t on t.id = x.tagid "+
		"where owner = $1 "+
		"and deleted = $2 "+
		"group by r.uuid "+
		"order by $3";

	var params = [userid, false, "time desc"];
	self.runQuery(query, params, cb);
}

methods.getDeletedRecordsOwnedBy = function(userid, cb){
	self.getData("record", true, userid, "time desc", cb);
}

methods.saveRecords = function(records, cb){
	var fields = ["description","account","currency","type","time","amount","loclat","loclng"];
	
	async.parallel({
		records:function(cb){self.upsertData("record", fields, fields, records, cb);},
		tags:function(cb){
			var rawTags = [];

			for (var r in records){
				rawTags = rawTags.concat(records[r].tags);
			}

			var tags = rawTags.filter(function(elem, pos) {
    			return rawTags.indexOf(elem) == pos;
			});

			var rowsToInsert = [];
			for (var t in tags){
				var tag = tags[t];
				rowsToInsert.push("('"+S(tag).slugify()+"')");
			}

			var insertQuery = 
				"insert into tag (tag) values "+rowsToInsert.join(",") +
				" on conflict (tag) do update set tag=excluded.tag returning *";

			log.info(TAG, "upsertTags: "+insertQuery);
			self.runQuery(insertQuery,null,function(tags){
				var rowsToInsert = [];
				var recordUUIDs = [];
				for (var r in records){
					recordUUIDs.push("'"+records[r].uuid+"'");
					for (var t in tags){
						var tagId = tags[t].id;
						var recordUUID = records[r].uuid;

						rowsToInsert.push("("+tagId+",'"+recordUUID+"')");
					}
				}

				var clearTagsQuery = "delete from tag_record where recorduuid in ("+recordUUIDs.join(",")+")";
				self.runQuery(clearTagsQuery, null, function(){
					var insertQuery = "insert into tag_record values "+rowsToInsert.join(",")+" on conflict (tagid,recorduuid) do nothing";
					self.runQuery(insertQuery, null, cb);
				});
			});
		}
	},function(err, results){
		cb(results);
	});
}

methods.markRecordsAsDeleted = function(records, cb){
	self.markObjectsAsDeleted("record", records, cb);
}

methods.isOwnerOfRecords = function(records, owner, cb){
	self.isOwner("record", records, owner, cb);
}

/************************************/
/*									*/
/*				ACCOUNTS			*/
/*									*/
/************************************/
methods.getAllAccountsOwnedBy = function(userid, cb){
	self.getData("account", false, userid, "name asc", cb);
}

methods.getDeletedAccountsOwnedBy = function(userid, cb){
	self.getData("account", true, userid, "name asc", cb);
}

methods.saveAccounts = function(accounts, cb){
	var fields = ["name","currency","balance"];
	self.upsertData("account", fields, fields, accounts, cb);
}

methods.markAccountsAsDeleted = function(accounts, cb){
	self.markObjectsAsDeleted("account", accounts, cb);
}

methods.isOwnerOfAccounts = function(accounts, owner, cb){
	self.isOwner("account", accounts, owner, cb);
}

/************************************/
/*									*/
/*				CURRENCIES			*/
/*									*/
/************************************/
methods.areCurrenciesLoaded = function(cb){
	var query = "select count(1) c from currency";
	self.runQueryForOneRecord(query, null, function(results){
		if (results!=null && results.c > 0){
			cb(true);
		}else{
			cb(false);
		}
	});
}

methods.upsertCurrencyRates = function(rates, cb){
	if (rates!=null && Object.keys(rates).length > 0){
		var rowsToInsert = [];
		for (var r in rates){
			var code = r;
			var factor = rates[r];
			var id = uuid.v4();
			rowsToInsert.push("('"+id+"',"+factor+",'"+code+"')");
		}

		var insertQuery=
			"insert into currency (uuid,factor,code) values "+rowsToInsert.join(",") +
			" on conflict (code) do update set factor=excluded.factor returning *";

		log.info(TAG, "upsertCurrency: "+insertQuery);
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

methods.updateCurrencyNames = function(names, cb){
	if (names!=null && Object.keys(names).length > 0){

		var virtualTable = [];
		for (var r in names){
			var code = r;
			var name = names[r];
			virtualTable.push("('"+code+"','"+name+"')");
		}

		var updateQuery = "update currency as real set name = virtual.name "+
		"from (values "+virtualTable.join(",")+") as virtual(code,name) where virtual.code = real.code";

		log.info(TAG, "updateCurrencyNames: "+updateQuery);
		self.db.query(updateQuery,function(err,res){
			if (err){
				throw err;
			}else{
				cb();
			}
		});
	}else{
		cb([]);
	}
}

methods.getAllCurrencies = function(cb){
	self.runQuery("select * from currency order by name,code asc",null,cb);
}

module.exports = Dal;
