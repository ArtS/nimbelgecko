var ng = require('ng'),
    login_required = ng.http.login_required;

exports.urls = [
    {
        url: '/register', 
        view: ng.views.oauth.register
    },
    {
        url: '/oauth/callback',
        view: ng.views.oauth.callback
    },
    {
        url: '/',
        view: ng.views.generic.root,
        template: 'index.html'
    },
    {
        url: '/error',
        view: ng.views.generic.error,
        template: 'index.html'
    },
    {
        url: '/home_old',
        view: login_required(ng.views.core.home_old),
        template: 'home.html'
    },
    {
        url: '/home',
        view: login_required(ng.views.core.home),
        template: 'home.html'
    },
    {
        url: '/ajax/tweets',
        view: login_required(ng.views.ajax.tweets)
    }
];
