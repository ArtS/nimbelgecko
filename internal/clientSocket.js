var ng = require('ng')


function onSocketReady(client, session) {

    var user = ng.session.getLoggedInUser({session: session})
      , sinceId = null
      , intervalId = null

    function stopPolling() {
        ng.log.log('Terminating polling for new messages for user @' + user.screen_name)
        if (intervalId !== null) {
            clearTimeout(intervalId)
        }
    }

    function startPolling() {
        intervalId = setInterval(regularCheck, 3000);
    }

    function sendSocketError(client, err) {
        ng.log.error('Sending socket error: ' + err)
        client.send({'error': err})
    }

    function sendSocketData(client, data) {

        ng.log.log('Sending socket data to client ' + user.screen_name)
        for (var i=0; i < data.length; i++) {
            ng.log.log(data[i].key + ': ' + data[i].tweets.length)
        }

        client.flags.json = true
        client.send({'data': data})
    }

    function regularCheck() {

        //ng.log.log('Checking DB for user @' + user.screen_name)
        ng.api.getGroupedTweetsFromDB({
            user: user,
            sinceId: sinceId,
            next: function(err, result) {

                if (err) {
                    sendSocketError(client, err)
                    stopPolling()
                    return
                }

                if (result.tweets.length === 0) {
                    //ng.log.log('Nothing found for user @' + user.screen_name)
                    return
                }

                ng.log.log('Old sinceId: ' + sinceId)
                sinceId = result.sinceId
                ng.log.log('New sinceId: ' + sinceId)
                sendSocketData(client, result.tweets)
            }
        })
    }

    client.on('message',
        function(message) {
            ng.log.log(message)
        }
    )

    client.on('disconnect',
        function() {
            var id = user ? '@' + user.screen_name : 'N/A'
            ng.log.log('disconnected user ' + id)
            stopPolling()
        }
    )

    if (user === null || user === undefined)  {
        sendSocketError(client, 'unauthorised')
        return
    }

    startPolling()
}


exports.onSocketReady = onSocketReady
