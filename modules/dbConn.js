var async = require('async');
var pg = require('pg');
var config = require('../config');

exports.init = function(cb){
  var pool = new pg.Pool(config.db);

  pool.connect(function(err, client, done) {
    if(err) {
      console.error('error fetching client from pool', err);
      process.exit(1);
    }else{
      cb(client);
    }
  });
  
  pool.on('error', function (err, client) {
    console.error('idle client error', err.message, err.stack)
    process.exit(1);
  });
}