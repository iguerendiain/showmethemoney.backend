exports.ensureAuthenticated = function(req, res, next){
	if (clientThinksIsAuthenticated(req)){
		var token = req.headers.authorization;
    var dal = req.app.locals.dal;

		dal.getSessionByToken(token,function(session){
			if (session==null){
        		return res.status(401).send('Session with requested token was not found, please login again');
  			}else{
        		dal.getClient(session.id,function(client){
            		dal.getUser(session.owner,function(user){
            			req.user = user;
            			next();
                });
            });
    		}
		});
	}else{
    	return res.status(401).send('Make sure your request has an Authorization header, try loging in');
  	}
}

var clientThinksIsAuthenticated = function(req){
	return req.headers.authorization != null;
}

