#!/usr/bin/env node

require.paths.unshift('./external');
require.paths.unshift('./external/node-mongodb-native/lib');
require.paths.unshift('./external/connect/lib');
require.paths.unshift('./external/ejs/lib');
require.paths.unshift('./internal');
require.paths.unshift('.');

require('extensions');

var util = require('util'),
    connect = require('connect'),
    oauth_views = require('./views/oauth'),
    ng = require('ng');


function routes(app) {

    app.get('/', 
        ng.http_tools.html(
            function(req, res, next) {
                ng.templates.render('index.html', {},
                    function(data) {
                        res.write(data);
                        res.end();
                    }
                );
            }
        )
    );

    app.get('/register', ng.views.oauth.register);
    app.get('/oauth/callback', ng.views.oauth.callback);

    app.get('/great-success',
        ng.http_tools.html(
            function(req, res, next) {
                res.end('<html><body>omg this is soo cool!<br/></body></html>');
            }
        )
    );

    app.get('/error',
        ng.http_tools.html(
            function(req, res, next) {
                res.end('oops something went wrong.');
            }
        )
    );
}

ng.conf.initConfig(
    function(err) {
        if(err) {
            ng.log.error(err);
            return;
        }

        ng.db.initDatabase(['tweets', 'users'],
            //TODO: create separate instance for static files?
            function(err) {
                if(err) {
                    ng.log.error(err);
                    return;
                }

                connect.createServer(
                    connect.bodyDecoder(),
                    connect.cookieDecoder(),
                    connect.session({ store: ng.db.mongoStore() }),
                    connect.router(routes),
                    connect.staticProvider('./static')
                ).listen(8081, '192.168.1.2');
            }
        );
    }
);
