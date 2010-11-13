var util = require('util');


exports._inspect = function(obj) {
    util.puts(util.inspect(obj, true, 2));
}


exports.getErrorStr = function(err, message) {
    var _err = null,
        _message = null,
        res = '';

    if (typeof err === "string") {
        _message = err;
    } else {
        if (err !== undefined) {
            _err = err;
        }
        if (typeof message === "string") {
            _message = message;
        }
    }

    if(_message !== null) {
        res += _message;
    }

    if(_err !== null) {
       if(_err.stack !== undefined) {
           res += (res.length == 0 ? '' : '\n') + _err.stack;
       }
    }

    return res;
}


exports.error = function(err, message) {
    util.log(exports.getErrorStr(err, message));
}
