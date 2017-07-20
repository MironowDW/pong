var shortid = require('shortid');

exports.init = function (request, response, next) {
    var state = request.app.get('state');
    var hash = request.cookies.user_hash;
    var user = state.getUser(hash);

    // генерим пустого пользователя
    if (!user) {
        hash = shortid.generate();

        user = new User();
        user = state.addUser(hash, user);

        response.cookie('user_hash', hash);
    }

    request.user = user;

    next();
};

exports.initSocket = function (socket, state) {
    socket.on('user.save', function (data, callback) {
        if (!data.name && !data.avatar) {
            callback({type: 'error', message: 'Нечего сохранять'});
            return;
        }

        var hash = state.getHashBySocketId(socket.id);
        if (!hash) {
            callback({type: 'error', message: 'Пользователь не найден'});
            return;
        }

        state.updateUser(hash, data);

        callback({type: 'success', message: 'Сохранено'});

        console.log('User saved', data);


    });
};

function User() {
    return {
        id: null,
        name: null,
        avatar: null,
        socketId: null,

        getName: function () {
            return this.name ? this.name : 'без имени';
        }
    };
}