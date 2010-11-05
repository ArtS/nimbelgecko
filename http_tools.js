var CONTENT_TYPE_HTML = {'Content-type': 'text/html'};

exports.html = function(f) {
    return function(req, res, next) {
        res.writeHead(CONTENT_TYPE_HTML);
        f(req, res, next);
    }
}

exports.redirect = function(res, url) {
    res.writeHead(302, { Location: url });
    res.end();
}
