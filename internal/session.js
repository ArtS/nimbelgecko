var util = require('util'),
    SESSION_ERROR = 'session_error',
    USER_SESSION_ID = 'user'


function _ensureSessionObject(session) {
    console.log('ensuring session is created')
    if (typeof session.ng === "undefined") {
        session.ng = {}
    }
}


function _saveSession(req) {
    console.log('Saving session: ', req.session)
    req.sessionStore.set(req.sessionID, req.session, function() {})
}


function storeObject(req, name, obj) {
    //_ensureSessionObject(req.session)
    req.session[name] = obj
    //console.log('Session: ')
    //console.dir(req.session)
    _saveSession(req)
}


function getObject(req, name) {
    //_ensureSessionObject(req.session)
    //console.log('Session: ')
    //console.dir(req.session)
    console.log('Getting session: ', req.session)
    return req.session[name]
}


function setLoggedInUser(req, user) {
    //console.log('setting logged in: ')
    //console.dir(user)
    storeObject(req, USER_SESSION_ID, user)
}


function getLoggedInUser(req) {
    var user = getObject(req, USER_SESSION_ID)
    //console.log('getting logged in: ')
    //console.dir(user)
    return getObject(req, USER_SESSION_ID)
}


function getSessionError(req) {
    return getObject(req, SESSION_ERROR)
}


function setSessionError(req, err) {
    storeObject(req, SESSION_ERROR, err)
}


exports.getSessionError = getSessionError
exports.setSessionError = setSessionError
exports.setLoggedInUser = setLoggedInUser
exports.getLoggedInUser = getLoggedInUser
exports.storeObject = storeObject
exports.getObject = getObject
