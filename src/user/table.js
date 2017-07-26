var shortid = require('shortid');
var render = require('../common/render');
var emitter = require('../common/emitter');
var db = require('../common/db');

/**
 * @returns {User[]}
 */
exports.findOnline = function () {
    var dbUsers = db.user().find({status: 'online'});
    var users = [];

    for (var i in dbUsers) {
        users.push(wrap(dbUsers[i]));
    }

    return users;
};

/**
 * @returns {User}
 */
exports.findById = function(id) {
    return wrap(db.user().get(id));
};

/**
 * @returns {User}
 */
exports.findByHash = function(hash) {
    return wrap(db.user().findOne({hash: hash}));
};

/**
 * @returns {User}
 */
exports.findBySocketId = function (socketId) {
    return wrap(db.user().findOne({socketId: socketId}));
};

exports.markOffline = function () {
    var users = db.user().find({status: 'online'});

    for (var i in users) {
        users[i].status = 'offline';
        db.user().update(users[i]);
    }
};

/**
 * @returns {User}
 */
exports.update = function (id, data) {
    var dbUser = db.user().get(id);
    var emit = false;
    if (!dbUser) {
        throw 'Пользователь не найден';
    }

    if (data.name && data.name != dbUser.name) {
        dbUser.name = data.name;
        emit = true;
    }

    if (data.avatar && data.avatar != dbUser.avatar) {
        dbUser.avatar = data.avatar;
        emit = true;
    }

    if (data.status && data.status != dbUser.status) {
        dbUser.status = data.status;
        emit = true;
    }

    if (data.socketId && data.socketId != dbUser.socketId) {
        dbUser.socketId = data.socketId;
    }

    db.user().update(dbUser);

    if (emit) {
        emitter.event('user.changed', {
            user: {
                id: id,
                status: dbUser.status
            },
            'online-item': render.file('/user/online-item.jade', {user: dbUser})
        });
    }

    return wrap(dbUser);
};

//////// TODO Тут ли место всему что ниже?

/**
 * @returns {User}
 */
exports.generate = function () {
    var dbUser = db.user().insert({
        name: 'без имени',
        hash: shortid.generate(),
        avatar: '',
        status: 'online',
        socketId: null
    });
    var user = wrap(dbUser);

    emitter.event('user.add', {
        id: user.id,
        'online-item': render.file('/user/online-item.jade', {user: user})
    });

    return user;
};

/**
 * @returns {User}
 */
function wrap(dbUser) {
    if (!dbUser) {
        return null;
    }

    var model = new User();
    model.id = dbUser['$loki'];
    model.name = dbUser.name;
    model.avatar = dbUser.avatar;
    model.status = dbUser.status;
    model.hash = dbUser.hash;
    model.socketId = dbUser.socketId;

    return model;
}

function User() {
    return {
        id: null,
        hash: null,
        name: 'без имени',
        avatar: '',
        socketId: null,
        status: 'online'
    };
}