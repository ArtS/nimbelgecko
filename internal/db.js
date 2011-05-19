var mongo = require('mongodb'),
    ng = require('ng'),
    db = new mongo.Db(
        'nimblegecko',
        new mongo.Server(
            'localhost', 
            mongo.Connection.DEFAULT_PORT, {}
        ), 
        {}
    ),
    mongoStore = require('connect-mongodb'),
    log = require('log'),
    models = require('models'),
    USERS_COLLECTION = 'users',
    TWEETS_COLLECTION = 'tweets',
    OTHER_COLLECTION = 'other',
    collections = {};


function _insertNewUser(params, callback) {

    var users = collections[USERS_COLLECTION];

    users.insert(
        new models.User(
            {
                user_id: params.user_id,
                screen_name: params.screen_name,
                oauth_access_token: params.oauth_access_token,
                oauth_access_token_secret: params.oauth_access_token_secret
            }
        ),
        function(err, doc) {
            if(err) {
                return callback(err);
            }

            return callback(null);
        }
    );
}

function _updateExistingUser(params, doc, callback) {
    
    var users = collections[USERS_COLLECTION];

    doc.screen_name = params.screen_name;
    doc.oauth_access_token = params.oauth_access_token;
    doc.oauth_access_token_secret = params.oauth_access_token_secret;
    
    users.save(
        doc, 
        function(err, docs) {
            if(err) {
                callback(err);
                return;
            }

            callback(null);
        }
    );
}


function saveUnknown(item, callback) {
    var col = collections[OTHER_COLLECTION];
    col.insert(item, callback);
}


function saveTweet(tweet, callback) {

    var col = collections[TWEETS_COLLECTION];

    col.find(

        { id_str: tweet.id_str }, {},

        function(err, cursor) {

            if(err) {
                callback(err);
                return;
            }

            cursor.toArray(

                function(err, arr) {

                    if(arr.length != 0) {
                        return;
                    }

                    col.insert(tweet, callback);
                }
            ); 
        }
    );
}


function getAllUserIds(callback) {

    var users = collections[USERS_COLLECTION];

    users.find(
        function(err, cursor) {
            cursor.toArray(
                function(err, arr) {
                    var res = [],
                        i = 0,
                        length;

                    if (err) {
                        callback(err);
                        return;
                    }
                    
                    length = arr.length;
                    for (; i < length; i++) {
                        if (arr[i].user_id) {
                            res.push(arr[i].user_id);
                        }
                    }

                    callback(null, res);
                }
            );
        }
    );
}


function saveUserDetails(params, callback) {

    var users = collections[USERS_COLLECTION];

    // First, check whether we already have this user's profile.
    users.findOne(
        { user_id: params.user_id },
        function(err, doc) {
            if (err) {
                callback(err);
                return;                
            }

            if (typeof doc === 'undefined' || doc === null) {
                _insertNewUser(params, callback);
            } else {
                _updateExistingUser(params, doc, callback);
            }
        }
    );
}


function getRecentTweets(user_id, callback) {

    var col = collections[TWEETS_COLLECTION];

    if (typeof user_id !== 'string') {
        user_id = user_id.toString()
    }

    col.find(
        { 
            for_user: user_id 
        },
        { 
            limit: 300,
            sort: [['id', 'desc']]
        },
        function(err, cursor) {
            if(err) {
                callback(err, null);
                return;
            }

            cursor.toArray(
                function(err, arr) {
                    if(err) {
                        callback(err, null);
                        return;
                    }
                    
                    callback(null, arr);
                }
            );

        }
    );
}


function _isFieldPresent(elem, field_name) {

    if (elem[field_name] === undefined ||
        elem[field_name] === null) {

        return false;
    }

    return true;
}


// 
// Saves either a tweet or an unknown object.
// Invoked from the stream receiving routine
//
function saveStreamItem(item) {

    var msg
      , for_user = (typeof item.for_user === 'string' ? 
                           item.for_user : 
                           item.for_user.toString())
    
    if (!_isFieldPresent(item, 'for_user')) {
        ng.log.error('No \'for_user\' field found in ' + JSON.stringify(item));
        return;
    }

    if (!_isFieldPresent(item, 'message')) {
        ng.log.error('No \'message\' field found in ' + JSON.stringify(item));
        return;
    }

    msg = item.message
    msg.for_user = for_user

    if(msg.user !== undefined &&
       msg.text !== undefined) {

        msg.is_read = false

        saveTweet(msg, 
            function(err) {
                if (err) {
                    ng.log.error(err, 'Error while saving a tweet');
                }
            }
        );

        ng.log.log('Saved tweet: \n' +
                 msg.user.screen_name +': ' + 
                 msg.text);
    } else {
        //
        // Unknown type of message
        //
        saveUnknown(msg, 
            function(err) {
                if (err) {
                    ng.log.error(err, 'Error while saving an unknown entity.');
                }
            }
        );

        ng.log.log('Saved unknown: ' + JSON.stringify(msg));
    }
}


function getUserTokenSecret(user_id) {
    var users_col = collections[USERS_COLLECTION]

    users_col.find({user_id: user_id}, {},
        function (err, cursor) {
            
        }
    )
}


function getLastTweetId(user_id, callback) {

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

function initDatabase(colNames, onDatabaseReady) {

    var collectionsCopy;

    if (!Array.isArray(colNames)) {
        throw {
            name: 'InvalidArgumentException',
            message: 'collections parameter must be an array.' 
        };
    }

    collectionsCopy = colNames.splice(0);

    // Recursive function for initialising all the collections
    // supplied in 'colNames' parameter to initDatabase()
    function _initCollections() {
        var colName = collectionsCopy.pop(0);
        if(colName === undefined) {
            onDatabaseReady(null);
            return;
        }

        db.collection(
            colName, 
            function(err, collection) {
                if (err) {
                    onDatabaseReady(err);
                    return;
                }

                collections[colName] = collection;
                _initCollections();
            }
        );
    }

    db.open(
        function(err, db) {
            if(err) {
                onDatabaseReady(err);
            }

            _initCollections();
        }
    );
}


//
// Exports
//

exports.mongoStore = mongoStore({
    'collection': 'session_store',
})

exports.collections = collections
exports.initDatabase = initDatabase
exports.saveUserDetails = saveUserDetails
exports.getRecentTweets = getRecentTweets
exports.saveUnknown = saveUnknown
exports.saveTweet = saveTweet
exports.getAllUserIds = getAllUserIds
exports.saveStreamItem = saveStreamItem
exports.getLastTweetId = getLastTweetId
