$(document).ready(function() {

    var isLoaded = false
      , TweetModel = Backbone.Model.extend({})
      , Collection = Backbone.Collection.extend({
                          model: TweetModel,
                     })

      , tweetTemplateElem = $('#tweetTemplate')
      , singleTweetDirective = {
            'li': {
                'tweet<-tweets': {
                    'a.avatar-link@href': 'http://twitter.com/#!#{tweet.user.screen_name}',
                    'div.avatar@style': function(ctx) {
                        return 'background-image: url(' + ctx.item.user.profile_image_url + ')'
                    },
                    '.text': function(ctx) {
                        return decodeURIComponent(escape(ctx.item.text))
                    },
                    '.sender a@href': 'http://twitter.com/#!#{tweet.user.screen_name}/statuses/#{tweet.id_str}',
                    '.sender a.screen-name': '#{tweet.user.name}',
                    '.sender a.name': '@#{tweet.user.screen_name}'
                    /*'.sender a.screen-name': '@#{tweet.user.screen_name}',
                    '.sender a.name': '#{tweet.user.name}'*/
                }
            }
        }
      , renderSingleTweet = tweetTemplateElem.compile(singleTweetDirective)
      , View = Backbone.View.extend({

            templateElem: $('#sectionsDiv'),

            render: function() {

                var directives = {

                        'div.fourcol' : {

                            'coll<-collections': {

                                'h3': function(arg) {
                                    if (typeof arg.coll.item.attributes.screen_name !== 'undefined') {
                                        return arg.coll.item.attributes.screen_name
                                    } else {
                                        return arg.coll.item.attributes.key
                                    }
                                },

                                'ul@id+': 'coll.attributes.key',

                                'ul': function(ctx) {
                                    return renderSingleTweet({tweets: ctx.item.attributes.tweets})
                                },

                                '@class+': function(arg) {
                                    return arg.pos + 1 == arg.length ? ' last' : ''
                                }
                            }
                        }
                    }
                , compiled = $p(this.templateElem).compile(directives)

                $(this.el).html(compiled({collections: this.models.toArray()}))
            }
        })
      , ctrl

    window.view = new View()

    function onTweetsLoaded(data) {
        if (data.error) {
            alert(data.error)
            return
        }

        if (typeof data.data === 'undefined' ||
            data.data === null ||
            data.data.length === 0) {
            return
        }

        if (isLoaded) {

            _(data.data).each(function(data) {
                var type = data.key
                  , messages = data.tweets
                  , section

                section = $('#' + 'type_' + type)
                section.prepend(renderSingleTweet({tweets: messages}))
            })

            return
        }

        isLoaded = true

        window.view.models = new Collection(data.data)
        window.view.render()

        $(window.view.el).hide()
        $('#sectionsPlaceholder').fadeOut('slow')
        $('#sectionsPlaceholder').replaceWith(window.view.el)
        $(window.view.el).fadeIn('slow')
    }

    $(document).ready(

        function() {

            //TODO: replace with string from config
            var socket = io.connect('http://reader.nimblegecko.com', {
                    rememberTransport: false/*,
                    transports: ['websocket', 'flashsocket', 'htmlfile', 'xhr-multipart', 'xhr-polling']*/
                })

            socket.on('connect', function() {
            })

            socket.on('message',
                function(data) {
                    onTweetsLoaded(data)
                }
            )
        }
    )
})
