var emits = [];
var socketIo = null;

exports.init = function (io) {
    socketIo = io;

    for (var i in emits) {
        this.event(emits[i].event, emits[i].message);
    }
};

exports.event = function (event, message) {
    if (!socketIo) {
        emits.push({event: event, message: message});
        return;
    }

    socketIo.sockets.emit(event, message);
};
