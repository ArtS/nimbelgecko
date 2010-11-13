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
    ng = require('ng'),
    urls;


urls = [
    {
        url: '/register', 
        view: ng.views.oauth.register
    },
    {
        url: '/oauth/callback',
        view: ng.views.oauth.callback
    },
    {
        url: '/',
        view: ng.views.generic.root,
        template: 'index.html'
    },
    {
        url: '/home',
        view: ng.views.generic.home,
        template: 'home.html'
    },
    {
        url: '/error',
        view: ng.views.generic.error,
        template: 'index.html'
    }
];


function bindUrl(app, url) {
    app.get(url.url,
        function(req, res, next) {
            if(url.template === undefined) {
                // If no template defined, leave the rendering up to the view
                url.view(req, res, next);
            } else {
                // Otherwise, just get context from view and use it to render
                // the template.
                url.view(req, res, 
                    function(err, context) {
                        // In case view failed, show error
                        if(err) {
                            ng.http.error(req, res, err, 
                                          'Error obtaining context for view at ' + url.url);
                            return;
                        }

                        ng.templates.render(url.template, context,
                            // In case rendering failed, show error
                            function(err, htmlResult) {
                                if(err) {
                                    ng.http.error(req, res, err,
                                                  'Error when rendering template ' + url.template);
                                    return;
                                }

                                ng.http.writeHtml(res, htmlResult);
                            }
                        );
                    }
                );
            }
        }
    );
}


function routes(app) {
    var i = 0,
        l = urls.length;

    for(; i < l; i++) {
        bindUrl(app, urls[i]);
    }
}


ng.conf.initConfig(
    function(err) {
        if(err) {
            ng.log.error(err, 'Config initialisation failed.');
            return;
        }

        ng.db.initDatabase(['tweets', 'users'],
            //TODO: create separate instance for static files?
            function(err) {
                if(err) {
                    ng.log.error(err, 'Database initialisation failed.');
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

process.on('uncaughtException',
    function(err) {
        ng.log.error(err, 'Unhandled exception');
    }
);
