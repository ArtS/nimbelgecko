exports.templates = require('templates');
exports.oauth = require('oauth');
exports.conf = require('node-config');
exports.db = require('db');
exports.http = require('http_tools');
exports.log = require('log');
exports.session = require('session');

exports.views = {};
exports.views.oauth = require('./views/oauth');
exports.views.generic = require('./views/generic');
