var host = process.env.HOST || '127.0.0.1';

var http = require('http');
var io = require('socket.io');
var server = http.createServer();
server.listen(3030, host);
var io = io.listen(server);

var games = {};

io.sockets.on('connection', function (socket) {
    var referer = socket.handshake.headers.referer;
    if (!referer) {
        throw 'Не найден referer';
    }

    var gameId = referer.match(/\/game\/([0-9a-zA-Z_-]+)\//)[1];
    if (!gameId) {
        throw 'Не найден gameId';
    }

    if (!games[gameId]) {
        throw 'Не найдена игра';
    }

    var game = games[gameId];
    var player = new Player(socket);

    game.addPlayer(player);

    registerOn(socket, game, player);

    if (game.isReady()) {
        game.start();
    }
});

function registerOn(socket, game, player) {

    socket.on('disconnect', function () {
        game.stop();
    });

    socket.on('left.start', function () {
        player.startLeft = true;
    });

    socket.on('right.start', function () {
        player.startRight = true;
    });

    socket.on('left.end', function () {
        player.startLeft = false;
    });

    socket.on('right.end', function () {
        player.startRight = false;
    });
}

module.exports = require('express').Router().get('/game/:name/', function (req, res) {
    if (!games[req.params.name]) {
        var game = new Game(req.params.name);
        games[game.id] = game;
    }

    res.render('game', {host: host});
});

function Game(id) {
    this.id = id;

    this.config = {
        width: 600,
        height: 400,
        paddleWidth: 50,
        paddleHeight: 10,
        margin: 10
    };

    this.isRun = false;

    this.player1 = null;
    this.player2 = null;

    this.ball = new Ball(this.config.width / 2, this.config.height / 2);
    this.ball.config = this.config;

    this.addPlayer = function (player) {
        player.paddle.width = this.config.paddleWidth;
        player.paddle.height = this.config.paddleHeight;
        player.paddle.x = (this.config.width / 2) - (this.config.paddleWidth / 2);
        player.paddle.config = this.config;

        if (this.player1 == null) {
            this.player1 = player;

	        this.player1.paddle.y = (this.config.height - (this.config.margin + this.config.paddleHeight));
            return;
        }

        if (this.player2 == null) {
            this.player2 = player;

            this.player2.paddle.y = this.config.margin;
            return;
        }

        throw 'Слишком много игроков';
    };

    this.start = function () {
        this.isRun = true;

        this.emit('start', this.getState(true));

        this.tick();
    };

    this.stop = function () {
        this.isRun = false;

        if (this.player1 && this.player1.socket) {
            this.player1.socket.disconnect();
        }
        if (this.player2 && this.player2.socket) {
            this.player2.socket.disconnect();
        }

        delete games[this.id];
        delete this.player1;
        delete this.player2;
    };

    this.isReady = function () {
        return this.player1 != null && this.player2 != null;
    };

    this.tick = function () {
        if (!this.isRun) {
            return false;
        }

        this.player1.update();
        this.player2.update();
        this.ball.update(this.player1, this.player2);

        this.emit('tick', this.getState(false));

        if (this.player1.score == 10 || this.player2.score == 10) {
            this.stop();
            return;
        }

        var game = this;
        setTimeout(function () {game.tick()}, 1000 / 60)
    };

    this.getState = function (isFull) {
        var state = {
            ball: {
                x: this.ball.x,
                y: this.ball.y
            },
            player1: {
                x: this.player1.paddle.x,
                y: this.player1.paddle.y,
                score: this.player1.score
            },
            player2: {
                x: this.player2.paddle.x,
                y: this.player2.paddle.y,
                score: this.player2.score
            }
        };

        if (isFull) {
            state.width =  this.config.width;
            state.height = this.config.height;

            state.player1.width = this.config.paddleWidth;
            state.player1.height = this.config.paddleHeight;

            state.player2.width = this.config.paddleWidth;
            state.player2.height = this.config.paddleHeight;
        }

        return state;
    };

    this.emit = function (event, data) {
        if (this.player1) {
            this.player1.socket.emit(event, data);
        }
        if (this.player2) {
            this.player2.socket.emit(event, data);
        }
    };
}

function Paddle(x, y, width, height) {
    this.config = {};
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.x_speed = 0;
    this.y_speed = 0;
}

Paddle.prototype.move = function (x, y) {
    this.x += x;
    this.y += y;
    this.x_speed = x;
    this.y_speed = y;
    if (this.x < 0) {
        this.x = 0;
        this.x_speed = 0;
    } else if (this.x + this.width > this.config.width) {
        this.x = this.config.width - this.width;
        this.x_speed = 0;
    }
};

function Player(socket) {
    this.score = 0;
    this.socket = socket;
    this.paddle = new Paddle();

    this.startLeft = false;
    this.startRight = false;
}

Player.prototype.update = function () {

    if (this.startLeft) {
        this.paddle.move(-8, 0);
        return;
    }

    if (this.startRight) {
        this.paddle.move(8, 0);
        return;
    }

    this.paddle.move(0, 0);
};

function Ball(x, y) {
    this.config = {};
    this.x = x;
    this.y = y;
    this.x_speed = 0;
    this.y_speed = 3 * 2;
}

Ball.prototype.update = function (player1, player2) {
    var paddle1 = player1.paddle;
    var paddle2 = player2.paddle;

    this.x += this.x_speed;
    this.y += this.y_speed;
    var top_x = this.x - 5;
    var top_y = this.y - 5;
    var bottom_x = this.x + 5;
    var bottom_y = this.y + 5;

    if (this.x - 5 < 0) {
        this.x = 5;
        this.x_speed = -this.x_speed;
    } else if (this.x + 5 > this.config.width) {
        this.x = this.config.width - 5;
        this.x_speed = -this.x_speed;
    }

    if (this.y < 0 || this.y > this.config.height) {
        if (this.y < 0) {
            this.y_speed = 3 * 2;
            player2.score++;
        } else {
            this.y_speed = -(3 * 2);
            player1.score++;
        }

        this.x_speed = 0;
        this.x = this.config.width / 2;
        this.y = this.config.height / 2;
    }

    if (top_y > this.config.height / 2) {
        if (top_y < (paddle1.y + paddle1.height) && bottom_y > paddle1.y && top_x < (paddle1.x + paddle1.width) && bottom_x > paddle1.x) {
            this.y_speed = -(3 * 2);
            this.x_speed += (paddle1.x_speed / 2);
            this.y += this.y_speed;
        }
    } else {
        if (top_y < (paddle2.y + paddle2.height) && bottom_y > paddle2.y && top_x < (paddle2.x + paddle2.width) && bottom_x > paddle2.x) {
            this.y_speed = 3 * 2;
            this.x_speed += (paddle2.x_speed / 2);
            this.y += this.y_speed;
        }
    }
};
