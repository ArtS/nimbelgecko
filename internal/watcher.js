
var ng = require('ng')

var Watcher = (function() {

    var _instance
      , _interval
      , _markedForDestruction = false

    function constructor(instance, interval) {

        if (!(this instanceof constructor)) {
            return new constructor(instance, interval)
        }

        _instance = instance
        _interval = interval
    }

    function checkIsAlive() {
        if (_markedForDestruction) {
            ng.log.log('Watcher detected that object is flaky, restarting...')
            _instance.shutdown()
        } else {
            _markedForDestruction = true
            setTimeout(checkIsAlive, _interval)
        }
    }

    constructor.prototype.startWatching = function() {
        checkIsAlive()
    }

    constructor.prototype.ping = function() {
        _markedForDestruction = false
    }

    return constructor

})()


exports.Watcher = Watcher
