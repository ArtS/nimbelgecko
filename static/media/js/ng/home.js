$(document).ready(function() {

    var isLoaded = false
        , socket = new io.Socket(null, {port: 8081, rememberTransport: false})
        , TweetModel = Backbone.Model.extend({
                            markAsRead: function() {
                                this.set({is_read: true});
                            }
                        })

        , Collection = Backbone.Collection.extend({
                            model: TweetModel,
                        })

        , View = Backbone.View.extend({

                templateElem: $('#sectionsDiv'),
                tweetTemplateElem : $('#tweetTemplate'),
                
                render: function() {

                    var singleTweetDirective = 
                        {
                            'li': {
                                'tweet<-tweets': {
                                    'span.text': 'tweet.escaped_text',
                                    'span.tweet-link a@href':
                                    'http://twitter.com/#{tweet.user.screen_name}/statuses/#{tweet.id_str}',
                                    'span.tweet-link a': '@#{tweet.user.screen_name}'
                                }
                            }
                        }
                      , singleTweetF = this.tweetTemplateElem.compile(singleTweetDirective)
                      , directives = {

                            'div.fourcol' : {

                                'coll<-collections': {

                                    'header div.left h3': 'coll.attributes.0',
                                    'header div.right a.tiny-action@href+': 'coll.attributes.0',

                                    'ul@id+': 'coll.attributes.0', 

                                    'ul': function(ctx) {
                                        debugger
                                        return singleTweetF({tweets: ctx.item.attributes[1]})
                                    },

                                    '@class+': function(arg) {
                                        return arg.pos + 1 == arg.length ? ' last' : ''
                                    }
                                }
                            }
                        }
                    , compiled = $p(this.templateElem).compile(directives);

                    $(this.el).html(compiled({collections: this.models.toArray()}));
                }
            })
        , ctrl;

    window.view = new View();

    function onTweetsLoaded(data) {
        if (data.error) {
            alert(data.error)
            return
        }

        if (isLoaded) {
            console.log(data);
            return
        }

        isLoaded = true;
        window.view.models = new Collection(data.data);
        window.view.render();
        $('#sectionsPlaceholder').replaceWith(window.view.el);
    }

    $(document).ready(

        function() {

            socket.on('connect',
                function() {
                    console.log(arguments);
                    //socket.send({data: 'zomg wtf!'});
                }
            );

            socket.on('message',
                function(data) {
                    onTweetsLoaded(data);
                    console.log(arguments);
                }
            );

            socket.connect();

        }
    );

    /*
    Controller = Backbone.Controller.extend({
        routes: {
            'home': 'home',
            'actions/mark-read/:id': 'markRead'
        },

        home: function() {
            console.log('home');
        },

        markRead: function(id) {
            console.log('Mark read: ' + id);
        }
    });

    ctrl = new Controller();

    $(document).ready(
        function() {
            Backbone.history.start();
        }
    );
    */

});
