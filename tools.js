#!/usr/bin/env node


var ng = require('nimblegecko')
  , runChain = require('node-chain').runChain
  , _ = require('underscore')

runChain([
    {
        target: ng.conf.initConfig,
        errorHandler: function(err) {
            ng.log.error(err, 'Config initialisation failed.')
        }
    },
    {
        target: ng.db.initDatabase,
        errorHandler: function(err) {
            ng.log.error(err, 'Database initialisation failed.')
        }
    },
    {
        target: function() {
            ng.db.getAllUsers(function(err, arr) {
                _(arr).each(function(user) {
                    console.log('@'+user.screen_name)
                })
            })
        }
    }
])
