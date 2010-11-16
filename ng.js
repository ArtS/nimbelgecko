exports.templates = require('templates');
exports.oauth = require('oauth');
exports.conf = require('node-config');
exports.db = require('db');
exports.http = require('./internal/http');
exports.log = require('log');
exports.session = require('session');

exports.views = {};
exports.views.oauth = require('./views/oauth');
exports.views.core = require('./views/core');
exports.views.generic = require('./views/generic');
