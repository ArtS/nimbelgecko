#!/usr/bin/env node


require.paths.unshift('.');
require.paths.unshift('./internal');
require.paths.unshift('./external');
require.paths.unshift('./external/underscore');
require.paths.unshift('./external/node-mongodb-native/lib');
require.paths.unshift('./external/connect/lib');

require('underscore');


var ng = require('ng'),
    runChain = require('node-chain').runChain,
    init_chain,
    STREAM_CHECK_INTERVAL = 60000;


function handleChunk(buffer) {

    if (buffer.chunk) {
        ng.log.data(buffer.chunk);
    }

    pieces = ng.glue.glueChunksOrKeepCalm(buffer);

    if (!pieces) {
        return;
    }

    _(pieces).each(
        function(piece) {
            try {
                js_piece = JSON.parse(piece);
                ng.db.saveStreamItem(js_piece);
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
        res,
        buffer = {
            data: '',
            chunk: ''
        };

    if (!req) {
        ng.log.error('Error while starting streaming.');
        return;
    }


    function streamWatcher() {

        if (markedForDestruction) {
            ng.log.log('This stream has been unresponsive, restarting...');

            // Restart receiver
            process.nextTick(runStreamingChain);
            
            // Shutdown current receiver
            process.nextTick(
                function() {
                    res.destroy();
                }
            );

        } else {
            markedForDestruction = true;
            setTimeout(streamWatcher, STREAM_CHECK_INTERVAL);
        }
    }


    function onStreamError() {
        ng.log.log('Error in stream!');

        markedForDestruction = true;
        streamWatcher();
    }


    function onStreamClose() {
        ng.log.log('Stream closed!');
    }


    function onStreamEnd() {
        ng.log.log('Stream end!');
    }

    req.addListener('response',

        function(response) {

            res = response;

            res.setEncoding('utf8');

            res.addListener('data', 
                function(chunk) {
                    markedForDestruction = false;
                    buffer.chunk = chunk;
                    handleChunk(buffer);
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

function runStreamingChain() {
    var stream_chain = [
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
    
    runChain(stream_chain);
}

init_chain = [
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
        target: runStreamingChain,
        errorMessage: 'Error starting streaming'
    }
];

runChain(init_chain);
