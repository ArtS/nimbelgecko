#!/usr/bin/env node

require.paths.unshift('.')
require.paths.unshift('./external')
require.paths.unshift('./internal')
require.paths.unshift('./external/node-mongodb-native/lib')
require.paths.unshift('./external/connect/lib')
require.paths.unshift('./external/connect/support');



var ng = require('ng'),
    runChain = require('node-chain').runChain,
    STREAM_CHECK_INTERVAL = 60000



//
// Inits config engine, database and then kicks off
// receiving stream initialisation chain
//
runChain([
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
        target: startReceivingAllTweets,
        errorMessage: 'Error starting streaming'
    }
])


//
// Starts receiving all tweets from twitter in streaming mode
//
function startReceivingAllTweets() {

    function startReceivingStream(allUserIds) {

        var stream = new ng.twitter.ReceivingStream(allUserIds)
          , watcher = new ng.watcher.Watcher(STREAM_CHECK_INTERVAL)

        stream.on('stream_ready', function() { watcher.startWatching(stream) } )
        stream.on('data_arrvied', function() { watcher.keepAlive() } )
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
