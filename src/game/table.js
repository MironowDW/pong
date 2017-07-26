var userTable = require('../user/table');
var render = require('../common/render');
var emitter = require('../common/emitter');
var db = require('../common/db');

exports.createGame = function (user) {
    var dbGame = db.game().insert({
        userId1: user.id,
        userId2: null,
        status: 'new'
    });
    var game = wrap(dbGame);

    emitter.event('game.add', {
        id: game.id,
        item: render.file('/game/list-item.jade', {game: game})
    });

    return game;
};

exports.findById = function (id) {
    return wrap(db.game().get(id));
};

exports.findAll = function () {
    var dbGames = db.game().find();
    var games = [];

    for (var i in dbGames) {
        games.push(wrap(dbGames[i]));
    }

    return games;
};

exports.update = function (id, data) {
    var dbGame = db.game().get(id);
    var emit = false;
    if (!dbGame) {
        return;
    }

    if (data.userId2) {
        dbGame.userId2 = data.userId2;
        emit = true;
    }

    if (data.status) {
        dbGame.status = data.status;
        emit = true;
    }

    var game = wrap(db.game().update(dbGame));

    if (emit) {
        emitter.event('game.change', {
            id: game.id,
            item: render.file('/game/user2-item.jade', {game: game})
        });
    }

    return game;
};

wrap = function (dbGame) {
    if (!dbGame) {
        return null;
    }

    var game = new Game();
    game.id = dbGame['$loki'];
    game.userId1 = dbGame.userId1;
    game.userId2 = dbGame.userId2;
    game.status = dbGame.status;

    return game;
};

function Game() {
    return {
        id: null,
        userId1: null, // Создатель
        userId2: null,
        user1: function () {
            return this.userId1 ? userTable.findById(this.userId1) : {};
        },
        user2: function () {
            return this.userId2 ? userTable.findById(this.userId2) : {};
        },
        status: 'new'
    };
}