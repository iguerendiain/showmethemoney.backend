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
    deleted:{type:Sequelize.BOOLEAN, defaultValue:0}
  });

  var Account = sequelize.define('account',{
    name:Sequelize.STRING,
    slug:Sequelize.STRING,
    currency:Sequelize.STRING,
    deleted:{type:Sequelize.BOOLEAN, defaultValue:false}
  });

  var Record = sequelize.define('record',{
    description:Sequelize.TEXT,
    account:Sequelize.STRING,
    currency:Sequelize.STRING,
    type:{type: Sequelize.STRING, enum: ['PATCH','INCOME','EXPENSE']},
    amount:Sequelize.INTEGER,
    deleted:{type:Sequelize.BOOLEAN, defaultValue:0}
  });

  exports.Currency = Currency;
  exports.Account = Account;
  exports.Record = Record;

  Currency.sync().then(function(){
    Account.sync().then(function(){
      Record.sync().then(cb);
    });
  });
}
