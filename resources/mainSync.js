var mongoose = require('mongoose');
var models = require('../modules/models');
var logger = require('../modules/logger');
var ObjectId = require('mongodb').ObjectID;

exports.get = function(req, res){
	models.Record.find({},function(err,records){
		models.Currency.find({}, function(err,currencies){
			models.Account.find({}, function(err,accounts){
				res.status(200).send({
					  accounts:[
					    {
					      "_id":"lkmcasdoc8jsadc80sdanc08osadnc",
					      "name":"Bolsillo",
					      "slug":"bolsillo",
					      "currency":{"slug":"peso"},
					      "balance":6511.8
					    },
					    {
					      "_id":"sdkoafnmosiadcns0adc89nsda0c9nsdac",
					      "name":"Cajón",
					      "slug":"cajon",
					      "currency":{"slug":"dollar"},
					      "balance":3400
					    }
					  ],
						currencies:[
					    {
					      "_id":"sad9cms0ad9cmsadcklmsp0adc9m234d",
					      "name":"Peso argentino",
					      "slug":"peso",
					      "factor":15
					    },
					    {
					      "_id":"edm-932md02m92d09d4m23-49md3-49m3409",
					      "name":"Dólar estadounidense",
					      "slug":"dollar",
					      "factor":1
					    }
					  ],
						records:records
				});
			});
		});
	});
}

exports.post = function(req, res){
	res.status(200).send();
}
