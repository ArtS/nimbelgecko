var ng = require('ng');

exports.home = function(req, res, next) {
    var user_id;
    
    user_id = ng.session.getLoggedInUser(req).user_profile.user_id;

    ng.db.getRecentTweets(user_id,
        function(err, tweets) {
            if (err) {
                ng.http.error(err, 'Unable to retrieve latest tweets');
                return;
            }

            next(null, 
                { 
                    tweets: tweets
                }
            );
        }
    );
}
