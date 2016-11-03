// config/database.js
var express = require('express'),
    app = express();

if('development' == app.get('env')) {
    module.exports = {

        'facebookAuth' : {
            'clientID' 		: '1662382147405788', // your App ID
            'clientSecret' 	: '67dc52d5d0c9a6e0b2afbd3c7318277b', // your App Secret
            'callbackURL' 	: 'http://localhost:3000/auth/facebook/callback'
        },

        'twitterAuth' : {
            'consumerKey' 		: 'd7Nm9kGmddTbp8bVPd3IRWpAq',
            'consumerSecret' 	: 'x2FJbmrix0HaHd0HXWpw5mLVbRvmalCnWLc83bxv481KMd9QeL',
            'callbackURL' 		: 'http://localhost:3000/auth/twitter/callback'
        },

        'googleAuth' : {
            'clientID' 		: '255367409904.apps.googleusercontent.com',
            'clientSecret' 	: '99dda7gFKNaONJL6rg23odNZ',
            'callbackURL' 	: 'http://localhost:3000/auth/google/callback'
        }

    };
}else{
    module.exports = {

        'facebookAuth' : {
            'clientID' 		: '1662382147405788', // your App ID
            'clientSecret' 	: '67dc52d5d0c9a6e0b2afbd3c7318277b', // your App Secret
            'callbackURL' 	: 'http://nossoamigo.org/auth/facebook/callback'
        },

        'twitterAuth' : {
            'consumerKey' 		: 'd7Nm9kGmddTbp8bVPd3IRWpAq',
            'consumerSecret' 	: 'x2FJbmrix0HaHd0HXWpw5mLVbRvmalCnWLc83bxv481KMd9QeL',
            'callbackURL' 		: 'http://www.gueime.com.br/auth/twitter/callback'
        },

        'googleAuth' : {
            'clientID' 		: '255367409904.apps.googleusercontent.com',
            'clientSecret' 	: '99dda7gFKNaONJL6rg23odNZ',
            'callbackURL' 	: 'http://www.gueime.com.br/auth/google/callback'
        }

    };
}

// config/auth.js

// expose our config directly to our application using module.exports
