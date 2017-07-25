var jade = require("jade");
var db = require("./db");

module.exports = function (viewsPath) {
    return {
        io: null,

        games: {},
        rooms: {},

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