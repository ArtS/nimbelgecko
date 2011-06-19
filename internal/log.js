var util = require('util')
  , fs = require('fs')
  , plain_file = fs.createWriteStream(
        'plain.log',
        {
            flags: 'a',
            encoding: 'utf8'
        }
    )
  , data_file = fs.createWriteStream(
        'data.log',
        {
            flags: 'a',
            encoding: 'utf8'
        }
    )
  , log_file = fs.createWriteStream(
        'sys.log',
        {
            flags: 'a',
            encoding: 'utf8'
        }
    );


function _inspect(obj) {
    util.puts(util.inspect(obj, true, 2));
}


function getErrorStr(err, message) {

    var _err = null,
        _message = null,
        str = '';

    // If first parameter is a string, use it as output
    // Otherwise, check second parameter
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

    if (_message !== null) {
        str += _message;
    }

    if (_err !== null) {
        if (typeof _err.name !== 'undefined') {
            str += (str.length == 0 ? '' : '\n') + 'Exception name: ' + _err.name;
        }

        if (typeof _err.message !== 'undefined') {
            str += (str.length == 0 ? '' : '\n') + 'Exception message: ' + _err.message;
        }
        
        if (typeof _err.stack !== 'undefined') {
            str += (str.length == 0 ? '' : '\n') + 'Stack trace: ' + _err.stack;
        }
    }

    return str;
}


function error(err, message) {
    var errorMsg = getErrorStr(err, message);
    log(errorMsg);
}


function plain_log(text) {
    plain_file.write(text);
}


function log_data(data) {
    data_file.write(data);
}

function log(text) {
    util.log(text);
    log_file.write('\n');
    log_file.write(text);
}

exports.log = log;
exports.data = log_data;
exports._inspect = _inspect;
exports.plain_log = plain_log;
exports.error = error;
exports.getErrorStr = getErrorStr;
