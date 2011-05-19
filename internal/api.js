var ng = require('ng')

function getGroupedTweets(user, next) {
    
    ng.db.getRecentTweets(user.user_id,

        function(err, arr) {
            var sorted,
                key,
                result = []

            if (err) {
                next(err)
                return
            }

            sorted = ng.sorting.sortTweets(arr, user)
            for (key in sorted) {
                if (!sorted.hasOwnProperty(key)) {
                    continue
                }
                result.push([key, sorted[key]])
            }

            next(null, result)
        }
    )
}

exports.getGroupedTweets = getGroupedTweets
