var userTable = require('../user/table');
var render = require('../common/render');
var emitter = require('../common/emitter');
var db = require('../common/db');

exports.createGame = function (user) {
    var dbGame = db.game().insert({
        userId1: user.id,
        userId2: null,
        userReady1: false,
        userReady2: false,
        status: 'new',
        setting: {access: 'url'}
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
    if (!dbGame) {
        return;
    }

    if (dbGame.setting.access == data.setting.access) {
        return;
    }

    dbGame.setting.access = data.setting.access;

    db.game().update(dbGame);

    emitter.event('game.setting.changed', {
        id: id,
        item: render.file('/game/list-item.jade', {game: game})
    });
};

exports._update = function (id, data) {
    var dbGame = db.game().get(id);
    if (!dbGame) {
        return;
    }

    if (data.userReady1) {
        dbGame.userReady1 = data.userReady1;
    }

    if (data.userReady2) {
        dbGame.userReady2 = data.userReady2;
    }

    if (data.userId2) {
        dbGame.userId2 = data.userId2;
    }

    if (data.status) {
        dbGame.status = data.status;
    }

    db.game().update(dbGame);

    return wrap(dbGame);
};

wrap = function (dbGame) {
    if (!dbGame) {
        return null;
    }

    var game = new Game();
    game.id = dbGame['$loki'];
    game.userId1 = dbGame.userId1;
    game.userId2 = dbGame.userId2;
    game.userReady1 = dbGame.userReady1;
    game.userReady2 = dbGame.userReady2;
    game.status = dbGame.status;
    game.setting = dbGame.setting;

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
        userReady1: false,
        userReady2: false,
        status: 'new', // new - только создали, full - добавился 2 пользователь, go - началась, end - закончилась
        setting: {
            access: 'url'
        }
    };
}