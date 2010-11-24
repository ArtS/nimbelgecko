var ng = require('ng');

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
        url: '/home',
        view: ng.views.core.home,
        template: 'home.html'
    },
    {
        url: '/action/mark-all-read/:category',
        view: ng.views.actions.mark_all_read
    }
];
