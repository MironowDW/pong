var express = require('express');
var router = express.Router();
var playersCount = 0;
var sockets = [];
var player1Id = null;
var player2Id = null;

/* GET home page. */
router.get('/', function (req, res, next) {
    var io = require('socket.io');
    var io = io.listen(3030);

    io.sockets.on('connection', function (socket) {
        playersCount++;

        if (playersCount > 2) {
            return false;
        }

        if (playersCount == 1) {
            player1Id = socket.client.conn.id;
        }

        if (playersCount == 2) {
            player2Id = socket.client.conn.id;
        }

        console.log('Player connected: ' + playersCount + '(' + socket.client.conn.id + ')');
        sockets.push(socket);

        if (playersCount == 2) {
            startGame();
        }

        socket.on('disconnect', function () {
            playersCount--;

            console.log('Player disconnected: ' + playersCount);

            if (playersCount != 2) {
                console.log('Stop game');

                for (var i in sockets) {
                    sockets[i].disconnect();
                }
            }
        });

    });

    res.render('index');
});

module.exports = router;


function startGame() {
    console.log('Start game');

    // TODO Не везде используется конфиг
    var config = {
        width: 400,
        height: 600
    };
    var keysDown = {};
    for (var i in sockets) {
        keysDown[sockets[i].client.conn.id] = {
            left: false,
            right: false
        };
    }

    var animate = getAnimate();

    var player1 = new Player(175, 580, 50, 10, player1Id);
    var player2 = new Player(175, 10, 50, 10, player2Id);

    var ball = new Ball(200, 300);

    var updateScene = function () {
        player1.update(ball);
        player2.update(ball);
        ball.update(player1.paddle, player2.paddle);
    };

    var stepScene = function () {
        updateScene();
        animate(stepScene);
    };

    function Paddle(x, y, width, height, id) {
        this.id = id;
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
        } else if (this.x + this.width > 400) {
            this.x = 400 - this.width;
            this.x_speed = 0;
        }

        for (var i in sockets) {
            sockets[i].emit('paddle_move', {x: this.x, y: this.y, id: this.id});
        }
    };

    function Player(x, y, width, height, id) {
        this.paddle = new Paddle(x, y, width, height, id);
    }

    Player.prototype.update = function () {
        if (keysDown[this.paddle.id].left) {
            this.paddle.move(-4, 0);
            return;
        }

        if (keysDown[this.paddle.id].right) {
            this.paddle.move(4, 0);
        }
    };

    function Ball(x, y) {
        this.x = x;
        this.y = y;
        this.x_speed = 0;
        this.y_speed = 3;
    }

    Ball.prototype.update = function (paddle1, paddle2) {
        this.x += this.x_speed;
        this.y += this.y_speed;
        var top_x = this.x - 5;
        var top_y = this.y - 5;
        var bottom_x = this.x + 5;
        var bottom_y = this.y + 5;

        if (this.x - 5 < 0) {
            this.x = 5;
            this.x_speed = -this.x_speed;
        } else if (this.x + 5 > 400) {
            this.x = 395;
            this.x_speed = -this.x_speed;
        }

        if (this.y < 0 || this.y > 600) {
            this.x_speed = 0;
            this.y_speed = 3;
            this.x = 200;
            this.y = 300;
        }

        if (top_y > 300) {
            if (top_y < (paddle1.y + paddle1.height) && bottom_y > paddle1.y && top_x < (paddle1.x + paddle1.width) && bottom_x > paddle1.x) {
                this.y_speed = -3;
                this.x_speed += (paddle1.x_speed / 2);
                this.y += this.y_speed;
            }
        } else {
            if (top_y < (paddle2.y + paddle2.height) && bottom_y > paddle2.y && top_x < (paddle2.x + paddle2.width) && bottom_x > paddle2.x) {
                this.y_speed = 3;
                this.x_speed += (paddle2.x_speed / 2);
                this.y += this.y_speed;
            }
        }

        for (var i in sockets) {
            sockets[i].emit('ball_move', {x: this.x, y: this.y});
        }
    };

    function getAnimate() {
        return function (callback) {
            setTimeout(callback, 1000 / 60)
        };
    }

    for (var i in sockets) {
        sockets[i].on('paddle_left', function (playerId) {
            keysDown[playerId].left = true;
        });

        sockets[i].on('paddle_right', function (playerId) {
            keysDown[playerId].right = true;
        });

        sockets[i].on('paddle_left_stop', function (playerId) {
            keysDown[playerId].left = false;
        });

        sockets[i].on('paddle_right_stop', function (playerId) {
            keysDown[playerId].right = false;
        });
    }

    for (var i in sockets) {
        sockets[i].emit('start_game', {
            player1Id: player1.paddle.id,
            player2Id: player2.paddle.id
        });
    }

    animate(stepScene);
}