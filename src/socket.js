var http = require('http');
var io = require('socket.io');
var user = require('./user');
var game = require('./game');

/**
 * Иницализирует socket на переданном хосте и порту
 */
exports.init = function (host, port, state) {
    var server = http.createServer();
    server.listen(port, host);
    io = io.listen(server);
    state.setIo(io);

    io.sockets.on('connection', function (socket) {
        socket.on('user.init', function (hash, callback) {
            var currentUser = state.getUser(hash);

            // Привязываем сокет к пользователю
            currentUser.socketId = socket.id;

            callback(currentUser);

            console.log('User inited: ', currentUser);

            user.initSocket(socket, state);
            game.initSocket(socket, state);

            // Отвязываем пользователя от socketId
            socket.on('disconnect', function () {
                currentUser.socketId = null;
            });
        });
    });
};