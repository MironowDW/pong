var userTable = require('./table');
var gameRunner = require('../game/runner');

/**
 * При инициализации сокета текущего пользователя инициализируем события
 */
module.exports = function (socket, hash) {
    var userId = userTable.findByHash(hash).id;

    // Привязываем сокет к пользователю
    userTable.update(userId, {socketId: socket.id});
    console.log('User ' + userId + ' binded to socket id: (' + socket.id + ')');

    socket.on('user.save', function (data) {
        var user = userTable.findBySocketId(socket.id);
        if (user) {
            userTable.update(user.id, data);
        }
    });

    socket.on('disconnect', function () {
        // Отвязываем пользователя от socketId
        userTable.update(userId, {socketId: null});
        console.log('User ' + userId + ' unbinded from socket id: (' + socket.id + ')');

        // Если через 5 секунд после отсоединения пользователь не вернулся, считаем его offline
        // Такое может быть при обновление странички
        setTimeout(function () {
            var user = userTable.findById(userId);

            if (user && user.socketId) {
                return;
            }

            // Отмечаем текущую игру пользователя как прерванную
            gameRunner.onUserDisconnect(userId);

            userTable.update(user.id, {status: 'offline'});
            console.log('User ' + user.id + ' is offline');
        }, 5000);
    });
};