var util = require('util'),
    SESSION_ERROR = 'session_error',
    USER_SESSION_ID = 'user';


function _ensureSessionObject(session) {
    if (typeof session.ng === "undefined") {
        session.ng = {};
    }
}


function _saveSession(req) {
    req.sessionStore.set(req.sessionID, req.session, function() {});
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


function setLoggedInUser(req, user_profile) {
    storeObject(req, USER_SESSION_ID,
        {
            user_profile: user_profile,
            isAuthenticated: true
        }
    );
}


function getLoggedInUser(req) {
    return getObject(req, USER_SESSION_ID);
}


function getSessionError(req) {
    return getObject(req, SESSION_ERROR);
}


function setSessionError(req, err) {
    storeObject(req, SESSION_ERROR, err);
}


exports.getSessionError = getSessionError;
exports.setSessionError = setSessionError;
exports.setLoggedInUser = setLoggedInUser;
exports.getLoggedInUser = getLoggedInUser;
exports.storeObject = storeObject;
exports.getObject = getObject;
