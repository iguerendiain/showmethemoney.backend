var googleTokenVerificationURL = "https://www.googleapis.com/oauth2/v3/tokeninfo";

var uuid = require('node-uuid');
var request = require('request');
var config = require('../config');
var dbConn = require('../modules/dbConn');

exports.createSessionWithGoogle = function(req,res){
	var token = req.body.googleToken;
	var clientId = req.body.clientId;
	var clientType = req.body.clientType;

	request.post(
		googleTokenVerificationURL,
		{
			json: true,
			qs: {id_token:token}
		}
	,function(error, response, googleTokenInfo){
		if (error){
			res.status(403).send("Google told me: "+response);
		}else{
			if (tokenIsValid(googleTokenInfo)){
				getExistingUser(googleTokenInfo.email, function(user){
					if (user==null){
						createUserFromGoogleTokenInfoResponse(googleTokenInfo, function(user){
							createSessionForUser(user, clientId, clientType, function(session){
								res.status(200).send(session);
							});
						});
					}else{
						createSessionForUser(user, clientId, clientType, function(session){
							res.status(200).send(session);
						});
					}
				});
			}else{
				res.status(403).send("Invalid Google token");
			}			
		}
	});
}

var tokenIsValid = function(googleTokenInfo){
	var clientId = googleTokenInfo.aud;
	return clientId == config.federated.google.clientId;
}

var getExistingUser = function(email, cb){
	dbConn.User.findOne({where:{email:email}}).then(cb);
}

var createUserFromGoogleTokenInfoResponse = function(googleTokenInfo, cb){
	var tokenData = googleTokenInfo;
	dbConn.User.create({
    	email:tokenData.email,
    	name:tokenData.name,
	    firstName:tokenData.given_name,
	    lastName:tokenData.family_name,
	    avatar:tokenData.picture,
	    googleId:tokenData.sub
	}).then(cb);
}

var createSessionForUser = function(user, clientId, clientType, cb){
	dbConn.Client.findOrCreate(
		{
			where:{
				clientId:clientId,
				type:clientType
			},
			defaults:{
				clientId:clientId,
				type:clientType
			}
		}
	)
	.then(function(client){
		dbConn.Session.create({
		    sessionId:uuid.v4(),
		    client:client[0].clientId,
		    user:user.email,
		    lastAccess:Math.floor(Date.now() / 1000)
		}).then(cb);
	});
	
}