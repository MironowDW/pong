var jade = require("jade");
var gameService = require("../game");

exports.index = function (request, response) {
    var state = request.app.get('state');
    var id = request.params.id;
    var game = state.getGame(id);
    var isNewUser = 0;

    if (!game) {
        response.render('game/no');
        return;
    }

    var isUser1 = request.user.id == game.userId1;

    // Кто-то зашел в игру, делаем его вторым игроком
    if (!isUser1 && !game.userId2) {
        game.userId2 = request.user.id;
        game.user2 = request.user;
        state.event('game.change', {
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

    var user1 = state.user.findById(game.userId1);
    var user2 = game.userId2 ? state.user.findById(game.userId2) : null;

    response.render('game/index', {
        user1: user1,
        user2: user2,
        game: game,
        isNewUser: isNewUser,
        userId: request.user.id,
        sceneConfig: gameService.getSceneConfig()
    });
};