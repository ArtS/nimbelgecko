var ng = require('ng')


exports.root = function(req, res, next) {
    next(null, {})
}


exports.error = function(req, res, next) {
    var html = 'oops something went wrong.' + 
               '<br/>' + ng.session.getSessionError(req)
    ng.http.writeHtml(res, html, 500)
}


exports.home = function(req, res, next) {
    next(null, {})
}
