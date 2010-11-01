#!/usr/bin/env node

require.paths.unshift('./external');
require.paths.unshift('./external/node-mongodb-native/lib');
require.paths.unshift('./external/connect/lib');
require.paths.unshift('./external/ejs/lib');

var mongodb = require('mongodb'),
    mongoStore = require('./external/connect-mongodb'),
    connect = require('connect'),
    util = require('util'),
    ejs = require('ejs'),
    fs = require('fs');


var CONTENT_TYPE_HTML = {'Content-type': 'text/html'};


function i(o) {
    console.log(util.inspect(o, true, 2));
}

function html(f) {
    return function(req, res, next) {
        res.writeHead(CONTENT_TYPE_HTML);
        f(req, res, next);
    }
}

function routes(app) {

    app.get('/', 
        html(function(req, res, next) {
            
            var rS = fs.createReadStream('./templates/index.html'),
                fileData = '';

            rS.on('data',
                function(data) {
                    fileData += data;
                }
            );

            rS.on('end',
                function(err) {
                    if(err) {
                        console.log(err);
                        throw err;
                    }

                    fileData = ejs.render(fileData, {});
                    //console.log(fileData);
                    res.write(fileData);
                    res.end();
                    //res.end(fileData);
                }
            );
        })
    );
}

connect.createServer(
    connect.bodyDecoder(),
    connect.cookieDecoder(),
    connect.session({ store: mongoStore() }),
    connect.router(routes),
    connect.staticProvider('./static')
).listen(8080, '192.168.1.2');
