const fs = require('fs');
const shuffle = require('shuffle-array');
var userModule = require('../user');
var gameModule = require('../game');

/**
 * Отображение панели
 *
 * @param request
 * @param response
 */
exports.index = function (request, response) {
    var user = request.user;
    var avatars = getAvatars(user);

    var name = user.name == 'без имени' ? '' : user.name;

    response.render('site/index', {
        users: userModule.findOnline(),
        games: gameModule.findAll(),
        name: name,
        avatars: avatars
    });
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