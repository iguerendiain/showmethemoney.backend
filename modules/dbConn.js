var async = require('async');
var Sequelize = require('sequelize');

var config = require('../config');

exports.init = function(cb){
  sequelize = new Sequelize(
    config.db.database,
    config.db.username,
    config.db.password,
    {
      host: config.db.host,
      dialect: config.db.type,
      pool: config.db.pool
    }
  );

  var Currency = sequelize.define('currency',{
    name:Sequelize.STRING,
    slug:Sequelize.STRING,
    factor:Sequelize.FLOAT,
    deleted:{type:Sequelize.BOOLEAN, defaultValue:0},
    user:Sequelize.INTEGER
  });

  var Account = sequelize.define('account',{
    name:Sequelize.STRING,
    slug:Sequelize.STRING,
    currency:Sequelize.STRING,  // Currency.slug
    deleted:{type:Sequelize.BOOLEAN, defaultValue:false},
    user:Sequelize.INTEGER    
  });

  var Record = sequelize.define('record',{
    description:Sequelize.TEXT,
    account:Sequelize.STRING,   // Account.slug
    currency:Sequelize.STRING,  // Currency.slug
    type:{type: Sequelize.STRING, enum: ['PATCH','INCOME','EXPENSE']},
    amount:Sequelize.INTEGER,
    deleted:{type:Sequelize.BOOLEAN, defaultValue:false},
    time:Sequelize.INTEGER,
    user:Sequelize.INTEGER    
  });

  var User = sequelize.define('user',{
    email:Sequelize.TEXT,
    name:Sequelize.TEXT,
    firstName:Sequelize.TEXT,
    lastName:Sequelize.TEXT,
    avatar:Sequelize.TEXT,
    admin:{type:Sequelize.BOOLEAN, defaultValue:false},
    googleId:Sequelize.TEXT
  });

  var Client = sequelize.define('client',{
    clientId:Sequelize.TEXT,
    type:{type: Sequelize.STRING, enum: ['ANDROID', 'WEB']}
  });

  var Session = sequelize.define('session',{
    sessionId:Sequelize.TEXT,
    client:Sequelize.TEXT,  // Client.clientId
    user:Sequelize.TEXT,    // User.email
    lastAccess:Sequelize.INTEGER
  });

  exports.Currency = Currency;
  exports.Account = Account;
  exports.Record = Record;
  exports.User = User;
  exports.Client = Client;
  exports.Session = Session;

  sequelize.sync().then(cb);

  // async.series([
  //   function(cb){User.sync()    .then(cb);},
  //   function(cb){Client.sync()  .then(cb);},
  //   function(cb){Session.sync() .then(cb);},
  //   function(cb){Currency.sync().then(cb);},
  //   function(cb){Account.sync() .then(cb);},
  //   function(cb){Record.sync()  .then(cb);}
  // ],cb);

}
