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
                return callback(err);
            }
            return callback(null);
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

// Exports

exports.mongoStore = mongoStore;
exports.collections = collections;
exports.initDatabase = initDatabase;
exports.saveUserDetails = saveUserDetails;
