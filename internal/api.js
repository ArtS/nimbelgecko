var ng = require('ng')
  , _ = require('underscore')


exports.handleLogin = function(opts) {

    ng.utils.checkRequiredOptions(opts, ['oauth_access_token', 'oauth_access_token_secret', 
                                         'oauth_data','next'])

    ng.db.getUserById({
        user_id: opts.oauth_data.user_id,
        next: function(err, user) {

            if (err)
                callback(err, null)

            if (user === null || typeof user === "undefined") {

                ng.api.registerNewUser({
                      user_id: opts.oauth_data.user_id
                    , screen_name: opts.oauth_data.screen_name 
                    , oauth_access_token: opts.oauth_access_token
                    , oauth_access_token_secret: opts.oauth_access_token_secret
                    , next: opts.next
                })

            } else {

                ng.api.updateUserData({
                    data: opts.oauth_data,
                    oldUser: user,
                    next: opts.next
                })
            }
        }
    })
}


exports.getGroupedTweetsFromDB = function(opts) {

    ng.utils.checkRequiredOptions(opts, ['user', 'next'])

    function _recentTweetsCallback(err, arr) {

        var sorted,
            key,
            result = {
                sinceId: null,
                tweets: []
            }

        if (err) {
            opts.next(err)
            return
        }

        if (arr.length != 0) {

            result.sinceId = arr[0].id//_str
            ng.log.log('New max ID for @' + opts.user.screen_name + ' ' + arr[0].id)

            sorted = ng.sorting.sortTweets(arr, opts.user)
            for (key in sorted) {
                if (!sorted.hasOwnProperty(key))
                    continue

                item = {
                    key: key, 
                    tweets: sorted[key]
                }

                if (key === ng.sorting.CATEGORY_ME) {
                    item.screen_name = '@' + opts.user.screen_name
                }

                result.tweets.push(item)
            }

        }

        opts.next(null, result)
    }

    var recentTweetsOpts = {
        user_id: opts.user.user_id,
        next: _recentTweetsCallback
    }

    if (opts.sinceId) {
        recentTweetsOpts.sinceId = opts.sinceId
    }

    ng.db.getRecentTweets(recentTweetsOpts)
}


exports.getLatestTweetsFromTwitter = function(opts) {

    ng.utils.checkRequiredOptions(opts, ['user', 'next'])

    var minId = null
      , results = []

    function _isEndReached(err, tweets) {

        if (err) {
            opts.next(err, results)
            return
        }

        if (tweets.length === 0 ||
            tweets[tweets.length - 1].id_str == minId) {
            ng.log.log('No more tweets to receive for user @' + opts.user.screen_name + ', returning.')
            opts.next(null, results)
            return
        }

        _(tweets).each(function(tweet) { 
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
            oauth_token: opts.user.oauth_access_token,
            oauth_token_secret: opts.user.oauth_access_token_secret,
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


exports.getAndSaveLatestTweetsFromTwitter = function(user) {

    ng.api.getLatestTweetsFromTwitter({
        user: user,
        next: function(err, tweets) {
            if (err) {
                //TODO: not sure whether this still being triggered,
                // leaving it for now
                debugger
                ng.log.error(err, 'Not sure what that is')
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
}


exports.registerNewUser = function(opts) {

    ng.utils.checkRequiredOptions(
        opts,
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
              user_id: opts.user_id
            , screen_name: opts.screen_name
            , oauth_access_token: opts.oauth_access_token
            , oauth_access_token_secret: opts.oauth_access_token_secret
        }
    )

    ng.db.saveNewUser({
        user: user,
        next: function(err, user) {

            if(err) {
                opts.next(err)
                return
            }

            //
            // Let Receiver process know that there's a new user
            // and it needs to restart ASAP
            //
            ng.db.storeNotification({
                notification: {
                    user_id: user.user_id,
                    event_type: 'registered'
                }
            })

            ng.api.getAndSaveLatestTweetsFromTwitter(user)

            opts.next(null, user)
        }
    })
}


exports.updateUserData = function(opts) {

    ng.utils.checkRequiredOptions(opts, ['next', 'data', 'oldUser'])

    // Check if there's no tweets, schedule retrieval of tweets
    // for this user. Prone to resource exhauston attack by remote
    // client via repeated login/logout, although should be easy to fix - 
    // by adding and checking a field in user profile. TODO?
    ng.db.getUserTweetsCount({
        user_id: opts.oldUser.user_id,
        next: function(err, count) {

            if (count !== 0)
                return
            
            ng.log.log('User @' + opts.oldUser.screen_name + 
                    ' logged in with 0 tweets, trying to retrieve some from Twitter')

            ng.api.getAndSaveLatestTweetsFromTwitter(opts.oldUser)
        }
    })

    // Also need to update user profile record in case anything changed
    // Mostlikely that's going to be only screen_name, I don't think
    // oauth data changes ever - otherwise we wouldn't be able to log in
    // in first place.
    ng.db.updateExistingUser(opts)
}
