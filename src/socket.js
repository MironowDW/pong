var http = require('http');
var io = require('socket.io');
var user = require('./user');

/**
 * Иницализирует socket на переданном хосте и порту
 */
exports.init = function (host, port) {
    var server = http.createServer();
    server.listen(port, host);

    return function (request, response, next) {
        io = io.listen(server);

        io.sockets.on('connection', function (socket) {
            socket.on('user.init', function (hash, callback) {
                var state = request.app.get('state');
                var currentUser = state.getUser(hash);

                // Привязываем сокет к пользователю
                currentUser.socketId = socket.id;

                callback(currentUser);

                console.log('User inited: ', currentUser);

                user.initSocket(socket, state);
                state.setIo(io);
            });

            // socket.on('disconnect', function () {
            //     console.log('disconnect');
            // });
        });

        next();
    }
};