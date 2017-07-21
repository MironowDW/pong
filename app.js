var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

// Щаблоны
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Глобальное состояние, все объекты будут храниться тут
var state = require('./src/state');
app.set('state', new state(app));

// Инициализируем текущего пользователя при каждом подключении
var user = require('./src/user');
app.use(user.init);

// Инициализируем сокет
var socketHost = process.env.SOCKET_HOST || '127.0.0.1';
var socketPort = process.env.SOCKET_PORT || 3030;
app.locals.socketHost = socketHost;
app.locals.socketPort = socketPort;
var socket = require('./src/socket');
socket.init(socketHost, socketPort, app.get('state'));

var site = require('./src/controller/site');
var game = require('./src/controller/game');
app.get('/', site.index);
app.get('/game/:id', game.index);

// TODO Зарефакторить
// var newGame = require('./routes/new_game');
// var game = require('./routes/game');
// app.use(newGame);
// app.use(game);

// Обработка 404
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Обработка ошибок
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err
  });
});

module.exports = app;
