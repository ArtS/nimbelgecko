var ng = require('ng');

exports.tweets = function(req, res, next) {

    ng.http.writeJSON(res, {omg: 'wtf'});

    next(null, {});
}
