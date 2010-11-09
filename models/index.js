var User = function(params) {
    if(!(this instanceof User)) {
        return new User(params);
    }

    this.user_id = params.user_id;
    this.screen_name = params.screen_name;
    this.oauth_access_token = params.oauth_access_token;
    this.oauth_access_token_secret = params.oauth_access_token_secret;
}

exports.User = User;
