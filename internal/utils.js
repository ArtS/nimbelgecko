exports.checkRequiredOptions = function(options, requiredItems) {
    var i = 0
      , l = requiredItems.length
      
    for (; i < l; i++) {
        if (typeof options[requiredItems[i]] === "undefined" ||
            options[requiredItems[i]] === null) {

            throw new Error('options.' + requiredItems[i] + ' is missing or set to null.')
        }
    }
}
