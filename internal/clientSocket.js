var ng = require('ng')


function onSocketReady(client, req, res) {

    console.log('session id:', client.sessionId)
    var user = ng.session.getLoggedInUser(req)
      , sinceId = null
      , intervalId = null

    function stopPolling() {
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
        client.send({'data': data})
    }

    function regularCheck() {

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
                    return
                }

                sinceId = result.sinceId
                sendSocketData(client, result.tweets)
            }
        })
    }

    client.on('message',
        function(message) {
            //client.send({data: 'wtf!'});
        }
    )

    client.on('disconnect',
        function() {
            var id = user ? user.user_id : ''
            stopPolling()
        }
    )

    if (user === null || user === undefined)  {
        sendSocketError(client, 'unauthorised')
        return
    }

    ng.api.getGroupedTweetsFromDB({
        user: user,
        next: function(err, result) {

            if (err) {
                sendSocketError(client, err)
                return
            }
            
            sinceId = result.sinceId
            sendSocketData(client, result.tweets)

            startPolling()
        }
    })
}


exports.onSocketReady = onSocketReady
