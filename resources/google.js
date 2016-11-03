var googleTokenVerificationURL = "https://www.googleapis.com/oauth2/v3/tokeninfo";

var uuid = require('node-uuid');
var request = require('request');
var config = require('../config');

exports.createSessionWithGoogle = function(req,res){
	var dal = req.app.locals.dal;

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
			if (googleTokenInfo.aud == config.federated.google.clientId){
				dal.getOneUserByEmail(googleTokenInfo.email, function(user){
					if (user==null){
						dal.createUserFromGoogleTokenInfoResponse(googleTokenInfo, function(user){
							createSession(dal, res, user, clientId, clientType, function(session){
								res.status(200).send(session);
							});
						});
					}else{
						createSession(dal, res, user, clientId, clientType, function(session){
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

var createSession = function(dal, res, user, clientId, clientType, cb){
	if (dal.isClientTypeValid(clientType)){
		dal.createSessionForUser(user, clientId, clientType, cb);
	}else{
		res.status(400).send("Invalid client type, valid values: ('web' and 'android')");
	}
}