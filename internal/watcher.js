
var ng = require('ng');


function Watcher(instance, interval) {
    this._instance = instance,
    this._interval = interval;
    this._markedForDestruction = false;

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
}




Watcher.prototype.startWatching = function() {
    this.checkIsAlive();
}


Watcher.prototype.ping = function() {
    this._markedForDestruction = false;
}


exports.Watcher = Watcher;
