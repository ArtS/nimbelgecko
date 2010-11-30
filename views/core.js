var ng = require('ng');


exports.home_old = function(req, res, next) {

    var user = req.ng.user;

    ng.db.getRecentTweets(user.user_id,

        function(err, tweets) {
            var sorted_tweets;

            if (err) {
                ng.http.error(err, 'Unable to retrieve latest tweets');
                return;
            }

            sorted_tweets = ng.sorting.sortTweets(tweets, user);

            next(null, 
                { 
                    cat_names: ng.sorting.CATEGORIES,
                    tweets: sorted_tweets
                }
            );
        }
    );
};

exports.home = function(req, res, next) {
    next(null, {});
}
