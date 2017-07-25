var jade = require("jade");
var gameService = require("../game");
var userModule = require('../user');
var gameModule = require('../game');
var emitter = require('../emitter');

exports.index = function (request, response) {
    var id = request.params.id;
    var game = gameModule.findById(id);
    var isNewUser = 0;

    if (!game) {
        response.render('game/no');
        return;
    }

    var isUser1 = request.user.id == game.userId1;

    // Кто-то зашел в игру, делаем его вторым игроком
    if (!isUser1 && !game.userId2) {
        // TODO Перенести это в game
        game = gameModule._update(game.id, {userId2: request.user.id, user2: request.user});

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
        response.render('game/denied');
        return;
    }

    var user1 = userModule.findById(game.userId1);
    var user2 = game.userId2 ? userModule.findById(game.userId2) : null;

    response.render('game/index', {
        user1: user1,
        user2: user2,
        game: game,
        isNewUser: isNewUser,
        userId: request.user.id,
        sceneConfig: gameService.getSceneConfig()
    });
};