var mongo = require('node-mongodb-native/lib/mongodb'),
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

function getRecentTweets(user_id, callback) {

    var col = collections[TWEETS_COLLECTION];

    col.find(
        { 
            owner_id: user_id 
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


//
// Exports
//

exports.mongoStore = mongoStore;
exports.collections = collections;
exports.initDatabase = initDatabase;
exports.saveUserDetails = saveUserDetails;
exports.getRecentTweets = getRecentTweets;
exports.saveUnknown = saveUnknown;
exports.saveTweet = saveTweet;
exports.getAllUserIds = getAllUserIds;
