var gameTable = require('./table');

module.exports = function (io) {
    // Все игры в статусе new отмечаем как ошибочные

    gameTable.markAsServerError();
};