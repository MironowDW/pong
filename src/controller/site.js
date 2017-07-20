const fs = require('fs');
const shuffle = require('shuffle-array');
const faker = require('faker');

/**
 * Отображение панели
 *
 * @param request
 * @param response
 */
exports.index = function (request, response) {
    var state = request.app.get('state');
    var user = request.user;
    var avatars = getAvatars(user);

    var name = user.name ? user.name : firstName();

    response.render('site/index', {users: state.users, name: name, avatars: avatars});
};

function getAvatars(user) {
    var avatars = [];

    fs.readdirSync('public/img/avatars/').forEach(function (file) {
        avatars.push('/img/avatars/' + file);
    });

    shuffle(avatars);

    // Аватарку пользователя ставим на первое место
    if (user.avatar) {
        avatars.sort(function (a, b) {
            if (a == user.avatar) {
                return -1;
            }

            if (b == user.avatar) {
                return 1;
            }

            return 0;
        });
    }

    return {
        show: avatars.slice(0, 4),
        hide: avatars.slice(4)
    };
}

function firstName() {
    faker.locale = 'ru';
    return faker.name.firstName();
}