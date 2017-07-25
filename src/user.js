exports.init = function (request, response, next) {
    var state = request.app.get('state');
    var hash = request.cookies.user_hash;
    var user = state.user.findByHash(hash);

    // Генерим пустого пользователя
    if (!user) {
        user = state.user.generate();

        response.cookie('user_hash', user.hash);
    }

    request.user = user;
    request.app.locals.currentUserId = user.id;

    if (user.status == 'offline') {
        state.user.update(user.id, {status: 'online'});
    }

    next();
};

exports.initSocket = function (socket, state) {
    socket.on('user.save', function (data) {
        var user = state.user.findBySocketId(socket.id);
        state.user.update(user.id, data);

        console.log('User saved', data);
    });
};

exports.User = User;

function User() {
    return {
        id: null,
        hash: null,
        name: 'без имени',
        avatar: '',
        socketId: null,
        status: 'online'
    };
}