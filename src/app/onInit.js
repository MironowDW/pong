var emitter = require('../common/emitter');
var userOnSocketInit = require('../user/onSocketInit');
var gameOnSocketInit = require('../game/onSocketInit');

module.exports = function (io) {
    emitter.init(io);

    io.sockets.on('connection', function (socket) {
        // Событие после которого можно работать
        socket.on('user.init', function (hash, callback) {
            userOnSocketInit(socket, hash);
            gameOnSocketInit(socket, io);

            callback();
        });
    });
};