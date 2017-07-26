var config = require('./config');
var gameTable = require('./table');
var userTable = require('../user/table');

var rooms = {};

module.exports = function (game, io) {
    var user1 = userTable.findById(game.userId1);
    var user2 = userTable.findById(game.userId2);

    game = gameTable._update(game.id, {status: 'go'});

    var room = new Room(game, user1, user2, io);
    room.start();

    rooms[game.id] = room;
};

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

function Room(game, user1, user2, io) {
    return {
        io: io,

        width: config.width,
        height: config.height,
        board: config.board,

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

            // TODO
            // game = module._update(game.id, {status: 'end'});
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
            // TODO 60?
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