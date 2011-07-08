#!/usr/bin/env node


require('./fix-paths')


var ng = require('ng')
    runChain = require('node-chain').runChain,
    STREAM_CHECK_INTERVAL = 60000
    EventEmitter = require('events').EventEmitter

//
// Starts receiving all tweets from twitter in streaming mode
//
function startReceivingAllTweets() {

    function startReceivingStream(allUserIds) {

        var stream = new ng.twitter.ReceivingStream(allUserIds)
          , rstEvent = new EventEmitter()
          , timeoutWatcher = new ng.watcher.TimeoutWatcher(STREAM_CHECK_INTERVAL)
          , notificationtimeoutWatcher = new ng.watcher.NotificationWatcher(STREAM_CHECK_INTERVAL)

        rstEvent.once('restart', function() {
            ng.log.log('Somebody (' + arguments + ') requesting a restart')
            timeoutWatcher.stopWatching()
            notificationtimeoutWatcher.stopWatching()
            stream.shutdown()
        })

        stream.on('stream_ready', function() {
            timeoutWatcher.startWatching(rstEvent)
            notificationtimeoutWatcher.startWatching(rstEvent)
        })
        stream.on('data_arrvied', function() { timeoutWatcher.keepAlive() } )
        stream.on('shutdown', startReceivingAllTweets)
    }

    runChain([
        {
            target: ng.db.getAllUserIds,
            errorMessage: 'Error obtaining all user IDs',
            passResultToNextStep: true
        }
      , {
            target: startReceivingStream,
            errorMessage: 'Error when starting receiving stream'
        }
    ])
}

//
// Inits config engine, database and then kicks off
// receiving stream initialisation chain
//
function startReceiver() {
    runChain([
        {
            target: ng.conf.initConfig,
            errorMessage: 'Unable to init the config'
        },
        {
            target: ng.db.initDatabase,
            errorMessage: 'Database initialisation failed.'
        },
        {
            target: startReceivingAllTweets,
            errorMessage: 'Error starting streaming'
        }
    ])
}


process.on('uncaughtException',
    function(err) {
        ng.log.error(err, 'Unhandled exception')
        startReceiver()
    }
)

startReceiver()
