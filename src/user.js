var shortid = require('shortid');
var render = require('./render');
var emitter = require('./emitter');
var db = require('./db');

exports.initSocket = function (socket) {
    var module = this;

    socket.on('user.save', function (data) {
        var user = module.findBySocketId(socket.id);
        module.update(user.id, data);

        console.log('User saved', data);
    });
};

/**
 * @returns {User[]}
 */
exports.findOnline = function () {
    var dbUsers = db.user().find({status: 'online'});
    var users = [];

    for (var i in dbUsers) {
        users.push(this.wrap(dbUsers[i]));
    }

    return users;
};

/**
 * @returns {User}
 */
exports.findById = function(id) {
    return this.wrap(db.user().get(id));
};

/**
 * @returns {User}
 */
exports.findByHash = function(hash) {
    return this.wrap(db.user().findOne({hash: hash}));
};

/**
 * @returns {User}
 */
exports.findBySocketId = function (socketId) {
    return this.wrap(db.user().findOne({socketId: socketId}));
};

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
    var user = this.wrap(dbUser);

    emitter.event('user.add', {
        id: user.id,
        'online-item': render.file('/user/online-item.jade', {user: user})
    });

    return user;
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

    return this.wrap(dbUser);
};

/**
 * @returns {User}
 */
exports.wrap = function (dbUser) {
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
};

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