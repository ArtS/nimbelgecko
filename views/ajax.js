var ng = require('ng')


exports.tweets = function(req, res, next) {

    ng.api.getGroupedTweetsFromDB({
        user: req.ng.user,

        next: function(err, result) {

            if (err) {
                ng.http.error(req, res, err, 'Unable to obtain tweets')
                return
            }

            ng.http.writeJSON(res, result)
        }
    })
}
