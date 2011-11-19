var ng = require('ng')


function onSocketReady(client, session) {

    var user = ng.session.getLoggedInUser({session: session})
      , sinceId = null
      , timeoutId = null

    function getUserId() {
        return user ? '@' + user.screen_name : 'N/A'
    }

    function cancelNextCheck() {
        ng.log.log('Terminating scheduled check for new messages for user @' + getUserId())
        if (timeoutId !== null) {
            clearTimeout(timeoutId)
        }
    }

    function scheduleNextCheck() {
        timeoutId = setTimeout(regularCheck, 3000);
    }

    function sendSocketError(client, err) {
        ng.log.error('Sending socket error: ' + err)
        client.send({'error': err})
    }

    function sendSocketData(client, data) {

        ng.log.log('Sending socket data to client ' + getUserId())
        for (var i=0; i < data.length; i++) {
            ng.log.log(data[i].key + ': ' + data[i].tweets.length)
        }

        client.flags.json = true
        client.send({'data': data})
    }

    function regularCheck() {

        //ng.log.log('Checking DB for user @' + getUserId())
        ng.api.getGroupedTweetsFromDB({
            user: user,
            sinceId: sinceId,
            next: function(err, result) {

                if (err) {
                    sendSocketError(client, err)
                    cancelNextCheck()
                    return
                }

		scheduleNextCheck()
                if (result.tweets.length === 0) {
                    //ng.log.log('Nothing found for user @' + getUserId())
                    return
                }

                //ng.log.log('Old sinceId: ' + sinceId)
                sinceId = result.sinceId
                //ng.log.log('New sinceId: ' + sinceId)
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
            ng.log.log('disconnected user ' + getUserId())
            cancelNextCheck()
        }
    )

    if (user === null || user === undefined)  {
        sendSocketError(client, 'unauthorised')
        return
    }

    scheduleNextCheck()
}


exports.onSocketReady = onSocketReady
