var _ = require('underscore')
  , mongo = require('mongodb')
  , ng = require('ng')
  , db = null
  , mongoStore = require('connect-mongodb')
  , log = require('log')
  , models = require('models')

  , USERS_COLLECTION = 'users'
  , TWEETS_COLLECTION = 'tweets'
  , OTHER_COLLECTION = 'other'
  , NOTIF_COLLECTION = 'notifications'

  , collections = {}


exports.saveUnknown = function(item, callback) {
    var col = collections[OTHER_COLLECTION]
    col.insert(item, callback)
}


function getAllUsersInternal(callback) {
    
    var users = collections[USERS_COLLECTION]

    users.find(
        function(err, cursor) {
            if (err) {
                ng.log.error(err, 'Error while getting all user IDs')
                callback(err, null)
                return
            }

            cursor.toArray(
                function(err, arr) {

                    var res = []

                    if (err) {
                        ng.log.error(err, 'Error converting to array for getAllUserIds.')
                        callback(err, null)
                        return
                    }

                    callback(null, arr)
                }
            )
        }
    )
}


exports.getAllUserIds = function(callback) {

    getAllUsersInternal(function(err, arr) {

        if (err) {
            callback(err)
            return
        }

        res = _(arr).chain()
                .select(function(user) { 
                    return !!user.user_id
                })
                .map(function(user) {
                    return user.user_id;
                }).value()

        callback(null, res)
    })
}


exports.getAllUsers = function(callback) {
    getAllUsersInternal(function(err, arr) {
        callback(err, arr)
    })
}


function _updateExistingUser(opts) {

}


exports.saveNewUser = function(opts) {

    ng.utils.checkRequiredOptions(opts, ['user', 'next'])

    var users = collections[USERS_COLLECTION]

    users.insert(
        new models.User(
            {
                user_id: opts.user.user_id,
                screen_name: opts.user.screen_name,
                oauth_access_token: opts.user.oauth_access_token,
                oauth_access_token_secret: opts.user.oauth_access_token_secret
            }
        ),
        function(err, doc) {
            if(err) {
                return opts.next(err, null)
            }

            return opts.next(null, doc)
        }
    )
}

exports.updateExistingUser = function(opts) {

    ng.utils.checkRequiredOptions(opts, ['oldUser', 'data', 'next'])

    var users = collections[USERS_COLLECTION]

    opts.oldUser.screen_name = opts.data.screen_name
    opts.oldUser.oauth_access_token = opts.data.oauth_access_token
    opts.oldUser.oauth_access_token_secret = opts.data.oauth_access_token_secret
    
    users.save(
        opts.oldUser, 
        function(err, docs) {
            if (err)
                opts.next(err, null)
            else
                opts.next(null, opts.oldUser)
        }
    )
}


exports.getUserById = function(opts) {
    
    ng.utils.checkRequiredOptions(opts, ['user_id', 'next'])
    
    var users = collections[USERS_COLLECTION]

    users.findOne({user_id: opts.user_id}, opts.next)
}


exports.getRecentTweets = function(opts) {
    
    ng.utils.checkRequiredOptions(opts, ['user_id', 'next'])

    var col = collections[TWEETS_COLLECTION]
      , selectCriteria = {}

    /*if (typeof opts.user_id !== 'string') {
        selectCriteria.for_user = opts.user_id.toString()
    } else {*/
        selectCriteria.for_user = opts.user_id
    //}

    if (opts.sinceId !== null && typeof opts.sinceId !== 'undefined') {
    console.log('SinceID: ')
    console.log(opts.sinceId)

    console.log('String sinceId: ' + opts.sinceId.toString())
        selectCriteria.id = {$gt: opts.sinceId}
    console.log('Select crit: ', selectCriteria)
    }

    //console.log('Selecting from DB: ', selectCriteria)

    col.find(
        selectCriteria,
        {
            limit: 300,
            sort: [['id', 'desc']]
        },
        function(err, cursor) {

            if(err) {
                ng.log.error(err, 'Error getting recent tweets from database.')
                opts.next(err, null)
                return
            }

            cursor.toArray(
                function(err, arr) {

                    if(err) {
                        ng.log.error(err, 'Error while converting cursor to array for getRecentTweets')
                        opts.next(err, null)
                        return
                    }
                    //console.log('Received ' + arr.length + ' tweets')

                    opts.next(null, arr)
                }
            )
        }
    )
}


function _isFieldPresent(elem, field_name) {

    // Not using coercion here, since -0, +0, NaN, false and empty strings
    // will fail the test
    if (elem[field_name] === undefined ||
        elem[field_name] === null) {

        return false
    }

    return true
}


function _saveTweetErrorHandler(err) {
    if (err) {
        ng.log.error(err, 'Error while saving a tweet')
    } else {
        ng.log.log('Saved tweet OK')
    }
}


function saveTweet(opts) {

    ng.utils.checkRequiredOptions(opts, ['tweet'])

    var col = collections[TWEETS_COLLECTION]
      , tweet = opts.tweet
      , next = opts.next || _saveTweetErrorHandler

    col.insert(tweet, next)
}


// 
// Saves either a tweet or an unknown object.
// Invoked from the stream receiving routine
//
exports.saveStreamItem = function(item) {

    var msg
      , for_user = (typeof item.for_user === 'string' ? 
                           item.for_user : 
                           item.for_user.toString())
    
    if (!_isFieldPresent(item, 'for_user')) {
        ng.log.error('No \'for_user\' field found in ' + JSON.stringify(item))
        return
    }

    if (!_isFieldPresent(item, 'message')) {
        ng.log.error('No \'message\' field found in ' + JSON.stringify(item))
        return
    }

    msg = item.message
    msg.for_user = for_user

    if(msg.user && msg.text) {

        msg.is_read = false

        saveTweet({
            tweet: msg, 
            next: function(err) {
                if (err) {
                    _saveTweetErrorHandler(err)
                    return
                }   

                ng.log.log('Saved tweet: \n' +
                           msg.user.screen_name +': ' +
                           msg.text)
            }
        })
    } else {
        //
        // Unknown type of message
        //
        exports.saveUnknown(msg, 
            function(err) {
                if (err) {
                    ng.log.error(err, 'Error while saving an unknown entity.')
                }
            }
        )

        ng.log.log('Saved unknown: ' + JSON.stringify(msg))
    }
}


exports.getLastTweetId = function(user_id, callback) {

    var col = collections[TWEETS_COLLECTION]

    col.find(
        {for_user: user_id},
        {limit: 1, sort: [['id', 'desc']]},

        function(err, cursor) {

            if (err) {
                ng.log.error(err, 'Error obtaining last tweet id for user ' + user_id)
                callback(err, null)
                return
            }

            cursor.toArray(
                function(err, arr) {
                    
                    var id = null

                    if (err) {
                        ng.log.error(err, 'Error converting cursor to array for user ' + user_id)
                        callback(err, null)
                        return
                    }
    
                    if (arr !== null && arr.length !== 0) {
                        id = arr[0].id_str
                    }

                    callback(null, id)
                }
            )
        }
    )

}


exports.storeNotification = function storeNotification(opts) {

    ng.utils.checkRequiredOptions(opts, ['notification'])

    opts.notification.is_read = false

    collections[NOTIF_COLLECTION].insert(opts.notification,
        function(err, doc) {
            if (err) {
                ng.log.error(err, 'Error saving notification')
            }

            if (opts.next) {
                opts.next(err, doc)
            }
        }
    )
}


exports.getNewNotifications = function getNewNotifications(opts) {

    ng.utils.checkRequiredOptions(opts, ['next'])

    collections[NOTIF_COLLECTION].find({is_read: false}, {},
        function(err, cursor) {
            
            if (err) {
                ng.log.error(err, 'Error while getting notifications')
                opts.next(err, null)
                return
            }

            cursor.toArray(
                function(err, arr) {
                    if (err) {
                        ng.log.error(err, 'Error while converting cursor to array for notificatios')
                        opts.next(err, null)
                        return
                    }

                    opts.next(null, arr)
                }
            )
        }
    )
}


exports.markNotificationsAsRead = function markNotificationsAsRead(opts) {

    ng.utils.checkRequiredOptions(opts, ['next', 'notifications'])

    var notifs = opts.notifications
      , lastNotif = notifs[notifs.length - 1]

    _(notifs).each(function(doc) {

        doc.is_read = true

        ng.log.log('Marking notification ID ' + doc.id + ' as read')

        collections[NOTIF_COLLECTION].save(doc, 

            function(err) {

                if (err) {
                    ng.log.error(err, 'Error when marking notification as read')
                    opts.next(err)
                    return
                }

                // Last element in the array?
                if (doc._id === lastNotif._id) {
                    opts.next(null)
                    return
                } else {
                    //console.log(doc._id + '!=' + lastNotif._id)
                }
            }
        )
    })    
}


exports.initDatabase = function(onDatabaseReady) {

    var collectionsCopy
      , colNames = ng.conf.collections


    if (!Array.isArray(colNames)) {
        throw {
              name: 'InvalidArgumentException'
            , message: 'collections parameter must be an array.'
            , stack: new Error().stack
        }
    }

    collectionsCopy = colNames.splice(0)

    //
    // Recursive function for initialising all collections
    // supplied in 'colNames' parameter
    //
    function _initCollections() {


        if(collectionsCopy.length === 0) {
            onDatabaseReady(null, db)
            return
        }

        var colName = collectionsCopy.pop(0)

        db.collection(
            colName, 
            function(err, collection) {
                if (err) {
                    onDatabaseReady(err)
                    return
                }

                collections[colName] = collection
                _initCollections()
            }
        )
    }

    db = new mongo.Db(
        ng.conf.databaseName,
        new mongo.Server(
            ng.conf.databaseHost, 
            ng.conf.databasePort, 
            {}
        ),
        {}
    )

    db.open(
        function(err, db) {
            if(err) {
                onDatabaseReady(err)
            }

            _initCollections()
        }
    )
}


//
// Exports
//

exports.getMongoStore = function() {
    return new mongoStore({
        host: ng.conf.databaseHost,
        port: ng.conf.databasePort,
        dbname: ng.conf.databaseName,
        collection: ng.conf.sessionStoreName
    })
}


exports.getUserTweetsCount = function getUserTweetsCount(opts) {
    ng.utils.checkRequiredOptions(opts, ['user_id', 'next'])
    collections[TWEETS_COLLECTION].count({'user.id_str': opts.user_id.toString()}, opts.next)
}

exports.collections = collections
