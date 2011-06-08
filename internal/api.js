var ng = require('ng')


function getGroupedTweets(options) {

    ng.utils.checkRequiredOptions(options, ['user', 'next'])

    var opts = {userId: options.user.user_id}

    if (options.lastId) {
        opts.lastId = options.lastId
    }

    function _recentTweetsCallback(err, arr) {

        var sorted,
            key,
            result = {
                lastId: null,
                tweets: []
            }

        if (err) {
            options.next(err)
            return
        }

        if (arr.length != 0) {
            result.lastId = arr[0].id_str                   

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


function getNewTweetsFromDB(options) {
    ng.utils.checkRequiredOptions(options, ['user', 'lastId', 'next'])
    getGroupedTweets(options)
}


function getLatestTweetsFromTwitter(options) {

    ng.utils.checkRequiredOptions(options, ['user', 'next'])

    ng.twitter.retrieveTweets({
        oauth_token: options.user.oauth_access_token,
        oauth_secret: options.user.oauth_access_token_secret,
        next: options.next
    })
}


exports.getGroupedTweets = getGroupedTweets
exports.getNewTweetsFromDB = getNewTweetsFromDB
exports.getLatestTweetsFromTwitter = getLatestTweetsFromTwitter
