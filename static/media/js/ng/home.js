$(document).ready(function() {

    var isLoaded = false
      , TweetModel = Backbone.Model.extend({
                          markAsRead: function() {
                              this.set({is_read: true})
                          }
                      })

      , Collection = Backbone.Collection.extend({
                          model: TweetModel,
                     })

      , tweetTemplateElem = $('#tweetTemplate')
      , singleTweetDirective = {
            'li': {
                'tweet<-tweets': {
                    'span.text': 'tweet.escaped_text',
                    'span.tweet-link a@href':
                    'http://twitter.com/#{tweet.user.screen_name}/statuses/#{tweet.id_str}',
                    'span.tweet-link a': '@#{tweet.user.screen_name}'
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

                                'header div.left h3': function(arg) {
                                    if (typeof arg.coll.item.attributes.screen_name !== 'undefined') {
                                        return arg.coll.item.attributes.screen_name
                                    } else {
                                        return arg.coll.item.attributes.key
                                    }
                                },
                                'header div.right a.tiny-action@href+': 'coll.attributes.key',

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

            _(data.data).each(function(tweets) {
                var type = tweets[0]
                  , messages = tweets[1]
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

            var socket = io.connect(null, {
                  rememberTransport: false,
                  transports: [/*'websocket', 'flashsocket',*/ 'htmlfile', 'xhr-multipart', 'xhr-polling']
                })

            socket.on('connect',
                function() {
                    console.log('connect', arguments)
                    //socket.send({data: 'zomg wtf!'})
                }
            )

            socket.on('message',
                function(data) {
                    onTweetsLoaded(data)
                    console.log('data', arguments)
                }
            )

            //socket.connect()
        }
    )
})
