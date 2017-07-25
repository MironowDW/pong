var jade = require("jade");
var shortid = require('shortid');
var emitter = require('./emitter');
var UserModel = require("./user").User;

module.exports = function (viewsPath, db) {
    return {
        io: null,

        userLastId: 1,
        users: {},

        games: {},
        rooms: {},

        user: {

            /**
             * @returns {User[]}
             */
            findOnline: function () {
                var dbUsers = db.user().find({status: 'online'});
                var users = [];

                for (var i in dbUsers) {
                    users.push(this.wrap(dbUsers[i]));
                }

                return users;
            },

            /**
             * @returns {User}
             */
            findById: function(id) {
                return this.wrap(db.user().get(id));
            },

            /**
             * @returns {User}
             */
            findByHash: function(hash) {
                return this.wrap(db.user().findOne({hash: hash}));
            },

            /**
             * @returns {User}
             */
            findBySocketId: function (socketId) {
                return this.wrap(db.user().findOne({socketId: socketId}));
            },

            /**
             * @returns {User}
             */
            generate: function () {
                var dbUser = db.user().insert({
                    name: 'без имени',
                    hash: shortid.generate(),
                    avatar: '',
                    status: 'online',
                    socketId: null
                });
                var user = this.wrap(dbUser);

                emitter.event('user.add', {
                    id: user.id,
                    'online-item': jade.renderFile(viewsPath + '/user/online-item.jade', {user: user})
                });

                return user;
            },

            /**
             * @returns {User}
             */
            update: function (id, data) {
                var dbUser = db.user().get(id);
                var emit = false;
                if (!dbUser) {
                    throw 'Пользователь не найден';
                }

                if (data.name && data.name != dbUser.name) {
                    dbUser.name = data.name;
                    emit = true;
                }

                if (data.avatar && data.avatar != dbUser.avatar) {
                    dbUser.avatar = data.avatar;
                    emit = true;
                }

                if (data.status && data.status != dbUser.status) {
                    dbUser.status = data.status;
                    emit = true;
                }

                if (data.socketId && data.socketId != dbUser.socketId) {
                    dbUser.socketId = data.socketId;
                }

                db.user().update(dbUser);

                if (emit) {
                    emitter.event('user.changed', {
                        user: {
                            id: id,
                            status: dbUser.status
                        },
                        'online-item': jade.renderFile(viewsPath + '/user/online-item.jade', {user: dbUser})
                    });
                }

                return this.wrap(dbUser);
            },

            /**
             * @returns {User}
             */
            wrap: function (dbUser) {
                if (!dbUser) {
                    return null;
                }

                var model = new UserModel();
                model.id = dbUser['$loki'];
                model.name = dbUser.name;
                model.avatar = dbUser.avatar;
                model.status = dbUser.status;
                model.hash = dbUser.hash;
                model.socketId = dbUser.socketId;

                return model;
            }
        },

        addGame: function (game) {
            this.games[game.id] = game;

            this.event('game.add', {
                id: game.id,
                item: jade.renderFile(viewsPath + '/game/list-item.jade', {game: game})
            });

            return game;
        },
        getGame: function (id) {
            return this.games[id];
        },
        updateGame: function (id, data) {
            var game = this.getGame(id);

            if (!game) {
                return;
            }

            // Нечего изменять
            if (game.setting.access == data.setting.access) {
                return;
            }

            game.setting.access = data.setting.access;

            this.event('game.setting.changed', {
                id: id,
                item: jade.renderFile(viewsPath + '/game/list-item.jade', {game: game})
            });
        },

        emits: [],
        setIo: function (io) {
            this.io = io;

            for (var i in this.emits) {
                this.event(this.emits[i].event, this.emits[i].message);
            }
        },
        event: function (event, message) {
            if (!this.io) {
                this.emits.push({event: event, message: message});
                return;
            }

            this.io.sockets.emit(event, message);
        }
    };
};