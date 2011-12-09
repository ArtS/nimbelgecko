var ng = require('nimblegecko'),
    login_required = ng.http.login_required;

exports.urls = [
    {
        url: '/login',
        view: ng.views.oauth.login
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
        url: '/home',
        view: login_required(ng.views.core.home),
        template: 'home.html'
    },
    {
        url: '/signout',
        view: ng.views.generic.signout
    }
];
