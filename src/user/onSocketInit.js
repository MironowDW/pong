var userTable = require('./table');

/**
 * При инициализации сокета текущего пользователя инициализируем события
 */
module.exports = function (socket, userid) {

    // Привязываем сокет к пользователю
    userTable.update(userid, {socketId: socket.id});

    socket.on('user.save', function (data) {
        var user = userTable.findBySocketId(socket.id);
        userTable.update(user.id, data);

        console.log('User saved', data);
    });

    socket.on('disconnect', function () {
        // Отвязываем пользователя от socketId
        var user = userTable.findBySocketId(socket.id);
        userTable.update(user.id, {socketId: null});

        // Если через 5 секунд после отсоединения пользователь не вернулся, считаем его offline
        // Такое может быть при обновление странички
        setTimeout(function () {
            var user = userTable.findBySocketId(socket.id);

            if (user.socketId) {
                return;
            }

            userTable.update(user.id, {status: 'offline'});
        }, 5000);
    });
};