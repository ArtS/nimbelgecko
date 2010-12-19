#!/usr/bin/env node


require.paths.unshift('.');
require.paths.unshift('./internal');
require.paths.unshift('./external');
require.paths.unshift('./external/node-mongodb-native/lib');
require.paths.unshift('./external/connect/lib');

var ng = require('ng');


ng.conf.initConfig(

    function(err) {
        var req;

        if(err) {
            ng.log.error(err, 'Unable to init the config'); 
            return;
        }

        req = ng.twitter.startStreaming([20937471]);

        if (!req) {
            console.log('ERROR starting!');
            return;
        }

        req.addListener('response',
            function(response) {

                response.setEncoding('utf8');

                response.addListener('data',
                    function(chunk) {
                        ng.log.plain_log(chunk);
                    }
                );

                response.addListener('end',
                    function() {
                        console.log('-----------------');
                    }
                );
            }
        );

        req.end();
    }
);
