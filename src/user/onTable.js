var userTable = require('./table');

module.exports = function (io) {
    // Всех пользователей отмечаем как offline
    userTable.markOffline();
};