var jade = require("jade");
var userTable = require('../user/table');
var gameTable = require('./table');
var gameConfig = require("./config");
var emitter = require('../common/emitter');

exports.index = function (request, response) {
    var game = gameTable.findById(request.params.id);
    if (!game) {
        response.render('game/error', {message: 'Игра не найдена'});
        return;
    }

    switch (game.status) {
        case 'new': // только создали

            break;
        case 'full': // добавился 2 пользователь

            break;
        case 'go': // началась

            break;
        case 'end': // закончилась

            break;
    }

    var isNewUser = 0;

    var isUser1 = request.user.id == game.userId1;

    // Кто-то зашел в игру, делаем его вторым игроком
    if (!isUser1 && !game.userId2) {
        // TODO Перенести это в game
        game = gameTable._update(game.id, {userId2: request.user.id, user2: request.user, status: 'full'});

        emitter.event('game.change', {
            type: 'ready',
            item: jade.renderFile(request.app.get('views') + '/game/user2-item.jade', {user2: request.user}),
            game: game
        });
        isNewUser = 1;
    }

    var isUser2 = request.user.id == game.userId2;

    // Игра уже готова и пришел кто-то третий
    if (!isUser1 && !isUser2) {
        response.render('game/error', {message: 'Игра уже идет, третий лишний'});
        return;
    }

    var user1 = userTable.findById(game.userId1);
    var user2 = game.userId2 ? userTable.findById(game.userId2) : null;

    response.render('game/index', {
        user1: user1,
        user2: user2,
        game: game,
        isNewUser: isNewUser,
        userId: request.user.id,
        sceneConfig: gameConfig
    });
};