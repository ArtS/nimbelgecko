var ng = require('ng');

exports.mark_all_read = function(req, res, next) {
    console.log(req.params);
    ng.http.redirect(res, '/home');
}
