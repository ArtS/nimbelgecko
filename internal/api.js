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


function getNewTweets(options) {
    ng.utils.checkRequiredOptions(options, ['user', 'lastId', 'next'])
    getGroupedTweets(options)
}


exports.getGroupedTweets = getGroupedTweets
exports.getNewTweets = getNewTweets
