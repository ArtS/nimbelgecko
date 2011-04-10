var sys = require('sys'),
    ng = require('ng'),
    oAuth = require('node-oauth').OAuth,
    querystring = require('querystring'),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore')._


function oAuthGet(url, params, callback) {

    var url_params = params || {},
        auth,
        args;

    url += '?' + querystring.stringify(url_params);

    auth = new oAuth(
        'https://api.twitter.com/oauth/request_token',
        'https://api.twitter.com/oauth/access_token',
        ng.conf.oauth_api_key,
        ng.conf.oauth_secret,
        '1.0A',
        null,
        'HMAC-SHA1'
    );

    function oAuthCallback(err, data, response) {

        if(err) {
            callback(err, null);
            return;
        }

        ng.log.data(data);

        data = JSON.parse(data);
        callback(null, data);
    }

    args = [
        url,
        ng.conf.oauth_token,
        ng.conf.oauth_token_secret
    ];

    if (callback !== undefined) {
        args.push(oAuthCallback);
    }

    return auth.get.apply(auth, args);
}




function retrieveTweets(params, callback) {

    var url_params = params || {};

    if((params != null && typeof params != "undefined") && (params.since_id != null)) {
        ng.log.log('Retrieving historical tweets, starting from id ' + params.since_id);
    } else {
        ng.log.log('Retrieving all tweets');
    }

    var url = 'https://api.twitter.com/1/statuses/home_timeline.json';

    return oAuthGet(url, url_params, callback);
}


function retrieveNewTweets(onNewTweetsRetrieved) {

    retrieveTweets(
        {},
        function(err, tweets) {
            if(err) {
                utils.printError(err, 'Unable to retrieve tweets (2)'); 
                // Re-try after 2 minutes
                utils.retryOnError(
                    function() { exports.retrieveNewTweets(onNewTweetsRetrieved); }
                );
                return;
            }
            onNewTweetsRetrieved(null, tweets);
        }
    );
}


function startStreaming(ids_to_follow) {

    var url = 'http://betastream.twitter.com/2b/site.json',
        ids_str = ids_to_follow.join(',');

    return oAuthGet(url, {with: 'followings', follow: ids_str});
}


function ReceivingStream(allUserIds) {

    if (!(this instanceof ReceivingStream)) {
        return new ReceivingStream(allUserIds)
    }

    ng.log.log('Starting receiving stream for ' + allUserIds)

    var req = startStreaming(allUserIds),
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


exports.oAuthGet = oAuthGet
exports.retrieveNewTweets = retrieveNewTweets
exports.retrieveTweets = retrieveTweets
exports.startStreaming = startStreaming
exports.ReceivingStream = ReceivingStream
