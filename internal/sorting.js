var ng = require('ng'),
    CATEGORIES = [
        'reply',
        'mention',
        'link',
        'text'
    ];


function formatLinks(text) {
    var r = new RegExp("((?:https?|ftp)://[^\\s]*)", "gi");
    return text.replace(r, '<a href="$1">$1</a>');
}


function escapeText(text) {
    return formatLinks(text.replace('<', '&lt;').replace('>', '&gt'));
}


function getEmptyCollection() {
    var res = {},
        i = CATEGORIES.length;
    
    for(;i--;) {
        res[CATEGORIES[i]] = [];
        res[CATEGORIES[i]].unread_count = 0;
    }

    return res;
}


function tagSingleTweet(tweet, user) {

    // 
    // Categories
    //
    //  1. Replies to @user
    //  2. @user being mentioned
    //  3. links
    //  4. plain text
    //
    
    var text = tweet.text,
        user = user || { screen_name: ''};
        str_regex_reply = '^\\@' + user.screen_name + '.*',
        regexReply = new RegExp(str_regex_reply, 'gi'),
        regexMention = new RegExp('^.+\\@' + user.screen_name + '.*', 'gi'),
        regexLink = new RegExp('((?:https?|ftp)://[^\\s]*)', 'gi'),
        isReply = regexReply.test(text),
        isMention = regexMention.test(text),
        isLink = regexLink.test(text),
        isPlainText = !isReply && !isMention && !isLink;

        // console.log(str_regex_reply);

    if (isReply) {
        return 'reply';
    }

    if (isMention) {
        return 'mention';
    }

    if (isLink) {
        return 'link';
    }

    if (isPlainText) {
        return 'text';
    }
}


function sortTweets(tweets, user) {

    var sorted_tweets = getEmptyCollection(),
        length = tweets.length,
        i = 0,
        tweet;

    for (; i < length; i++) {
        tweet = tweets[i];
        tweet.escaped_text = escapeText(tweet.text);
        tag = tagSingleTweet(tweet, user);
        sorted_tweets[tag].push(tweet);
        if (tweet.is_read === false) {
            sorted_tweets[tag].unread_count += 1;
        }
    }

    return sorted_tweets;
}

exports.sortTweets = sortTweets;
exports.CATEGORIES = CATEGORIES;
