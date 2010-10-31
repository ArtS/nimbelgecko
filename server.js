#!/usr/bin/env node

require.paths.unshift('./external');
require.paths.unshift('./external/node-mongodb-native/lib');
require.paths.unshift('./external/connect/lib');

var mongodb = require('mongodb'),
    mongoStore = require('./external/connect-mongodb'),
    connect = require('connect'),
    util = require('util');


var CONTENT_TYPE_HTML = {'Content-type': 'text/html'};


function i(o) {
    console.log(util.inspect(o, true, 2));
}

function routes(app) {

    app.get('/', function(req, res, next) {

        res.writeHead(CONTENT_TYPE_HTML);

        res.end();
    });
}

connect.createServer(
    connect.bodyDecoder(),
    connect.cookieDecoder(),
    connect.session({ store: mongoStore() }),
    connect.router(routes)
).listen(8080, '192.168.1.2');
