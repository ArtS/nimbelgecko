var util = require('util'),
    SESSION_ERROR = 'session_error';


function _ensureSessionObject(session) {
    if (typeof session.ng === "undefined") {
        session.ng = {};
    }
}


function _saveSession(req) {
    req.sessionStore.set(req.sessionID, req.session);
}


function storeObject(req, name, obj) {
    _ensureSessionObject(req.session);
    req.session.ng[name] = obj;
    _saveSession(req);
}


function getObject(req, name) {
    _ensureSessionObject(req.session);
    return req.session.ng[name];
}


function setLoggedInUser(req, user) {
    storeObject(req, 'user',
        {
            user: user,
            isAuthenticated: true
        }
    );
}


function getSessionError(req) {
    return getObject(req, SESSION_ERROR);
}


function setSessionError(req, err) {
    var clone;

    function f() {}
    f.prototype = err;
    clone = new f();

    storeObject(req, SESSION_ERROR, clone);
}


exports.getSessionError = getSessionError;
exports.setSessionError = setSessionError;
exports.setLoggedInUser = setLoggedInUser;
exports.storeObject = storeObject;
exports.getObject = getObject;
