
var ng = require('ng')

var Watcher = function(interval) {

    if (!(this instanceof Watcher)) {
        return new Watcher(interval)
    }

    var _instance
      , _interval = interval
      , _markedForDestruction = false


    this.checkIsAlive = function() {
        if (_markedForDestruction) {
            ng.log.log('Watcher detected that object is flaky, restarting...')
            _instance.shutdown()
        } else {
            //ng.log.log('Watcher is being kept alive, next check in ' + _interval)
            _markedForDestruction = true
            setTimeout(this.checkIsAlive.bind(this), _interval)
        }
    }


    this.startWatching = function(instance) {
        _instance = instance
        this.checkIsAlive()
    }


    this.keepAlive = function() {
        //ng.log.log("Watcher is nudged")
        _markedForDestruction = false
    }
}


exports.Watcher = Watcher
