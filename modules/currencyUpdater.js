var LOG_TAG = "RATEUPDATER";
var openExchangeRatesBaseURL = "https://openexchangerates.org/api/";
var oerNamesURL = openExchangeRatesBaseURL + "currencies.json";
var oerRatesURL = openExchangeRatesBaseURL + "latest.json";

var cron = require('node-cron');
var request = require('request');
var log = require('./logger');
var config = require('../config');
var oerRatesMockup = require('../OERatesMockup');
var oerNamesMockup = require('../OERNamesMockup')

exports.ensureAvailability = function(app, cb){
	exports.getAll(app, function(currencies){
		if (currencies!=null && currencies.length > 0){
			cb();
		}else{
      		log.info(LOG_TAG,"No currencies found, downloading from OER");
			exports.downloadRates(app, function(){
				exports.downloadNames(app,cb);
			});
		}
	});
}

exports.downloadRates = function(app, cb){
	var dal = app.locals.dal;

	if (!config.openExchangeRate.useMockup){
		request.get(
			oerRatesURL,
			{
				json: true,
				qs: {app_id:config.openExchangeRate.appID}
			},
			function(error, response, rates){
				if (error){
		      		log.error(LOG_TAG,"Error getting rates from OER: "+error);
					process.exit(1);
				}else{
		      		log.info(LOG_TAG,"Updating "+Object.keys(rates.rates).length+" rates from OER API");
					exports.upsertRatesFromOER(dal, oerRatesMockup, cb);
				}
			}
		);
	}else{
  		log.info(LOG_TAG,"Updating rates from OER mockup");			
		exports.upsertRatesFromOER(dal, oerRatesMockup, cb);
	}	
}

exports.downloadNames = function(app, cb){
	var dal = app.locals.dal;

	if (!config.openExchangeRate.useMockup){
		request.get(oerNamesURL,{json: true},function(error, response, rates){
			if (error){
	      		log.error(LOG_TAG,"Error getting currency names on empry rate DB: "+error);
				process.exit(1);
			}else{
	      		log.info(LOG_TAG,"Updating "+Object.keys(rates).length+" names from OER API");
				exports.updateNamesFromOER(dal, rates, cb);
			}
		});
	}else{
  		log.info(LOG_TAG,"Updating names from OER mockup");
		exports.updateNamesFromOER(dal, oerNamesMockup, cb);
	}
}

exports.getAll = function(app, cb){
	var dal = app.locals.dal;
	dal.getAllCurrencies(cb);
}

exports.upsertRatesFromOER = function(dal, OERrates, cb){
	var rates = OERrates.rates;
	dal.upsertCurrencyRates(rates, cb);
}

exports.updateNamesFromOER = function(dal, OERNames, cb){
	dal.updateCurrencyNames(OERNames,cb);
}

exports.cronUpdateStart = function(api){
	log.info(LOG_TAG,"Starting cron update process for rate updates on "+config.openExchangeRate.cronUpdate);
	cron.schedule(config.openExchangeRate.cronUpdate);
}