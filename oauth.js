var conf = require('node-config'),
    oAuth = require('node-oauth').OAuth,
    URL = require('url'),
    util = require('util'),
    http_tools = require('http_tools');

function getAuth() {
    return new oAuth(
        'https://api.twitter.com/oauth/request_token',
        'https://api.twitter.com/oauth/access_token',
        conf.oauth_api_key,
        conf.oauth_secret,
        '1.0',
        null,
        'HMAC-SHA1'
    );
}

exports.getOAuthRequestToken = function(callback) {
    getAuth().getOAuthRequestToken({ oauth_callback: conf.oauth_callback_url }, callback);
}

exports.getOAuthAccessToken = function(oauth_token, oauth_token_secret, oauth_verifier, callback) {
    getAuth().getOAuthAccessToken(oauth_token, oauth_token_secret, oauth_verifier, callback);
} 

exports.redirectToTwitterAuth = function(res, oauth_token) {
    var url = URL.parse('http://api.twitter.com/oauth/authenticate');
    url.query = { oauth_token: oauth_token };
    http_tools.redirect(res, URL.format(url));
}
