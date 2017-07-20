module.exports = function () {
    return {
        io: null,

        userLastId: 1,
        users: {},

        games: {},

        getUser: function (hash) {
            return this.users[hash];
        },
        getHashBySocketId: function (socketId) {
            for (var hash in this.users) {
                if (this.users[hash].socketId == socketId) {
                    return hash;
                }
            }

            return null;
        },
        updateUser: function (hash, data) {
            this.users[hash].name = data.name;
            this.users[hash].avatar = data.avatar;

            this.event('user.changed', this.users[hash]);
        },
        addUser: function (hash, user) {
            user.id = this.userLastId;
            this.userLastId++;

            this.users[hash] = user;

            return user;
        },

        setIo: function (io) {
            this.io = io;
        },
        event: function (event, message) {
            this.io.sockets.emit(event, message);
        }
    };
};