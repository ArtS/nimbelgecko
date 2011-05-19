var ng = require('ng')


function getGroupedTweets(user, next) {
    
    ng.db.getRecentTweets(
        {userId: user.user_id},

        function(err, arr) {
            var sorted,
                key,
                result = []

            if (err) {
                next(err)
                return
            }

            result.lastId = arr[0].id_str

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


function getNewTweets(user, lastId, next) {

    ng.db.getRecentTweets(
        {
            userId: user.user_id,
            lastId: lastId
        },
        function (err, result) {
            if (err) {
                next(err)
                return
            }

            next(null, result)
        }
    )
}


exports.getGroupedTweets = getGroupedTweets
exports.getNewTweets = getNewTweets
