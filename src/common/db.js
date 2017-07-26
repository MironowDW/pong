var loki = require('lokijs');
var gameOnTable = require('../game/onTable');
var userOnTable = require('../user/onTable');

var db = new loki('db/loki.json', {
    env: 'NODEJS',
    autosave: true,
    autosaveInterval: 4000,
    autoload: true,
    autoloadCallback: function () {
        gameOnTable();
        userOnTable();
    }
});

exports.user = function () {
    return this.collection('user');
};

exports.game = function () {
    return this.collection('game');
};

exports.collection = function (name) {
    var collection = db.getCollection(name);
    if (collection) {
        return collection;
    }

    return db.addCollection(name);
};