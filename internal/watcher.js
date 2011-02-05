
var ng = require('ng');


function Watcher(instance, interval) {
    this._instance = instance,
    this._interval = interval;

    if (!(this instanceof Watcher)) {
        return new Watcher(instance, interval);
    }
}


Watcher.prototype.checkIsAlive = function() {
    if (this._instance.markedForDestruction) {
        ng.log.log('Watcher detected that object is flaky, restarting...');
        this._instance.emit('reset');
    } else {
        this._instance.markedForDestruction = true;
        setTimeout(this.checkIsAlive.bind(this),
                   this._interval);
    }
}


Watcher.prototype.startWatching = function() {
    this.checkIsAlive();
}


exports.Watcher = Watcher;
