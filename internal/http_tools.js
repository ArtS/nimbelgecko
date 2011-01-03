var CONTENT_TYPE_HTML = {'Content-type': 'text/html'},
    CONTENT_TYPE_JSON = {'Content-type': 'application/json'},
    ng = require('ng');


function writeJSON(res, obj, status_code) {
    status_code = status_code === undefined ? 200 : status_code;
    res.writeHead(status_code, CONTENT_TYPE_JSON);
    res.end(JSON.stringify(obj));    
}

function writeHtml(res, text, status_code) {
    status_code = status_code === undefined ? 200 : status_code;
    res.writeHead(status_code, CONTENT_TYPE_HTML);
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

// TODO: move to decorators?
function login_required(callback) {
    return function(req, res, next) {

        var user = ng.session.getLoggedInUser(req);
        
        if (!user) {
            ng.http.redirect(res, ng.conf.LOGIN_URL);
            return;
        }

        req.ng = req.ng || {};
        req.ng.user = user.user_profile;

        callback(req, res, next);
    }
}


exports.error = error;
exports.redirect = redirect;
exports.writeHtml = writeHtml;
exports.writeJSON = writeJSON;

exports.login_required = login_required;
