console.log(require('oauth'))
var sys = require('sys'),
    ng = require('ng'),
    oAuth = require('oauth').OAuth,
    querystring = require('querystring'),
    EventEmitter = require('events').EventEmitter,
    _ = require('underscore')._


function oAuthGet(options) {

    ng.utils.checkRequiredOptions(options, ['url',
                                            'oauth_token',
                                            'oauth_token_secret'])
    var url = options.url
      , params = options.params || {}
      , next = options.next || null
      , oauth_token = options.oauth_token
      , oauth_token_secret = options.oauth_token_secret
      , auth
      , args

    //TODO: use proper Url lib, if available
    url += '?' + querystring.stringify(params)

    auth = new oAuth(
        'https://api.twitter.com/oauth/request_token',
        'https://api.twitter.com/oauth/access_token',
        ng.conf.oauth_api_key,
        ng.conf.oauth_secret,
        '1.0A',
        null,
        'HMAC-SHA1'
    )

    function oAuthCallback(err, data, response) {

        if(err) {
            next(err, null)
            return
        }

        ng.log.data(data)

        data = JSON.parse(data)
        next(null, data)
    }

    args = [url, oauth_token, oauth_token_secret]

    if (next !== null) {
        args.push(oAuthCallback)
    }

    return auth.get.apply(auth, args)
}


function retrieveTweets(options) {

    ng.utils.checkRequiredOptions(options, ['next', 
                                            'oauth_token',
                                            'oauth_token_secret'])
    var next = options.next
      , params = options.params || {}

    if (params.sinceId !== null && params.since_id !== undefined) {
        ng.log.log('Retrieving historical tweets, starting from id ' + params.since_id)
    } else {
        if (params.maxId !== null && params.maxId !== undefined) {
            ng.log.log('Retrieving historical tweets, before id ' + params.max_id)
        } else {
            ng.log.log('Retrieving all tweets')
        }
    }

    var url = 'https://api.twitter.com/1/statuses/home_timeline.json'

    return oAuthGet({
        url: url
      , params: params
      , next: next
      , oauth_token: options.oauth_token
      , oauth_token_secret: options.oauth_token_secret
    })
}


function startStreaming(ids_to_follow) {

    var url = 'http://betastream.twitter.com/2b/site.json',
        ids_str = ids_to_follow.join(',')

    return oAuthGet({
        url: url, 
        params: {replies: 'all', with: 'followings', follow: ids_str},

        // This uses nimblegecko credentials from DB,
        // and God forbid you from ever changing those in Twitter
        // via re-authentication (banning and then enabling again or any other way)
        oauth_token: ng.conf.oauth_token,
        oauth_token_secret: ng.conf.oauth_token_secret
    })
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

                    // TODO: this introduces tight coupling to ng.db module
                    // possibly untangle that
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


exports.retrieveTweets = retrieveTweets
exports.startStreaming = startStreaming
exports.ReceivingStream = ReceivingStream
