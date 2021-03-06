var Users = require('./models/user'),
    Glossario = require('./models/glossario'),
    Article = require('./models/text'),
    Place = require('./models/place'),
    func = require('../config/functions'),
    facebook = require('../config/facebook.js'),
    fs = require("fs"),
    nodemailer = require("nodemailer");


    // BASE FUNCTIONS
    function parseDate(str) {
        var mdy = str.split('/');
        return new Date(mdy[2], mdy[1]-1, mdy[0]);
    }
    function daydiff(first, second) {
        return Math.round((second-first)/(1000*60*60*24)) + 1;
    }

// Session check function
var sessionReload = function(req, res, next){
    if('HEAD' == req.method || 'OPTIONS' == req.method){
        return next();
    }else{
        req.session._garbage = Date();
        req.session.touch();
    }
}

module.exports = function (app, passport, mongoose) {

    app.route('/')
    .get(function (req, res, next) {
        var user = req.user;
        if (!user) {
            res.render('index', { title: 'Nosso amigo - Fazemos ótimos WebSites' });
        } else {
            res.render('index', { title: 'Nosso amigo - Fazemos ótimos WebSites', user: user });
        }

    });

    app.get('/entrar', function (req, res) {
        var user = req.user;

        if (!user) {
            res.render('login', { title: "Nosso amigo Login" });
        } else {
            res.redirect('/painel');
        }
    });

    app.get('/painel', function (req, res) {
        var user = req.user;
        if (!user) {
            res.redirect('/entrar')
        } else {
            res.render('painel', { title: "Painel Nosso amigo", user: user});
        }
    });

    // CONTATOS
    app.get('/contatos', function (req, res) {
        var user = req.user;

        if (!user || user.status != 'admin') {
            res.redirect('/');
        } else {
            Users.find({ status: { $ne: 'admin'} }).exec(function (err, docs) {
                for (i = 0; i < docs.length; i++) {
                    var timeStamp = docs[i]._id.toString().substring(0, 8);
                    var date = new Date(parseInt(timeStamp, 16) * 1000);
                    docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                }
                res.render('contatos', { title: "Contatos", user: user, info: docs });
            });
        }

    });


    // PROFILE
    app.get('/perfil', function (req, res) {
        var user = req.user;

        if (!user || user.status != 'admin') {
            res.redirect('/');
        } else {
            res.render('profile', { title: "Nosso amigo - Editar Perfil", user: user })
        }
    });

    // BLOG ALL
    app.get('/textos', function (req, res) {
        var user = req.user;

        Article.find({ status: 'publicado' }).limit(20).exec(function (err, docs) {
            for (i = 0; i < docs.length; i++) {
                var timeStamp = docs[i]._id.toString().substring(0, 8);
                var date = new Date(parseInt(timeStamp, 16) * 1000);
                docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                docs[i].subtitle = Math.round(docs[i].subtitle);
                docs[i].short = docs[i].text;
            }
            res.render('textos', { title: "Nosso Amigo - Textos", user: user, info: docs });
        });

    });

    // BLOG NEW
    app.get('/criar', function (req, res) {
        var user = req.user;

        if (!user || user.status != 'admin') {
            res.redirect('/');
        } else {
            new Article({
                'author.name': user.name.first + " " + user.name.last,
                'author.main': user._id
            }).save(function (err, docs) {
                if (err) throw err;
                Users.find({}).exec(function(err2, users){
                    if (err2) throw err2;
                    res.render('novo', { title: "Novo Post", user: user, id: docs._id, edit: false, users: users });
                });
            });
        }
    });

    //BLOG SINGLE
    app.get('/textos/:nome', function (req, res) {
        var user = req.user;

        Article.find({ slug: req.params.nome }).exec(function (err, docs) {

            docs[0].text = decodeURIComponent(docs[0].text);
            docs[0].subtitle = Math.round(docs[0].subtitle);
            var date = docs[0].data;
            docs[0].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();

                Users.find({_id:{$in: docs[0].participantes}}).exec(function(err2, part){
                    console.log(part)
                    res.render('blogSingle', { title: "Nosso Amigo - " + docs[0].title, user: user, info: docs[0], single: true, participantes: part });
                });



        });
    });



    // BLOG EDIT
    app.get('/editar/:id', function (req, res) {
        var user = req.user;

        if (!user || user.status != 'admin') {
            res.redirect('/');
        } else {
            Article.find({ id: req.params.slug }).exec(function (err, docs) {
                Users.find({}).exec(function(err2, users){
                    var userId = [];
                    var userName = [];
                    for (i=0;i<users.length;i++){
                        userId.push(users[i].id)
                        userName.push(users[i].name.first + " " + users[i].name.last)
                    }
                    for (i = 0; i < docs.length; i++) {
                        var date = docs[0].data;
                        docs[i].date = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
                    }

                    docs[0].text = decodeURIComponent(docs[0].text);
                    res.render('novo', { title: "Novo Post", user: user, id: docs[0]._id, edit: true, info: docs[0], userId: userId, userName: userName });
                });
            });
        }
    });

    // SLUG CHECK
    app.get('/titleCheck/:id', function (req, res) {
        var user = req.user,
            id = req.params.id,
            check = req.query.check,
            title = req.query.title;
        slug = func.string_to_slug(decodeURIComponent(title.replace('<p>', '').replace('</p>', '')));
        console.log(check);
        console.log(slug);

        if (check == 'true') {
            Article.find({ _id: id }, function (err, docs) {
                if (docs[0].slug == slug) {
                    res.end('yes');
                } else {
                    Article.find({ slug: slug }, function (err, arts) {
                        if (arts.length > 0) {
                            res.end('no');
                        } else {
                            res.end('yes');
                        }
                    });
                }
            });
        } else {
            Article.find({ slug: slug }, function (err, arts) {
                if (arts.length > 0) {
                    res.end('no');
                } else {
                    res.end('yes');
                }
            });
        }
    });

    // UPLOAD DE IMAGENS DURANTE A CRIAÇÃO DE textos
    app.post('/artigoImage', function (req, res, next) {
        var user = req.user;
        console.log('chegou até aqui 1')
        var sendImg = req.files.file.name;

        if (user.status == 'admin') {
            // get the temporary location of the file
            var tmp_path = req.files.file.path;
            // set where the file should actually exists - in this case it is in the "images" directory
            var target_path = './public/uploads/' + sendImg;
            // move the file from the temporary location to the intended location
            fs.rename(tmp_path, target_path, function (err) {
                if (err) throw err;
                // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
                fs.unlink(tmp_path, function () {
                    if (err) throw err;
                    console.log('chegou até aqui 2')
                    res.send({ "url": "/uploads/" + sendImg });
                });
            });

        } else {
            res.send("não deu")
            console.log("não deu")
        }

    });

        // SALVAR NOVO ARTIGO
    app.post('/novoArtigo/:id', function (req, res) {
        var user = req.user;
        var id = req.params.id;

        if (user.status == 'admin') {

            Article.update({ _id: id }, { $set: { text: req.body.content} }, function (err) {
                if (err)
                    throw err
                res.send(JSON.stringify(req.body));
            });
        } else {
            res.redirect('/parceiros');
        }
    });

    // SALVAR NOVO TITULO
    app.post('/novoTitulo/:id', function (req, res) {
        var user = req.user;
        var id = req.params.id;

        if (user.status == 'admin') {

            Article.update({ _id: id }, { $set: { title: decodeURIComponent(req.body.content).replace('<p>', '').replace('</p>', '')} }, function (err) {
                if (err)
                    throw err
                res.send(decodeURIComponent(req.body.content).replace('<p>', '').replace('</p>', ''));
            });

        } else {
            res.redirect('/parceiros');
        }
    });


    // PUBLICAR ARTIGO
    app.post('/novoArtigo', function (req, res) {
        var user = req.user
            participantes = req.body.participantes,
            id = req.body.id,
            cover = req.body.cover,
            subtitle = req.body.subtitle,
            place = req.body.place,
            slug = func.string_to_slug(req.body.title),
            data = parseDate(req.body.dataEncontro);

        console.log(req.body.title);

        if (!user.status == 'admin') {
            res.redirect('/');
        } else {
            Article.update({ _id: id }, { $set: {
                status: 'publicado',
                participantes: participantes,
                subtitle: subtitle,
                slug: slug,
                cover: cover,
                place: place,
                data: data
            }
            }, function (err) {
                if (err)
                    throw err
                res.send('/textos/' + slug);
            });
        }
    });

    // DELETAR ARTIGO
    app.post('/deletarArtigo', function (req, res) {
        var user = req.user,
            id = req.body.id;

        if (!user || user.status != 'admin') {
            res.redirect('/');
        } else {
            Article.remove({ _id: id }).exec(function (err) {
                if (err)
                    throw err
                res.send("OK");
            });
        }
    });

    // UPDATE PROFILE
    app.post('/updateProfile', function (req, res) {
        var user = req.user,
            b = req.body;
            console.log(b.linkedin)
            if(b.linkedin == undefined){
                b.linkedin = " "
            }

        if (!user || user.status == 'admin') {
            Users.update({ _id: user.id }, { $set: {
                'name.first': b.firstname,
                'name.last': b.lastname,
                email: b.email,
                'localization.country': b.country,
                'social.facebook.url': b.facebook,
                'social.twitter.url': b.twitter,
                'social.linkedin.url': b.linkedin,
                bio: b.bio
            }
            }, function (err) {
                if (err)
                    throw err
                res.redirect('/painel');
            })
        } else {

        }
    });

    // CHANGE STATUS
    app.post('/changeStatus', function (req, res) {
        var user = req.user;
        var status = req.body.status;
        var id = req.body.id;

        if (!user || user.status != 'admin') {
            res.redirect('/');
        } else {
            Orcamento.update({ _id: id }, { $set: { status: status} }, function (err) {
                if (err)
                    throw err
                res.send("OK");
            });
        }
    });


    //SIGNUP EMAIL
    app.post('/signupEmail', function (req, res) {
        var form = req.body.email;

        new Users({
            status: "Lead",
            'name.loginName': func.randomString(),
            email: form
        }).save(function (err, docs) {
            if (err)
                throw err
            res.send('OK');
        });
    });

    //SIGNUP EMAIL
    app.post('/contact', function (req, res) {
        var nome = req.body.name,
            email = req.body.email,
            message = req.body.message;

        new Users({
            status: "Info",
            'name.loginName': func.string_to_slug(nome),
            email: email,
            'name.first': nome,
            message: message
        }).save(function (err, docs) {
            if (err)
                throw err
            res.send("10");
        });
    });


    // =====================================
    // USER SIGNUP =========================
    // ===================================== I should later find a way to pass params to the jade file here and put values on the inputs
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/', // redirect to the secure profile section
        failureRedirect: '/registrar', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    app.get('/registrar', function (req, res) {
        var user = req.user;
        if (!user) {
            res.render("signup", { title: "Nosso amigo - Registrar", message: req.flash('signupMessage') });
        } else {
            res.redirect("/");
        }
    });



    // =====================================
    // LOG IN ==============================
    // =====================================
    app.get('/login', function (req, res) {
        var user = req.user;
        if (!user) {
            res.render("login", { message: req.flash('loginMessage') });
            if (req.url === '/favicon.ico') {
                r.writeHead(200, { 'Content-Type': 'image/x-icon' });
                return r.end();
            }
        } else {
            res.redirect("/");
        }
    });


    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email'}));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect: '/facebook',
            failureRedirect: '/'
        })
    );

    // =====================================
    // TWITTER ROUTES ======================
    // =====================================
    // route for twitter authentication and login
    app.get('/auth/twitter', passport.authenticate('twitter'));

    // handle the callback after twitter has authenticated the user
    app.get('/auth/twitter/callback',
        passport.authenticate('twitter', {
            successRedirect: '/profile',
            failureRedirect: '/'
        })
    );

    // =====================================
    // GOOGLE ROUTES =======================
    // =====================================
    // send to google to do the authentication
    // profile gets us their basic information including their name
    // email gets their emails
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email', 'openid'] }));

    // the callback after google has authenticated the user
    app.get('/auth/google/callback',
        passport.authenticate('google', {
            successRedirect: '/profile',
            failureRedirect: '/'
        })
    );


    // =============================================================================
    // AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
    // =============================================================================

    // facebook -------------------------------

    // send to facebook to do the authentication
    app.get('/connect/facebook', passport.authorize('facebook', { scope: ['email', 'user_about_me',
    'user_birthday ', 'user_hometown', 'user_website']
    }));

    // handle the callback after facebook has authorized the user
    app.get('/connect/facebook/callback',
            passport.authorize('facebook', {
                successRedirect: '/facebook',
                failureRedirect: '/'
            })
        );

    // twitter --------------------------------

    // send to twitter to do the authentication
    app.get('/connect/twitter', passport.authorize('twitter', { scope: 'email' }));

    // handle the callback after twitter has authorized the user
    app.get('/connect/twitter/callback',
            passport.authorize('twitter', {
                successRedirect: '/profile',
                failureRedirect: '/'
            })
        );


    // google ---------------------------------

    // send to google to do the authentication
    app.get('/connect/google', passport.authorize('google', { scope: ['profile', 'email', 'openid'] }));

    // the callback after google has authorized the user
    app.get('/connect/google/callback',
        passport.authorize('google', {
            successRedirect: '/profile',
            failureRedirect: '/'
        })
    );


    // =============================================================================
    // UNLINK ACCOUNTS =============================================================
    // =============================================================================
    // facebook -------------------------------
    app.get('/unlink/facebook', function (req, res) {
        var user = req.user;
        user.social.facebook.token = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    });


    // ADD FACEBOOK FRIENDS
    app.get('/facebook', function (req, res) {
        var user = req.user;
        facebook.getFbData(user.social.facebook.token, '/me/friends', function (data) {
            var friend = eval("(" + data + ")")
            Users.update({ _id: user._id }, { $pushAll: { 'social.facebook.friends': friend.data} }, function (err) {
                res.redirect('/');
            });
        });
    });

    // twitter --------------------------------
    app.get('/unlink/twitter', function (req, res) {
        var user = req.user;
        user.social.twitter.token = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    });

    // google ---------------------------------
    app.get('/unlink/google', function (req, res) {
        var user = req.user;
        user.social.google.token = undefined;
        user.save(function (err) {
            res.redirect('/profile');
        });
    });

    // =====================================
    // delete USER =========================
    // =====================================
    app.put('/users/delete', function (req, res) {
        Users.update(
            { 'name.loginName': req.user.name.loginName },
            { $set: {
                deleted: true
            }
            },
            function (err) {
                res.redirect('/logout')
            }
        );
    });

    // =====================================
    // RESTORE USER ========================
    // =====================================
    app.get('/users/restore', function (req, res) {
        user = req.user;
        res.render('profile/restore', { user: user });
    });

    app.put('/users/restore', function (req, res) {
        Users.update(
            { 'name.loginName': req.user.name.loginName },
            { $set: {
                deleted: false
            }
            },
            function (err) {
                res.redirect('/profile')
            }
        );
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });


    function isLoggedIn(req, res, next) {

        // if user is authenticated in the session, carry on
        if (req.isAuthenticated())
            return next();

        // if they aren't redirect them to the home page
        res.redirect('/');
    }

}
