
var ng = require('ng');


function Watcher(instance, interval) {
    _instance = instance,
    _interval = interval;
    _markedForDestruction = false;

    if (!(this instanceof Watcher)) {
        return new Watcher(instance, interval);
    }


    this.checkIsAlive = function() {
        if (_markedForDestruction) {
            ng.log.log('Watcher detected that object is flaky, restarting...');
            _instance.shutdown();
        } else {
            _markedForDestruction = true;
            setTimeout(checkIsAlive, _interval);
        }
    }


    this.startWatching = function() {
        checkIsAlive();
    }


    this.ping = function() {
        _markedForDestruction = false;
    }
}


exports.Watcher = Watcher;
