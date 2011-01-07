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
    runChain = require('node-chain').runChain,
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


function startStreaming(allUserIds) {

    console.log('Starting stream for ' + allUserIds);

    var req = ng.twitter.startStreaming(allUserIds),
        markedForDestruction = false,
        res;

    if (!req) {
        ng.log.error('Error while starting streaming.');
        return;
    }

    function streamWatcher() {
        if (markedForDestruction) {
            ng.log.log('This stream has been unresponsive, restarting...');
            res.destroy();
        } else {
            markedForDestruction = true;
            setTimeout(streamWatcher, STREAM_CHECK_INTERVAL);
        }
    }

    function onStreamError() {
        ng.log.log('Error in stream!');
        process.nextTick(startStreaming);
    }

    function onStreamClose() {
        ng.log.log('Stream closed!');
        process.nextTick(startStreaming);
    }

    function onStreamEnd() {
        ng.log.log('Stream end!');
        process.nextTick(startStreaming);
    }

    req.addListener('response',

        function(response) {

            res = response;

            res.setEncoding('utf8');

            res.addListener('data', 
                function(chunk) {
                    markedForDestruction = false;
                    handleChunk(chunk);
                }
            );

            res.socket.addListener('error', onStreamError);
            res.socket.addListener('close', onStreamClose);
            res.socket.addListener('end', onStreamEnd);

            streamWatcher();
        }
    );

    req.end();
}


chain = [
    {
        target: ng.conf.initConfig,
        errorMessage: 'Unable to init the config'
    },
    {
        target: ng.db.initDatabase,
        args: [['tweets', 'users', 'other']],
        errorMessage: 'Database initialisation failed.'
    },
    {
        target: ng.db.getAllUserIds,
        errorMessage: 'Error obtaining all user IDs',
        passResultToNextStep: true
    },
    {
        target: startStreaming,
        errorMessage: 'Error when starting receiving stream'
    }
];


runChain(chain);
