var userModule = require('./user');

exports.init = function (request, response, next) {
    var hash = request.cookies.user_hash;
    var user = userModule.findByHash(hash);

    // Генерим пустого пользователя
    if (!user) {
        user = userModule.generate();

        response.cookie('user_hash', user.hash);
    }

    request.user = user;
    request.app.locals.currentUserId = user.id;

    if (user.status == 'offline') {
        userModule.update(user.id, {status: 'online'});
    }

    next();
};