var ng = require('ng')


exports.home = function(req, res, next) {
    next(null, 
        {
            categories: ng.sorting.CATEGORIES
        }
    )
}
