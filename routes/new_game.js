var shortid = require('shortid');

module.exports = require('express').Router().get('/', function (req, res) {
    var gameId = shortid.generate();

    res.redirect('/game/' + gameId + '/');
});