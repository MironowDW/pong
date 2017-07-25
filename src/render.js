var jade = require('jade');
var path = require('path');

var views = path.join(__dirname, '../views');

exports.file = function (file, params) {
    return jade.renderFile(views + file, params);
};