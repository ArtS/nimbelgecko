var CONTENT_TYPE_HTML = {'Content-type': 'text/html'},
    ng = require('ng');


function writeHtml(res, text) {
    res.writeHead(CONTENT_TYPE_HTML);
    res.end(text);
}


function redirect(res, url) {
    res.writeHead(302, { Location: url });
    res.end();
}


function error(req, res) {
    var logArgs = Array.prototype.splice.apply(arguments, [2]),
        errorStr = '';

    // Log to console whatever is available (err object/message)
    if(logArgs.length >= 1) {
        errorStr = ng.log.getErrorStr(logArgs[0]);
        ng.session.setSessionError(req, errorStr);
        ng.log.error.apply(null, logArgs);
    }

    redirect(res, '/error');
}


exports.error = error;
exports.redirect = redirect;
exports.writeHtml = writeHtml;
