var URL = require('url'),
    util = require('util'),
    qs = require('querystring'),
    ng = require('ng'),
    OAUTH_CREDENTIALS = 'oAuthCredentials';


exports.callback = function(req, res, next) {
    var reqUrl = URL.parse(req.url),
        oauth_verifier,
        oauth_credentials = ng.session.getObject(req, OAUTH_CREDENTIALS),
        err = 'Error, no oauth_token / oauth_token_secret in session';

    if(oauth_credentials === undefined ||
       oauth_credentials.oauth_token === undefined ||
       oauth_credentials.oauth_token_secret === undefined) {
        ng.http.error(req, res, err);
        return;
    }
    
    oauth_verifier = qs.parse(reqUrl.query).oauth_verifier;
    
    ng.oauth.getOAuthAccessToken(
        oauth_credentials.oauth_token,
        oauth_credentials.oauth_token_secret,
        oauth_verifier,
        function(error, oauth_access_token, oauth_access_token_secret, results2) {

            var user;

            if(error) {
                ng.http.error(req, res, err);
                return;
            }

            user = new ng.models.User(
                {
                    user_id: results2.user_id,
                    screen_name: results2.screen_name,
                    oauth_access_token: oauth_access_token,
                    oauth_access_token_secret: oauth_access_token_secret
                }
            );
            
            ng.db.saveUserDetails(
                user,
                function(err) {
                    if(err) {
                        ng.http.error(req, res, err, 'Error saving user details');
                        return;
                    }

                    ng.session.setLoggedInUser(req, user);
                    ng.http.redirect(res, '/home');
                }
            );
        }
    );            
};

exports.register = function(req, res, next) {
    ng.oauth.getOAuthRequestToken(
        function(err, oauth_token, oauth_token_secret, results) {
            if(err) {
                ng.http.error(req, res, err);
            } else {
                ng.session.storeObject(req, OAUTH_CREDENTIALS, 
                    {
                        oauth_token: oauth_token,
                        oauth_token_secret: oauth_token_secret
                    }
                );

                ng.oauth.redirectToTwitterAuth(res, oauth_token);
            }
        }
    )
};