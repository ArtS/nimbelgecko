var sys = require('sys'),
    ng = require('ng'),
    oAuth = require('node-oauth').OAuth,
    querystring = require('querystring');


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


function startStreaming(ids_to_follow) {

    var url = 'http://betastream.twitter.com/2b/site.json',
        ids_str = ids_to_follow.join(',');

    return oAuthGet(url, {with: 'followings', follow: ids_str});
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

exports.oAuthGet = oAuthGet;
exports.retrieveNewTweets = retrieveNewTweets;
exports.retrieveTweets = retrieveTweets;
exports.startStreaming = startStreaming;
