var http = require('http');
var io = require('socket.io');
var user = require('./user');
var game = require('./game');
var emitter = require('./emitter');
var userModule = require('./user');

/**
 * Иницализирует socket на переданном хосте и порту
 */
exports.init = function (host, port) {
    var server = http.createServer();
    server.listen(port, host);
    io = io.listen(server);

    emitter.setIo(io);

    io.sockets.on('connection', function (socket) {
        // Собитие после которого можно работать с соединением
        socket.on('user.init', function (hash, callback) {
            var currentUser = userModule.findByHash(hash);

            // Привязываем сокет к пользователю
            currentUser = userModule.update(currentUser.id, {socketId: socket.id});

            callback(currentUser);

            console.log('User inited: ', currentUser);

            user.initSocket(socket);
            game.initSocket(socket, io);

            // Отвязываем пользователя от socketId
            socket.on('disconnect', function () {
                currentUser = userModule.update(currentUser.id, {socketId: null});

                // Если через 5 секунд после отсоединения пользователь не вернулся, считаем его offline
                // Такое может быть при обновление странички
                setTimeout(function () {
                    if (currentUser.socketId) {
                        return;
                    }

                    currentUser = userModule.update(currentUser.id, {status: 'offline'});
                }, 5000);
            });
        });
    });
};