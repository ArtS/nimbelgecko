#!/usr/bin/env node

require.paths.unshift('.');
require.paths.unshift('./internal');
require.paths.unshift('./external');
require.paths.unshift('./external/node-mongodb-native/lib');
require.paths.unshift('./external/connect/lib');
require.paths.unshift('./external/ejs/lib');
require.paths.unshift('./external/socket.io-connect');
require.paths.unshift('./external/socket.io-connect/vendor');

// Language extensions
require('extensions');

require('socketIO');


var util = require('util'),
    connect = require('connect'),
    ng = require('ng'),
    urls = require('urls').urls,
    socketIO = require('socket.io-node');


function bindUrls(app, url) {
    app.get(url.url,
        function(req, res, next) {

            // If no template defined, leave the rendering up to the view
            if(url.template === undefined) {
                url.view(req, res, next);
            } else {
            // Otherwise, get the context from the view and use it to 
            // render the template.
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
        bindUrls(app, urls[i]);
    }
}

function setupWebSocket(server, mongoStore) {

    var socket = socketIO.listen(server);

    socket.on('connection', socket.prefixWithMiddleware(
        function(client,req, res) {
            debugger;
            client.on('message',
                function(message) {
                    console.log(message);
                    client.send({data: 'wtf!'});
                }
            );
            client.on('disconnect',
                function() {
                    console.log('disconnected');
                }
            );
        }
    ));
}


ng.conf.initConfig(

    function(err) {
        var mongoStore = ng.db.mongoStore();

        if(err) {
            ng.log.error(err, 'Config initialisation failed.');
            return;
        }

        ng.db.initDatabase(['tweets', 'users'],
            //TODO: create separate instance for static files?
            function(err) {

                var server,
                    io;

                if(err) {
                    ng.log.error(err, 'Database initialisation failed.');
                    return;
                }

                server = connect.createServer(
                    connect.bodyDecoder(),
                    connect.cookieDecoder(),
                    connect.session({ store: mongoStore }),
                    connect.router(routes),
                    connect.staticProvider('./static')
                );
                server = server.listen(8081, '192.168.1.2');

                setupWebSocket(server, mongoStore);
            }
        );
    }
);

process.on('uncaughtException',
    function(err) {
        ng.log.error(err, 'Unhandled exception');
    }
);
