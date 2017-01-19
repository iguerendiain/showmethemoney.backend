var logger = require('../modules/logger');

exports.get = function(req, res){
	var dal = req.app.locals.dal;

	dal.getAllCurrencies(function(currencies){
		res.status(200).send(currencies);
	});
}
