var shortid = require('shortid');

exports.getSceneConfig = getSceneConfig;

exports.initSocket = function (socket, state) {
    socket.on('game.create', function (data, callback) {
        var user = state.getUserBySocketId(socket.id);

        var game = new Game();
        game.id = shortid();
        game.userId1 = user.id;

        game = state.addGame(game);

        callback(game);
    });

    socket.on('game.ready', function (gameId) {
        var game = state.getGame(gameId);
        var user = state.getUserBySocketId(socket.id);

        if (game.userId1 == user.id) {
            game.userReady1 = true;
        }

        if (game.userId2 == user.id) {
            game.userReady2 = true;
        }

        // Все готовы, поехали
        if (game.userReady1 && game.userReady2) {
            var user1 = state.getUserById(game.userId1);
            var user2 = state.getUserById(game.userId2);

            var room = new Room(game, user1, user2, state.io);
            room.start();

            state.rooms[gameId] = room;
        }
    });

    socket.on('ls', function (data) {
        state.rooms[data.g].players[data.u].startLeft = true;
    });

    socket.on('rs', function (data) {
        state.rooms[data.g].players[data.u].startRight = true;
    });

    socket.on('le', function (data) {
        state.rooms[data.g].players[data.u].startLeft = false;
    });

    socket.on('re', function (data) {
        state.rooms[data.g].players[data.u].startRight = false;
    });
};

function Game() {
    return {
        id: null,
        userId1: null, // Создатель
        userId2: null,
        userReady1: false,
        userReady2: false,
        status: 'new'
    };
}

function Player(room, x, y) {
    return {
        score: 0,

        x: x,
        y: y,

        x_speed: 0,
        y_speed: 0,

        startLeft: false,
        startRight: false,

        update: function () {
            if (this.startLeft) {
                this.move(-8, 0);
                return;
            }

            if (this.startRight) {
                this.move(8, 0);
                return;
            }

            this.move(0, 0);
        },

        move: function (x, y) {
            this.x += x;
            this.y += y;

            this.x_speed = x;
            this.y_speed = y;

            if (this.x < 0) {
                this.x = 0;
                this.x_speed = 0;
            } else if (this.x + room.board.width > room.width) {
                this.x = room.width - room.board.width;
                this.x_speed = 0;
            }
        }
    };
}

function Ball(room, x, y) {
    return {
        x: x,
        y: y,
        x_speed: 0,
        y_speed: 3 * 2,
        update: function (player1, player2) {
            this.x += this.x_speed;
            this.y += this.y_speed;

            var top_x = this.x - 5;
            var top_y = this.y - 5;
            var bottom_x = this.x + 5;
            var bottom_y = this.y + 5;

            if (this.x - 5 < 0) {
                this.x = 5;
                this.x_speed = -this.x_speed;
            } else if (this.x + 5 > room.width) {
                this.x = room.width - 5;
                this.x_speed = -this.x_speed;
            }

            // Мячик ударился об край сцены
            if (this.y < 0 || this.y > room.height) {
                if (this.y < 0) {
                    this.y_speed = 3 * 2;
                    player2.score++;
                } else {
                    this.y_speed = -(3 * 2);
                    player1.score++;
                }

                this.x_speed = 0;
                this.x = room.width / 2;
                this.y = room.height / 2;

                room.io.to(room.socket1).emit('s', {1: player1.score, 2: player2.score});
                room.io.to(room.socket2).emit('s', {1: player1.score, 2: player2.score});

                // Победитель!
                if (player1.score >= 10 || player2.score >= 10) {
                    var winner = player1.score >= 10 ? 1 : 2;

                    room.io.to(room.socket1).emit('e', winner);
                    room.io.to(room.socket2).emit('e', winner);

                    room.stop();
                }
            }

            if (top_y > room.height / 2) {
                if (top_y < (player1.y + room.board.height) && bottom_y > player1.y && top_x < (player1.x + room.board.width) && bottom_x > player1.x) {
                    this.y_speed = -(3 * 2);
                    this.x_speed += (player1.x_speed / 2);
                    this.y += this.y_speed;
                }
            } else {
                if (top_y < (player2.y + room.board.height) && bottom_y > player2.y && top_x < (player2.x + room.board.width) && bottom_x > player2.x) {
                    this.y_speed = 3 * 2;
                    this.x_speed += (player2.x_speed / 2);
                    this.y += this.y_speed;
                }
            }
        }
    };
}

function getSceneConfig() {
    return {
        width: 600,
        height: 400,
        board: {width: 50, height: 10}
    };
}

function Room(game, user1, user2, io) {
    var config = getSceneConfig();

    return {
        io: io,

        width: config.width,
        height: config.height,
        board: config.width.board,

        socket1: user1.socketId,
        socket2: user2.socketId,

        players: {},
        ball: {x: this.width / 2, y: this.height / 2},

        emergencyBrake: false,

        start: function () {
            var width = this.width;
            var height = this.height;
            var board = this.board;

            this.players[user1.id] = new Player(this, (width / 2) - (board.width / 2), (height - (10 + 10)));
            this.players[user2.id] = new Player(this, (width / 2) - (board.width / 2), 10);
            this.ball = new Ball(this, width / 2, height / 2);

            io.to(user1.socketId).emit('game.start', game.id);
            io.to(user2.socketId).emit('game.start', game.id);

            this.tick();
        },

        stop: function () {
            this.emergencyBrake = true;
        },

        tick: function () {
            if (this.emergencyBrake) {
                return;
            }

            this.players[user1.id].update();
            this.players[user2.id].update();
            this.ball.update(this.players[user1.id], this.players[user2.id]);

            var state = this.state();

            io.to(user1.socketId).emit('t', state);
            io.to(user2.socketId).emit('t', state);

            var room = this;
            setTimeout(function () {room.tick()}, 1000 / 60)
        },

        state: function () {
            return {
                id: game.id,
                b: {x: this.ball.x, y: this.ball.y},
                p1: {x: this.players[user1.id].x, y: this.players[user1.id].y},
                p2: {x: this.players[user2.id].x, y: this.players[user2.id].y}
            };
        }
    };
}