var ng = require('ng')
  , _ = require('underscore')


function getGroupedTweetsFromDB(options) {

    ng.utils.checkRequiredOptions(options, ['user', 'next'])

    var opts = {userId: options.user.user_id}

    if (options.sinceId) {
        opts.sinceId = options.sinceId
    }

    function _recentTweetsCallback(err, arr) {

        var sorted,
            key,
            result = {
                sinceId: null,
                tweets: []
            }

        if (err) {
            options.next(err)
            return
        }

        if (arr.length != 0) {

            result.sinceId = arr[0].id_str                   

            sorted = ng.sorting.sortTweets(arr, options.user)
            for (key in sorted) {
                if (!sorted.hasOwnProperty(key)) {
                    continue
                }

                result.tweets.push([key, sorted[key]])
            }

        }

        options.next(null, result)
    }

    opts.next = _recentTweetsCallback
    ng.db.getRecentTweets(opts)
}


function getLatestTweetsFromTwitter(options) {

    ng.utils.checkRequiredOptions(options, ['user', 'next'])

    var minId = null
      , results = []

    function _isEndReached(err, tweets) {

        if (err) {
            options.next(err, results)
            return
        }

        if (tweets.length === 0 ||
            tweets[tweets.length - 1].id_str == minId) {
            ng.log.log('No more tweets to receive, returning.')
            options.next(null, results)
            return
        }

        _(tweets).each(function(tweet) { 
            if (tweet.id_str == minId) {
                return
            }
            results.push(tweet) 
        })

        minId = tweets[tweets.length - 1].id_str

        ng.log.log('Received ' + tweets.length + ' from history')
        ng.log.log('Oldest id: ' + minId)

        _retrieveBunch()
    }

    function _retrieveBunch() {
        var o = {
            oauth_token: options.user.oauth_access_token,
            oauth_token_secret: options.user.oauth_access_token_secret,
            next: _isEndReached,
            params: {
                count: 200
            }
        }

        if (minId !== null) {
            o.params.max_id = minId
        }

        ng.twitter.retrieveTweets(o)
    }

    _retrieveBunch()
}


exports.getGroupedTweetsFromDB = getGroupedTweetsFromDB
exports.getLatestTweetsFromTwitter = getLatestTweetsFromTwitter
