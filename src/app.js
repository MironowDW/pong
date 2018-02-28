var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var http = require('http');
var io = require('socket.io');

// Щаблоны
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Инициализируем сокет
var host = process.env.SOCKET_HOST || '127.0.0.1';
var port = process.env.SOCKET_PORT || 3030;
var server = http.createServer();
server.listen(port, host);
io = io.listen(server);

// Инициализируем приложение
app.locals.socketHost = host;
app.locals.socketPort = port;
require('./app/onInit')(io);

// Инициализация модуля пользователей
app.use(require('./user/onRequest'));

app.get('/', require('./app/controller').index);
app.get('/game/:id', require('./game/controller').index);

// Обработка 404
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Обработка ошибок
app.use(function(err, req, res) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err
  });
});

module.exports = app;
