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
    log = require('log');


exports.mongoStore = mongoStore;

exports.saveUserDetails = function(user_id, screen_name, oauth_access_token, oauth_access_token_secret) {
    // First, check whether we already have this user's profile.
    exports.collections['users'].find(
    );
    // 
}

exports.collections = {};

exports.initDatabase = function(collections, onDatabaseReady) {
    var _collectionsCopy;

    if (!Array.isArray(collections)) {
        throw {
            name: 'InvalidArgumentException',
            message: 'collections parameter must be an array.' 
        };
    }

    _collectionsCopy = collections.splice(0);

    // Recursive function for initialising all the collections
    // supplied in 'collections' parameter to initDatabase()
    function _initCollections() {
        var colName = _collectionsCopy.pop(0);
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

                exports.collections[colName] = collection;
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
