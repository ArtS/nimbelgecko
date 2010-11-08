#!/usr/bin/env node

require.paths.unshift('./external');
require.paths.unshift('./external/node-mongodb-native/lib');
require.paths.unshift('./external/connect/lib');
require.paths.unshift('./external/ejs/lib');
require.paths.unshift('.');

require('extensions');

var util = require('util'),
    URL = require('url'),
    qs = require('querystring'),
    connect = require('connect'),
    templates = require('./templates'),
    oauth = require('./oauth'),
    conf = require('node-config'),
    db = require('db'),
    http_tools = require('./http_tools'),
    log = require('log');


function routes(app) {

    app.get('/', 
        http_tools.html(
            function(req, res, next) {
                templates.render('index.html', {},
                    function(data) {
                        res.write(data);
                        res.end();
                    }
                );
            }
        )
    );

    app.get('/error',
        http_tools.html(
            function(req, res, next) {
                res.end('oops something went wrong.');
            }
        )
    );

    app.get('/oauth/callback',
        function(req, res, next) {
            var reqUrl = URL.parse(req.url),
                oauth_verifier;

            if(typeof req.session.oauth_token === "undefined" ||
               typeof req.session.oauth_token_secret === "undefined") {
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
        }
    );

    app.get('/great-success',
        http_tools.html(
            function(req, res, next) {
                res.end('<html><body>omg this is soo cool!<br/></body></html>');
            }
        )
    );

    app.get('/register',
        function(req, res, next) {

            oauth.getOAuthRequestToken(
                function(error, oauth_token, oauth_token_secret, results) {
                    if(error) {
                        log.inspect(error);
                        http_tools.redirect(res, '/error');
                    } else {

                        req.session.oauth_token = oauth_token;
                        req.session.oauth_token_secret = oauth_token_secret;
                        req.sessionStore.set(req.sessionID, req.session);

                        oauth.redirectToTwitterAuth(res, oauth_token);
                    }
                }
            )
        }
    );
}

conf.initConfig(
    function(err) {
        if(err) {
            log.error(err);
            return;
        }

        db.initDatabase(['tweets', 'users'],
            //TODO: create separate instance for static files?
            function(err) {
                if(err) {
                    log.error(err);
                    return;
                }

                connect.createServer(
                    connect.bodyDecoder(),
                    connect.cookieDecoder(),
                    connect.session({ store: db.mongoStore() }),
                    connect.router(routes),
                    connect.staticProvider('./static')
                ).listen(8081, '192.168.1.2');
            }
        );
    }
);
