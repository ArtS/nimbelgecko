#!/usr/bin/env node

var mongo = require('mongodb')


db = new mongo.Db(
    'nimblegecko',
    new mongo.Server(
        '127.0.0.1',
        27017,
        {}
    ),
    {}
)

function init() {
    db.open(function(err, db) {
        if(err) {
            console.log(err)
            return
        }
        db.collection('tweets', findTopTen)
    })
}

function findTopTen(err, col) {

    col.find(
        {
            for_user: '20937471'
        },
        {limit: 10, sort: [['id', 'desc']]},
        function(err, cursor) {

            cursor.toArray(
                function(err, arr) {
                    findGreaterThan(col, arr)
                }
            )
        }
    )
}

function findGreaterThan(col, arr) {

    console.log('Two topmost IDs: ')
    console.log(arr[0].id.toString())
    console.log(arr[1].id.toString())

    // This should return only the first element in arr,
    // theoretically
    col.find(
        {
            for_user: '20937471',
            id: {$gt: arr[1].id}
        },
        {limit: 10, sort: [['id', 'desc']]},
        function(err, cursor) {
            cursor.toArray(
                function(err, arr) {
                    // Although it return nothing
                    console.log(arr)
                }
            )
       }
   )
}

init()
