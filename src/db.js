var loki = require('lokijs');

var db = new loki('db/loki.json', {env: 'NODEJS', autosave: true, autosaveInterval: 4000, autoload: true});

exports.user = function () {
    return this.collection('user');
};

exports.collection = function (name) {
    var collection = db.getCollection(name);
    if (collection) {
        return collection;
    }

    return db.addCollection(name);
};