var mongoose = require('mongoose');

function getCurrencySchema(){
  var currencySchema = new mongoose.Schema({
    name:String,
    slug:{type: String, lowercase: true},
    factor:Number
  });

  return mongoose.model('Currency', currencySchema);
}

function getAccountSchema(){
  var accountSchema = new mongoose.Schema({
    name:String,
    slug:{type: String, lowercase: true},
    currency:{type:mongoose.Schema.Types.ObjectId, ref:'Currency'},
  });

  return mongoose.model('Account', accountSchema);
}

function getRecordSchema(){
  var recordSchema = new mongoose.Schema({
    description:String,
    account:{type:mongoose.Schema.Types.ObjectId, ref:'Account'},
    currency:{type:mongoose.Schema.Types.ObjectId, ref:'Currency'},
    type:{type: String, enum: ['PATCH','INCOME','EXPENSE']},
    amount:Number
  });

  return mongoose.model('Record', recordSchema);
}

exports.Currency = getCurrencySchema();
exports.Account = getAccountSchema();
exports.Record = getRecordSchema();
