#!/usr/bin/env node


require.paths.unshift('.');
require.paths.unshift('./internal');
require.paths.unshift('./external');
require.paths.unshift('./external/underscore');
require.paths.unshift('./external/node-mongodb-native/lib');
require.paths.unshift('./external/connect/lib');


require('underscore');


var ng = require('ng'),
    util = require('util'),
    chain,
    STREAM_CHECK_INTERVAL = 60000;


function isFieldPresent(elem, field_name) {

    if (elem[field_name] === undefined ||
        elem[field_name] === null) {

        return false;
    }

    return true;
}


function handleParsedElem(elem) {

    var msg;
    
    if (!isFieldPresent(elem, 'for_user')) {
        ng.log.error('No \'for_user\' field found in ' + JSON.stringify(elem));
        return;
    }

    if (!isFieldPresent(elem, 'message')) {
        ng.log.error('No \'message\' field found in ' + JSON.stringify(elem));
        return;
    }

    msg = elem.message;
    msg.owner_id = String(elem.for_user);

    if(msg.user !== undefined &&
       msg.text !== undefined) {

        msg.is_read = false;

        ng.db.saveTweet(msg, 
            function(err) {
                if (err) {
                    ng.log.error(err, 'Error while saving a tweet');
                }
            }
        );

        util.log('Saved tweet: \n' +
                 msg.user.screen_name +': ' + 
                 msg.text);
    } else {
        // Unknown type of message
        ng.db.saveUnknown(msg, 
            function(err) {
                if (err) {
                    ng.log.error(err, 'Error while saving an unknown entity.');
                }
            }
        );
        util.log('Saved unknown: ' + JSON.stringify(msg));
    }
}


function handleChunk(chunk) {

    if (chunk) {
        ng.log.data(chunk);
    }

    pieces = ng.glue.glueChunksOrKeepCalm(chunk);

    if (!pieces) {
        return;
    }

    _(pieces).each(

        function(piece) {

            try {
                js_piece = JSON.parse(piece);
                handleParsedElem(js_piece);
            } catch (err){
                ng.log.error('error: ' + err);
            }
        }
    );
}


function startStreaming() {

    var req = ng.twitter.startStreaming([20937471]),
        markedForDestruction = false,
        res;

    if (!req) {
        ng.log.error('Error while starting streaming.');
        return;
    }

    function streamWatcher() {
        if (markedForDestruction) {
            console.log('This stream has been unresponsive, restarting...');
            res.end();
        } else {
            markedForDestruction = true;
            setTimeout(streamWatcher, STREAM_CHECK_INTERVAL);
        }
    }

    req.addListener('response',

        function(response) {

            res = response;

            res.setEncoding('utf8');

            res.addListener('data', 
                function(chunk) {
                    util.log('Data');
                    markedForDestruction = false;
                    handleChunk(chunk);
                }
            );

            res.addListener('end',
                function() {
                    var a,
                        arg_arr = Array.prototype.splice(arguments);

                    console.log('!!! Error in response stream !!!');
                    for (a in arg_arr) {
                        console.log(a + ': ' + arg_arr[a]);
                    }

                    res.end();
                }
            );

            res.addListener('end',
                function() {
                    console.log('------[ end ]------');
                    setTimeout(startStreaming, 0);
                }
            );

            streamWatcher();
        }
    );

    req.end();
}


function runChain(chain, index) {
    var i = index || 0,
        currRing = chain[i],
        currArgs = [];

    function checkErrorCallback(err) {

        console.log('Got callback for chain N ' + i);

        if (err) {
            ng.log.error(currRing.errorMessage);
            return;
        }

        i += 1;
        runChain(chain, i);
    }

    if (currRing.args) {
        _(currRing.args).each(function(e) {
            currArgs.push(e);
        });
    }

    if (i != chain.length-1) {
        currArgs.push(checkErrorCallback);
    }

    console.log('Running chain N ' + i);
    currRing.target.apply(this, currArgs);
}

chain = [
    {
        target: ng.conf.initConfig,
        errorMessage: 'Unable to init the config'
    },
    {
        target: ng.db.initDatabase,
        errorMessage: 'Database initialisation failed.',
        args: [['tweets', 'users', 'other']]
    },
    {
        target: startStreaming
    }
];

runChain(chain);
