var URL = require('url'),
    http_tools = require('http_tools'),
    qs = require('querystring'),
    oauth = require('oauth'),
    log = require('log'),
    db = require('db');


exports.callback = function(req, res, next) {
    var reqUrl = URL.parse(req.url),
        oauth_verifier;

    if(typeof req.session.oauth_token === "undefined" ||
       typeof req.session.oauth_token_secret === "undefined") {
        // TODO: refactor into global URL resolution
        http_tools.redirect(res, '/error');
        return;
    }
    
    oauth_verifier = qs.parse(reqUrl.query).oauth_verifier;
    
    oauth.getOAuthAccessToken(
        req.session.oauth_token,
        req.session.oauth_token_secret,
        oauth_verifier,
        function(error, oauth_access_token, oauth_access_token_secret, results2) {

            if(error) {
                log.inspect(error);
                // TODO: refactor into global URL resolution
                http_tools.redirect(res, '/error');
                return;
            }

            db.saveUserDetails(
                {
                    user_id: results2.user_id,
                    screen_name: results2.screen_name,
                    oauth_access_token: oauth_access_token,
                    oauth_access_token_secret: oauth_access_token_secret
                },

                function(err) {
                    if(err) {
                        // TODO: refactor into global URL resolution
                        http_tools.redirect(res, '/error');
                        return;
                    }

                    req.session.currentUser = {
                        screen_name: results2.screen_name,
                        user_id: results2.user_id
                    };

                    req.sessionStore.set(req.sessionID, req.session);

                    http_tools.redirect(res, '/great-success');
                }
            );
        }
    );            
};

exports.register = function(req, res, next) {
    oauth.getOAuthRequestToken(
        function(error, oauth_token, oauth_token_secret, results) {
            if(error) {
                log.inspect(error);
                // TODO: refactor into global URL resolution
                http_tools.redirect(res, '/error');
            } else {

                req.session.oauth_token = oauth_token;
                req.session.oauth_token_secret = oauth_token_secret;
                req.sessionStore.set(req.sessionID, req.session);

                oauth.redirectToTwitterAuth(res, oauth_token);
            }
        }
    )
};
