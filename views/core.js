var ng = require('ng')


exports.home_old = function(req, res, next) {

    var user = req.ng.user

    ng.db.getRecentTweets({
        userId: user.user_id,
        next: function(err, tweets) {
            var sorted_tweets

            if (err) {
                ng.http.error(req, res, err, 'Unable to retrieve latest tweets')
                return
            }

            sorted_tweets = ng.sorting.sortTweets(tweets, user)
            console.log(sorted_tweets.me.length)

            next(null, 
                { 
                    cat_names: ng.sorting.CATEGORIES,
                    tweets: sorted_tweets
                }
            )
        }
    })
}

exports.home = function(req, res, next) {
    next(null, 
        {
            categories: ng.sorting.CATEGORIES
        }
    )
}
