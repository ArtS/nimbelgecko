exports.templates = require('templates');
exports.oauth = require('oauth');
exports.conf = require('node-config');
exports.db = require('db');
exports.http_tools = require('http_tools');
exports.log = require('log');

exports.views = {};
exports.views.oauth = require('./views/oauth');
