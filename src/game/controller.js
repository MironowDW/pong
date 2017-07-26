var gameTable = require('./table');
var gameConfig = require("./config");

exports.index = function (request, response) {
    var userId = request.user.id;
    var game = gameTable.findById(request.params.id);
    if (!game) {
        response.render('game/error', {message: 'Игра не найдена'});
        return;
    }

    var hasAccess = false;
    var message = '';
    var isParticipant = userId == game.userId1 || userId == game.userId2;

    switch (game.status) {
        case 'new':
            // При создании даем доступ всем
            hasAccess = true;
            break;
        case 'full':
        case 'go':
            // После начала игры даем доступ только участникам
            hasAccess = isParticipant;
            message = 'Игра уже началась';
            break;
        case 'end':
            // После завершения никому не даем доступ
            hasAccess = false;
            message = 'Игра закончилась';
            break;
        case 'server_error':
            hasAccess = false;
            message = 'Игра прервана сервером';
            break;
        case 'user_error':
            hasAccess = false;
            message = 'Игра прервана';
            break;
    }

    if (!hasAccess) {
        response.render('game/error', {message: message});
        return;
    }

    // В игру может вступить не участник в новую игру
    var canInvite = !isParticipant && game.status == 'new';

    response.render('game/index', {game: game, config: gameConfig, canInvite: canInvite});
};