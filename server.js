#!/usr/bin/env node

require.paths.unshift('.')
require.paths.unshift('./internal');

// Language extensions
require('extensions');


var util = require('util'),
    connect = require('connect'),
    ng = require('ng'),
    urls = require('urls').urls,
    io = require('socket.io')
    socketIO = require('socket.io-connect').socketIO



function bindUrls(app, url) {

    app.get(url.url,

        function(req, res, next) {

            // If no template defined, leave the rendering up to the view
            if(url.template === undefined) {

                url.view(req, res, next);

            } else {

                //
                // Otherwise, get the context from the view and use it to 
                // render the template.
                //
                url.view(req, res, 
                    function(err, context) {
                        // In case call to view failed, show error
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

function onSocketReady(client, req, res) {

    var user = ng.session.getLoggedInUser(req),
        lastId = null,
        intervalId = null

    function sendSocketError(client, err) {
        client.send({'error': err})
    }

    function sendSocketData(client, data) {
        client.send({'data': data})
    }

    function regularCheck() {

        ng.api.getNewTweets({
            user: user, 
            lastId: lastId,
            next: function(err, result) {
                if (err) {
                    sendSocketError(client, err)
                    return
                }

                if (result.tweets.length === 0) {
                    return
                }

                lastId = result.lastId
                sendSocketData(client, result.tweets)
            }
        })
    }

    client.on('message',
        function(message) {
            //client.send({data: 'wtf!'});
        }
    )

    client.on('disconnect',
        function() {

            console.log(user.user_id + ' disconnected');

            if (intervalId !== null) {
                clearTimeout(intervalId)
            }
        }
    )

    ng.api.getGroupedTweets({
        user: user,
        next: function(err, result) {
            if (err) {
                sendSocketError(client, err)
                return
            }
            
            lastId = result.lastId
            sendSocketData(client, result.tweets)

            intervalId = setInterval(regularCheck, 3000)
        }
    })
}


function startServer() {

    ng.conf.initConfig(

        function(err) {

            if(err) {
                ng.log.error(err, 'Config initialisation failed.');
                return;
            }

            ng.db.initDatabase(['tweets', 'users'],

                function(err) {

                    var server

                    if(err) {
                        ng.log.error(err, 'Database initialisation failed.');
                        return;
                    }

                    // TODO: create separate instance for static files?
                    
                    server = connect.createServer(
                        socketIO(function() { return server; }, onSocketReady),
                        connect.bodyParser(),
                        connect.cookieParser(),
                        connect.session({store: ng.db.mongoStore, secret: 'blah'}),
                        connect.router(routes),
                        connect.static('./static')
                    )

                    server.listen(ng.conf.server_port, ng.conf.server_ip);

                }
            );
        }
    );
}


process.on('uncaughtException',
    function(err) {
        ng.log.error(err, 'Unhandled exception')
        startServer()
    }
)

startServer()
