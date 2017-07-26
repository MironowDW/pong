var emitter = require('../common/emitter');
var userOnSocketInit = require('../user/onSocketInit');
var gameOnSocketInit = require('../game/onSocketInit');

module.exports = function (io) {
    emitter.init(io);

    io.sockets.on('connection', function (socket) {
        // Собитие после которого можно работать
        socket.on('user.init', function (userId, callback) {
            userOnSocketInit(socket, userId);
            gameOnSocketInit(socket, io);

            callback();
        });
    });
};