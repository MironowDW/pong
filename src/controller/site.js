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

    var avatars = getAvatarsSrc();
    var avatarsShow = avatars.slice(0, 4);
    var avatarsHide = avatars.slice(4);

    faker.locale = 'ru';
    var name = faker.name.firstName();

    response.render('site/index', {name: name, avatarsShow: avatarsShow, avatarsHide: avatarsHide});
};

function getAvatarsSrc() {
    var avatars = [];

    fs.readdirSync('public/img/avatars/').forEach(function (file) {
        avatars.push('/img/avatars/' + file);
    });

    shuffle(avatars);

    return avatars;
}