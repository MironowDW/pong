var jade = require("jade");

module.exports = function (app) {
    return {
        io: null,

        userLastId: 1,
        users: {},

        games: {},
        rooms: {},

        getUser: function (hash) {
            return this.users[hash];
        },
        getHashBySocketId: function (socketId) {
            for (var hash in this.users) {
                if (this.users[hash].socketId == socketId) {
                    return hash;
                }
            }

            return null;
        },
        getUserBySocketId: function (socketId) {
            for (var hash in this.users) {
                if (this.users[hash].socketId == socketId) {
                    return this.users[hash];
                }
            }

            return null;
        },
        getUserById: function (id) {
            for (var hash in this.users) {
                if (this.users[hash].id == id) {
                    return this.users[hash];
                }
            }

            return null;
        },
        updateUser: function (hash, data) {
            if (data.name) {
                this.users[hash].name = data.name;
            }
            if (data.avatar) {
                this.users[hash].avatar = data.avatar;
            }

            var user = this.users[hash];

            this.event('user.changed', {
                id: user.id,
                'online-item': jade.renderFile(app.get('views') + '/user/online-item.jade', {user: user})
            });
        },
        addUser: function (hash, user) {
            user.id = this.userLastId;
            this.userLastId++;

            this.users[hash] = user;

            this.event('user.add', {
                id: user.id,
                'online-item': jade.renderFile(app.get('views') + '/user/online-item.jade', {user: user})
            });

            return user;
        },
        userOffline: function (user) {
            user.status = 'offline';
            this.event('user.offline', user);
        },

        addGame: function (game) {
            this.games[game.id] = game;

            this.event('game.add', {
                id: game.id,
                item: jade.renderFile(app.get('views') + '/game/list-item.jade', {game: game})
            });

            return game;
        },
        getGame: function (id) {
            return this.games[id];
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