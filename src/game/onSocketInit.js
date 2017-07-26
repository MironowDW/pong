var userTable = require('../user/table');
var gameTable = require('./table');
var runner = require('./runner');

module.exports = function (socket, io) {

    socket.on('game.create', function (data, callback) {
        var user = userTable.findBySocketId(socket.id);

        game = gameTable.createGame(user);

        callback(game);
    });

    // Кто-то просится в игру
    socket.on('game.invite', function (gameId, callback) {
        var game = gameTable.findById(gameId);
        var user = userTable.findBySocketId(socket.id);
        var countdown = 5;

        // TODO Куда это?
        var canInvite = !game.userId2 && game.status == 'new' && user.id != game.userId1;

        if (!canInvite) {
            callback(false);
            return;
        }

        // Устанавливаем нового игрока
        game = gameTable.update(game.id, {userId2: user.id, status: 'full'});

        // Обратный отсчет
        var params = {id: game.id, seconds: countdown, item: ''};
        io.to(game.user1().socketId).emit('game.countdown', params);
        io.to(game.user2().socketId).emit('game.countdown', params);

        // Начало игры
        setTimeout(function () {
            runner.run(game, io);
        }, countdown * 1000);
    });

    socket.on('ls', function (gameId) {
        var userId = userTable.findBySocketId(socket.id).id;

        runner.rooms[gameId].players[userId].startLeft = true;
    });

    socket.on('rs', function (gameId) {
        var userId = userTable.findBySocketId(socket.id).id;

        runner.rooms[gameId].players[userId].startRight = true;
    });

    socket.on('le', function (gameId) {
        var userId = userTable.findBySocketId(socket.id).id;

        runner.rooms[gameId].players[userId].startLeft = false;
    });

    socket.on('re', function (gameId) {
        var userId = userTable.findBySocketId(socket.id).id;

        runner.rooms[gameId].players[userId].startRight = false;
    });
};