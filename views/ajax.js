var ng = require('ng');


exports.tweets = function(req, res, next) {

    debugger

    ng.db.getRecentTweets(req.ng.user.user_id,

        function(err, arr) {
            var sorted,
                key,
                result = [];

            if (err) {
                ng.http.error(req, res, err, 'Unable to obtain tweets');
                return;
            }

            sorted = ng.sorting.sortTweets(arr, req.ng.user);
            for (key in sorted) {
                if (!sorted.hasOwnProperty(key)) {
                    continue;
                }
                result.push([key, sorted[key]]);
            }

            ng.http.writeJSON(res, result);
        }
    );
}
