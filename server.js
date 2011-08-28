#!/usr/bin/env node


require('./fix-paths')


var connect = require('connect')
  , ng = require('ng')
  , urls = require('urls').urls
  , socketIO = require('socket.io-connect').socketIOconnect
  , io = require('socket.io')
  , server = null
  , runChain = require('node-chain').runChain


function bindUrls(app, url) {

    app.get(url.url,

        function(req, res, next) {

            // If no template defined, leave the rendering up to the view
            if(url.template === undefined) {

                url.view(req, res, next)

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
                                          'Error obtaining context for view at ' + url.url)
                            return
                        }

                        ng.templates.render(url.template, context,
                            // In case rendering failed, show error
                            function(err, htmlResult) {
                                if(err) {
                                    ng.http.error(req, res, err,
                                                  'Error when rendering template ' + url.template)
                                    return
                                }

                                ng.http.writeHtml(res, htmlResult)
                            }
                        )
                    }
                )
            }
        }
    )
}


function routes(app) {
    var i = 0,
        l = urls.length

        for(; i < l; i++) {
        bindUrls(app, urls[i])
    }
}


function startServer() {
    runChain([
        {
            target: ng.conf.initConfig,
            errorHandler: function(err) {
                ng.log.error(err, 'Config initialisation failed.')
            }
        },
        {
            target: ng.db.initDatabase,
            errorHandler: function(err) {
                ng.log.error(err, 'Database initialisation failed.')
            }
        },
        {
            target: function() {

                server = connect.createServer(
                    connect.cookieParser(),
                    connect.session({
                        store: ng.db.getMongoStore(),
                        secret: 'blah',
                        fingerprint: '',
                        cookieSession: {maxAge: 604800000}
                    }),
                    //socketIO(function() { return server }, ng.clientSocket.onSocketReady),
                    connect.bodyParser(),
                    connect.router(routes),
                    connect.static('./static')
                )

                var sio = io.listen(server)

                sio.set('authorization', function(data, accept) {
                    var cookies = connect.utils.parseCookie(data.headers.cookie)
                      , client = this

                    ng.db.getMongoStore().get(cookies['connect.sid'], function(err, session) {
                        ng.clientSocket.onSocketReady(client.sockets, session)
                        accept(null, true)
                    })
                })

                ng.log.log('Starting HTTP Server: ' + ng.conf.server_ip + ':' + ng.conf.server_port)
                server.listen(ng.conf.server_port, ng.conf.server_ip)
            }
        }
    ])
}


process.on('uncaughtException',
    function(err) {
        ng.log.error(err, 'Unhandled exception')
        try {
            if (server) {
                server.close()
                server = null
            }
        } catch(ex) {
            ng.log.error(ex, 'Exception while trying to shut down the server')
        } finally { 
            startServer()
        }
    }
)

startServer()
