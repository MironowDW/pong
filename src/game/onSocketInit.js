var userTable = require('../user/table');
var gameTable = require('./table');
var runner = require('./runner');

module.exports = function (socket, io) {

    socket.on('game.create', function (data, callback) {
        var user = userTable.findBySocketId(socket.id);

        game = gameTable.createGame(user);

        callback(game);
    });

    socket.on('game.setting.save', function (data) {
        gameTable.update(data.id, data);

        console.log('Game setting saved');
    });

    socket.on('game.ready', function (gameId) {
        var game = gameTable.findById(gameId);
        var user = userTable.findBySocketId(socket.id);

        if (game.userId1 == user.id) {
            game = gameTable._update(game.id, {userReady1: true});
        }

        if (game.userId2 == user.id) {
            game = gameTable._update(game.id, {userReady2: true});
        }

        // Все готовы, поехали
        if (game.userReady1 && game.userReady2) {
            runner(game, io);
        }
    });

    socket.on('ls', function (data) {
        rooms[data.g].players[data.u].startLeft = true;
    });

    socket.on('rs', function (data) {
        rooms[data.g].players[data.u].startRight = true;
    });

    socket.on('le', function (data) {
        rooms[data.g].players[data.u].startLeft = false;
    });

    socket.on('re', function (data) {
        rooms[data.g].players[data.u].startRight = false;
    });
};