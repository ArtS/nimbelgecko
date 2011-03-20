#!/usr/bin/env node


require.paths.unshift('.')
require.paths.unshift('./internal')
require.paths.unshift('./external')
require.paths.unshift('./external/underscore')
require.paths.unshift('./external/node-mongodb-native/lib')
require.paths.unshift('./external/connect/lib')

require('underscore')


var ng = require('ng'),
    EventEmitter = require('events').EventEmitter,
    runChain = require('node-chain').runChain,
    init_chain,
    STREAM_CHECK_INTERVAL = 60000


function ReceivingStream(allUserIds) {

    if (!(this instanceof ReceivingStream)) {
        return new ReceivingStream(allUserIds)
    }

    ng.log.log('Starting receiving stream for ' + allUserIds)

    var req = ng.twitter.startStreaming(allUserIds),
        _allUserIds = allUserIds,
        streamRes,
        buffer = {
            data: '',
            chunk: ''
        }

    if (!req) {
        ng.log.error('Error while starting streaming.')
        throw 'Error while starting streaming.'
    }

    req.addListener('response',

        function(response) {

            streamRes = response
            streamRes.setEncoding('utf8')
            streamRes.addListener('data', onData.bind(this))

            streamRes.socket.addListener('error', onStreamError.bind(this))
            streamRes.socket.addListener('close', onStreamClose.bind(this))
            streamRes.socket.addListener('end', onStreamEnd.bind(this))

            this.emit('stream_ready')

        }.bind(this)
    )

    req.end()

    //
    // Event handlers
    //

    function onStreamClose() { ng.log.log('Stream closed.') }
    function onStreamEnd() { ng.log.log('Stream end.') }
    function onStreamError() { ng.log.error('Error in stream!') }

    function onData(chunk) {
        //ng.log.log("Some data from twitter...")
        this.emit('data_arrvied')
        processReceivedData(chunk)
    }

    function processReceivedData(chunk) {

        if (chunk) { ng.log.data(chunk) }

        pieces = ng.glue.glueChunksOrKeepCalm(buffer, chunk)
        if (!pieces) {
            return
        }

        _(pieces).each(
            function(piece) {
                try {
                    js_piece = JSON.parse(piece)
                    ng.db.saveStreamItem(js_piece)
                } catch (err){
                    ng.log.error('error: ' + err)
                }
            }
        )
    }

    this.shutdown = function() {
        /*
        console.dir(this)
        console.dir(streamRes)
        console.dir(_allUserIds)
        */
        streamRes.destroy()
        this.emit('shutdown')
    }
}


ReceivingStream.prototype = new EventEmitter()


function startReceivingStream(allUserIds) {
    var stream = new ReceivingStream(allUserIds),
        watcher = new ng.watcher.Watcher(STREAM_CHECK_INTERVAL)

    stream.on('stream_ready', function() { watcher.startWatching(stream) } )
    stream.on('data_arrvied', function() { watcher.keepAlive() } )
    stream.on('shutdown', runStreamingChain)
}


//
// Starts receiving stream from twitter
//
function runStreamingChain() {
    var stream_chain = [
        {
            target: ng.db.getAllUserIds,
            errorMessage: 'Error obtaining all user IDs',
            passResultToNextStep: true
        }
      , {
            target: startReceivingStream,
            errorMessage: 'Error when starting receiving stream'
        }
    ]

    runChain(stream_chain)
}


//
// Inits config engine, database and then kicks off
// receiving stream initialisation chain
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
]

runChain(init_chain)
