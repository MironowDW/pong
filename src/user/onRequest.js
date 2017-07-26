var userTable = require('../user/table');

/**
 * По хэшу из cookie ищет пользователя, если не нашел генерит пустого и привязывает с помощью cookie
 * Сохраняет request.user
 * Если пользователь был offline пулит событие о изменение пользователя
 */
module.exports = function (request, response, next) {
    var hash = request.cookies.user_hash;
    var user = userTable.findByHash(hash);

    // Генерим пустого пользователя
    if (!user) {
        user = userTable.generate();
        response.cookie('user_hash', user.hash);
    }

    request.user = user;

    if (user.status == 'offline') {
        userTable.update(user.id, {status: 'online'});
    }

    next();
};