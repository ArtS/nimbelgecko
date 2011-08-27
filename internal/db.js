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


function _insertNewUser(options) {

    ng.utils.checkRequiredOptions(options, ['user', 'next'])

    var users = collections[USERS_COLLECTION]

    users.insert(
        new models.User(
            {
                user_id: options.user.user_id,
                screen_name: options.user.screen_name,
                oauth_access_token: options.user.oauth_access_token,
                oauth_access_token_secret: options.user.oauth_access_token_secret
            }
        ),
        function(err, doc) {
            if(err) {
                return options.next(err)
            }

            return options.next(null)
        }
    )
}

function _updateExistingUser(options) {
    
    ng.utils.checkRequiredOptions(options, ['user', 'existingUser', 'next'])

    var users = collections[USERS_COLLECTION]

    // TODO: refactor into for-in loop?
    options.existingUser.screen_name = options.user.screen_name
    options.existingUser.oauth_access_token = options.user.oauth_access_token
    options.existingUser.oauth_access_token_secret = options.user.oauth_access_token_secret
    
    users.save(
        options.existingUser, 
        function(err, docs) {
            if(err) {
                options.next(err)
                return
            }

            options.next(null)
        }
    )
}


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
                    return (typeof user.user_id !== 'undefined' &&
                            user.user_id !== null)
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


exports.saveUser = function(options) {

    ng.utils.checkRequiredOptions(options, ['user', 'next'])

    var users = collections[USERS_COLLECTION]

    // Check whether user's already registered
    exports.getUserById({
        userId: options.user.user_id,
        next: function(err, user) {

            if (err) {
                options.next(err)
                return                
            }

            if (typeof user === 'undefined' || user === null) {

                _insertNewUser(options)

            } else {

                _updateExistingUser({
                    user: options.user,
                    existingUser: user, 
                    next: options.next
                })

            }
        }
    })
}


exports.getUserById = function(options) {
    
    ng.utils.checkRequiredOptions(options, ['userId', 'next'])
    
    var users = collections[USERS_COLLECTION]

    users.findOne({user_id: options.userId}, options.next)
}


exports.getRecentTweets = function(options) {
    
    ng.utils.checkRequiredOptions(options, ['userId', 'next'])

    var col = collections[TWEETS_COLLECTION]
      , selectCriteria = {}

    if (typeof options.userId !== 'string') {
        selectCriteria.for_user = options.userId.toString()
    } else {
        selectCriteria.for_user = options.userId
    }

    if (typeof options.sinceId !== "undefined") {
        selectCriteria.id_str = {$gt: options.sinceId}
    }

    col.find(
        selectCriteria,
        {
            limit: 300,
            sort: [['id', 'desc']]
        },
        function(err, cursor) {

            if(err) {
                ng.log.error(err, 'Error getting recent tweets from database.')
                options.next(err, null)
                return
            }

            cursor.toArray(
                function(err, arr) {

                    if(err) {
                        ng.log.error(err, 'Error while converting cursor to array for getRecentTweets')
                        options.next(err, null)
                        return
                    }

                    options.next(null, arr)
                }
            )
        }
    )
}


function _isFieldPresent(elem, field_name) {

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


function saveTweet(options) {

    ng.utils.checkRequiredOptions(options, ['tweet'])
    

    var col = collections[TWEETS_COLLECTION]
      , tweet = options.tweet
      , next = options.next || _saveTweetErrorHandler

    col.find(

        { id_str: tweet.id_str }, {},

        function(err, cursor) {

            if(err) {
                ng.log.error(err, 'Error looking up tweet with ID ' + tweet.id_str)
                next(err)
                return
            }

            cursor.toArray(

                function(err, arr) {

                    if (err) {
                        ng.log.error(err, 'Error converting cursor to array for tweet with ID ' + tweet.id_str)
                        return
                    }

                    if(arr.length != 0) {
                        return
                    }

                    col.insert(tweet, next)
                }
            ) 
        }
    )
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

    if(msg.user !== undefined &&
       msg.text !== undefined) {

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
                        id = arr[0].id.toString()
                    }

                    callback(null, id)
                }
            )
        }
    )

}


function storeNotification(options) {

    ng.utils.checkRequiredOptions(options, ['notification'])

    options.notification.is_read = false

    collections[NOTIF_COLLECTION].insert(options.notification,
        function(err, doc) {
            if (err) {
                ng.log.error(err, 'Error saving notification')
            }

            if (options.next) {
                options.next(err, doc)
            }
        }
    )
}


function getNewNotifications(options) {

    ng.utils.checkRequiredOptions(options, ['next'])

    collections[NOTIF_COLLECTION].find({is_read: false}, {},
        function(err, cursor) {
            
            if (err) {
                ng.log.error(err, 'Error while getting notifications')
                options.next(err, null)
                return
            }

            cursor.toArray(
                function(err, arr) {
                    if (err) {
                        ng.log.error(err, 'Error while converting cursor to array for notificatios')
                        options.next(err, null)
                        return
                    }

                    options.next(null, arr)
                }
            )
        }
    )
}


function markNotificationsAsRead(options) {

    ng.utils.checkRequiredOptions(options, ['next', 'notifications'])

    var notifs = options.notifications
      , lastNotif = notifs[notifs.length - 1]

    _(notifs).each(function(doc) {

        doc.is_read = true

        ng.log.log('Marking notification ID ' + doc.id + ' as read')

        collections[NOTIF_COLLECTION].save(doc, 

            function(err) {

                if (err) {
                    ng.log.error(err, 'Error when marking notification as read')
                    options.next(err)
                    return
                }

                // Last element in the array?
                if (doc._id === lastNotif._id) {
                    options.next(null)
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
            onDatabaseReady(null)
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

exports.collections = collections

//TODO: move notification APIs into separate module
exports.getNewNotifications = getNewNotifications
exports.storeNotification = storeNotification
exports.markNotificationsAsRead = markNotificationsAsRead
