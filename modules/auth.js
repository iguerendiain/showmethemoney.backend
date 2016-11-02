// var jwt = require('jwt-simple');
// var moment = require('moment');
// var config = require('../config');
// var models = require('./models');
// var logger = require('./logger');

// var dbConn = require('./dbConn');

// exports.ensureAuthenticated = function(req, res, next){
//   if (clientThinksIsAuthenticated(req)){
//     var token = req.headers.authorization.split(' ')[1];

//     dbConn.Session.findOne({where:{sessionId:token}}).then(function(session){
//       if (session==null){
//         return res.status(401).send('Session with requested token was not found, please login again');
//       }else{
//         dbConn.Client.findOne({where:{clientId:session.client}}).then(function(client){
//           if (client==null){
//             session.destroy();
//             return res.status(401).send('Client specified on requested session was not found; session deleted, please login again');
//           }else{
//             dbConn.User.findOnw({where:{email:session.user}}).then(function(user){
//               if (user==null){
//                 session.destroy();
//                 var clientDeletion = "delete from clients where clientId in (select client from sessions where user = "+session.user+")";
//                 var sessionDeletion = "delete from sessions where user = '"+session.user+"'";

                
//               }

//             });
//           }
//         });
//       }
//     });

//   }else{
//     return res.status(401).send('Make sure your request has an Authorization header, try loging in');
//   }
// }











// var getUserFromAuthHeader = function(req, res, next){
//   var token = req.headers.authorization.split(' ')[1];

//   dbConn.User.findOne({where:{email:email}}).then(cb);





//   var payload = null;
//   try {
//     payload = jwt.decode(token, config.federated.google.clientSecret);
//   }catch (err) {
//     return res.status(401).send({ message: err.message });
//   }

//   if (payload.exp <= moment().unix()) {
//     return res.status(401).send({ message: 'Token has expired' });
//   }

//   req.user = payload.sub;
//   next();
// }

// exports.ensureAuthenticated=function(req, res, next) {
//   if (!req.headers.authorization) {
//     return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
//   }

//   return getUserFromAuthHeader(req, res, next);
// }

// exports.loadCurrentUser=function(req, res, next){
//   if (!req.headers.authorization) {
//     next();
//   }else{
//     return getUserFromAuthHeader(req, res, next);
//   }
// }
