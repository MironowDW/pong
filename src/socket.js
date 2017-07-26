var http = require('http');
var io = require('socket.io');
var userOnSocketInit = require('./user/onSocketInit');
var gameOnSocketInit = require('./game/onSocketInit');
var emitter = require('./common/emitter');

/**
 * Иницализирует socket на переданном хосте и порту
 */
exports.init = function (host, port) {
    var server = http.createServer();
    server.listen(port, host);
    io = io.listen(server);

    emitter.init(io);

    io.sockets.on('connection', function (socket) {
        // Собитие после которого можно работать с соединением
        socket.on('user.init', function (userid, callback) {
            userOnSocketInit(socket, userid);
            gameOnSocketInit(socket, io);

            callback();
        });
    });
};