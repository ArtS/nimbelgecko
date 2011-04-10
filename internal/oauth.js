var oAuth = require('node-oauth').OAuth,
    URL = require('url'),
    util = require('util'),
    ng = require('ng');

function getAuth() {
    return new oAuth(
        'https://api.twitter.com/oauth/request_token',
        'https://api.twitter.com/oauth/access_token',
        ng.conf.oauth_api_key,
        ng.conf.oauth_secret,
        '1.0',
        null,
        'HMAC-SHA1'
    );
}

exports.getOAuthRequestToken = function(callback) {
    var callback_url = {
                            protocol: 'http',
                            hostname: ng.conf.server_ip,
                            port: ng.conf.server_port,
                            pathname: ng.conf.oauth_callback_url 
                       }
    getAuth().getOAuthRequestToken({oauth_callback: URL.format(callback_url)},
                                   callback);
}

exports.getOAuthAccessToken = function(oauth_token, oauth_token_secret, oauth_verifier, callback) {
    getAuth().getOAuthAccessToken(oauth_token, oauth_token_secret, oauth_verifier, callback);
} 

exports.redirectToTwitterAuth = function(res, oauth_token) {
    var url = URL.parse('http://api.twitter.com/oauth/authenticate');
    url.query = { oauth_token: oauth_token };
    ng.http.redirect(res, URL.format(url));
}
