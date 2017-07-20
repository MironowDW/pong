var shortid = require('shortid');

exports.initSocket = function (socket, state) {
    socket.on('game.create', function (data, callback) {
        var hash = state.getHashBySocketId(socket.id);
        console.log(hash);
        if (!hash) {
            return;
        }

        var game = new Game();
        game.id = shortid();
        game.userHash1 = hash;

        game = state.addGame(game);

        callback(game);
    });
};

function Game() {
    return {
        id: null,
        userHash1: null,
        userHash2: null
    };
}