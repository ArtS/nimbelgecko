var util = require('util');


exports.inspect = function(obj) {
    util.puts(util.inspect(obj, true, 2));
}

exports.error = function(err, message) {
    if(message !== null && message !== undefined) {
        util.log(message);
    }

    if(err.stack != undefined) {
        util.log(err.stack);
    }

    exports.inspect(err);

    return err;
}
