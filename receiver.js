#!/usr/bin/env node


require.paths.unshift('.');
require.paths.unshift('./internal');
require.paths.unshift('./external');
require.paths.unshift('./external/underscore');
require.paths.unshift('./external/node-mongodb-native/lib');
require.paths.unshift('./external/connect/lib');

require('underscore');


var ng = require('ng'),
    EventEmitter = require('events').EventEmitter,
    runChain = require('node-chain').runChain,
    init_chain,
    STREAM_CHECK_INTERVAL = 60000;


// TODO: Mix in with EventEmitter and handle external things like restart 
// of ReceivingSignal from outside, listening on 'end' event of it
function ReceivingStream(allUserIds) {

    if (!(this instanceof ReceivingStream)) {
        return new ReceivingStream(allUserIds);
    }

    ng.log.log('Starting receiving stream for ' + allUserIds);

    var req = ng.twitter.startStreaming(allUserIds),
        _allUserIds = allUserIds,
        watcher = new ng.watcher.Watcher(this, STREAM_CHECK_INTERVAL),
        streamRes,
        buffer = {
            data: '',
            chunk: ''
        };

    if (!req) {
        ng.log.error('Error while starting streaming.');
        throw 'Error while starting streaming.';
    }

    this.on('restart', onRestart.bind(this));

    req.addListener('response',

        function(response) {
            streamRes = response;
            streamRes.setEncoding('utf8');
            streamRes.addListener('data', onData);

            streamRes.socket.addListener('error', onStreamError.bind(this));
            streamRes.socket.addListener('close', onStreamClose.bind(this));
            streamRes.socket.addListener('end', onStreamEnd.bind(this));

            watcher.startWatching();
        }
    );

    req.end();

    //
    // Event handlers
    //

    function onStreamClose() { ng.log.log('Stream closed.'); }

    function onStreamEnd() { ng.log.log('Stream end.'); }

    function onStreamError() {
        ng.log.error('Error in stream!');
        onRestart();
    }

    function onData(chunk) {
        // Let watcher know that we're still alive
        watcher.ping();
        processReceivedData(chunk);
    }

    function processReceivedData(chunk) {

        if (chunk) { ng.log.data(chunk); }

        pieces = ng.glue.glueChunksOrKeepCalm(buffer, chunk);
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

    this.shutdown = function() {
        process.nextTick(runStreamingChain);
        streamRes.destroy();
        this.emit('shutdown');
    }
}


ReceivingStream.prototype = new EventEmitter();


function startReceivingStream(allUserIds) {
    var stream = new ReceivingStream(allUserIds);
    stream.on('shutdown', runStreamingChain);
}


function runStreamingChain() {
    var stream_chain = [
        {
            target: ng.db.getAllUserIds,
            errorMessage: 'Error obtaining all user IDs',
            passResultToNextStep: true
        },
        {
            target: startReceivingStream,
            errorMessage: 'Error when starting receiving stream'
        }
    ];

    runChain(stream_chain);
}


//
// Inits config engine, database and then kicks off
// receiving stream
//
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
