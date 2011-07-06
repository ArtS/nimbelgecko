var ng = require('ng')
  , _ = require('underscore')


exports.getGroupedTweetsFromDB = function(options) {

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


exports.getLatestTweetsFromTwitter = function(options) {

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
            console.log(tweet.id_str)
            if (tweet.id_str == minId) {
                return
            }
            results.push(tweet) 
        })

        minId = tweets[tweets.length - 1].id_str
        _retrieveBunch()
    }

    function _retrieveBunch(next) {
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


exports.registerNewUser = function(options) {

    ng.utils.checkRequiredOptions(
        options,
        [
            'user_id', 
            'screen_name', 
            'oauth_access_token', 
            'oauth_access_token_secret',
            'next'
        ]
    )

    var user = new ng.models.User(
        {
              user_id: options.user_id
            , screen_name: options.screen_name
            , oauth_access_token: options.oauth_access_token
            , oauth_access_token_secret: options.oauth_access_token_secret
        }
    )

    ng.db.saveUser({
        user: user,
        next: function(err) {

            if(err) {
                options.next(err)
                return
            }

            //
            // Schedule retreiving of existing tweets from DB
            //
            ng.api.getLatestTweetsFromTwitter({
                user: user,
                next: function(err, tweets) {
                    if (err) {
                        //TODO: fix 'Error: socket hang up' issue
                        debugger
                        return
                    }

                    _(tweets).each(function(tweet) {
                        ng.db.saveStreamItem({ 
                            for_user: user.user_id,
                            message: tweet
                        })
                    })
                }
            })

            //
            // Let Receiver process know that there's a new user
            //
            ng.db.storeNotification({
                notification: {
                    user_id: user.user_id,
                    event_type: 'registered'
                }
            })

            options.next(null, user)

        }
    })
}
