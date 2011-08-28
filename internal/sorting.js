var ng = require('ng'),
    CATEGORY_ME = 'me',
    CATEGORY_LINK = 'link',
    CATEGORY_TEXT = 'text',
    CATEGORIES = [
        CATEGORY_ME,
        CATEGORY_LINK,
        CATEGORY_TEXT
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
    //  1. Replies to @user / @user being mentioned
    //  2. links
    //  3. plain text
    //
    
    var text = tweet.text,
        str_regex_reply = '^\\@' + user.screen_name + '.*',
        regexReply = new RegExp(str_regex_reply, 'gi'),
        regexMention = new RegExp('^.+\\@' + user.screen_name + '.*', 'gi'),
        regexLink = new RegExp('((?:https?|ftp)://[^\\s]*)', 'gi'),
        isReply = regexReply.test(text),
        isMention = regexMention.test(text),
        isFromMe = tweet.user.id_str === user.user_id
        isMe = isReply || isMention || isFromMe,
        isLink = regexLink.test(text),
        isPlainText = !isReply && !isMention && !isLink;

    if (isMe) {
        return CATEGORY_ME;
    }

    if (isLink) {
        return CATEGORY_LINK;
    }

    if (isPlainText) {
        return CATEGORY_TEXT;
    }
}


function sortTweets(tweets, user) {

    var sorted_tweets = getEmptyCollection(),
        length = tweets.length,
        i = 0,
        tweet;

    if (!user) {
        throw {
            name: 'NoArgumentException',
            message: 'User is not supplied'
        }
    }

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

exports.sortTweets = sortTweets
exports.CATEGORIES = CATEGORIES
exports.CATEGORY_ME = CATEGORY_ME
