

var ng = require('ng')


var TimeoutWatcher = function(interval) {

    if (!(this instanceof TimeoutWatcher)) {
        return new TimeoutWatcher(interval)
    }

    var rstEvent
      , _interval = interval
      , intervalHandle = null
      , stopWatching = false
      , _markedForDestruction = false


    function _restart() {
        rstEvent.emit('restart')
    }

    function _clearInterval() {
        if (intervalHandle) {
            clearInterval(intervalHandle)
            intervalHandle = null
        }
    }

    this.stopWatching = function() {
        if (intervalHandle) {
            stopWatching = true
            _clearInterval()
        }
    }

    this.startWatching = function(event) {
        rstEvent = event
        intervalHandle = setInterval(this.checkIsAlive.bind(this), _interval)
    }


    this.checkIsAlive = function() {

        if (stopWatching) {
            return
        }

        if (_markedForDestruction) {
            ng.log.log('Watcher detected that object is flaky, restarting...')
            _restart()
            _clearInterval()
        } else {
            ng.log.log('Watcher is being kept alive, next check in ' + _interval)
            _markedForDestruction = true
        }
    }


    this.keepAlive = function() {
        _markedForDestruction = false
    }
}


//
// TODO: Awful lot of common code, need to extract into 
// a mix-in
//
var NotificationWatcher = function(interval) {
    
    var rstEvent
      , _interval = interval
      , intervalHandle
      , stopWatching = false
    


    function _restart() {
        rstEvent.emit('restart')
    }

    function _clearInterval() {
        if (intervalHandle) {
            clearInterval(intervalHandle)
            intervalHandle = null
        }
    }

    this.stopWatching = function() {
        if (intervalHandle) {
            stopWatching = true
            _clearInterval()
        }
    }

    this.startWatching = function(event) {
        rstEvent = event
        intervalHandle = setInterval(_watcher.bind(this), _interval)
    }


    function _watcher() {

        if (stopWatching) {
            return
        }

        ng.db.getNewNotifications({

            next: function(err, res) {
                
                if (err) {
                    ng.log.error(err, 'Error getting new notifications')
                    _restart()
                    _clearInterval()
                    return
                }

                if (res.length === 0) {
                    return
                }

                // If there are new notification, mark them as 'read'
                ng.db.markNotificationsAsRead({
                    notifications: res,
                    next: function(err) {
                        if (err) {
                            ng.log.error(err, 'Error marking notifications as read')
                        }

                        ng.log.log('Requesting restart of receiver due to new sign-up')
                        // And then request restart of the watched object
                        _restart()
                        _clearInterval()
                    }
                })
            }
        })
    }
}


exports.TimeoutWatcher = TimeoutWatcher
exports.NotificationWatcher = NotificationWatcher
