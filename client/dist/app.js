"use strict";
var Socket = /** @class */ (function () {
    function Socket() {
        this.url = "http://localhost:3231";
        this.websocket = null;
    }
    Socket.prototype.establishSocket = function () {
        var _this = this;
        this.websocket = io(this.url);
        this.websocket.on('connect', function (data) {
            _this.sendSocket('con', '1');
        });
        this.websocket.on('disconnect', function (data) {
            console.log('dsc');
            // this.websocket = null;
            // this.websocket = io(this.url);
        });
        this.websocket.on("ping", function (data) {
            console.log("received ping");
        });
        this.websocket.on("pong", function (data) {
            console.log("received pong");
        });
        this.websocket.on('message', this.clientMessaged);
        this.websocket.on('error', this.socketError);
    };
    Socket.prototype.sendSocket = function (event, arg) {
        console.log(this.websocket);
        this.websocket.emit(event, arg);
    };
    Socket.prototype.clientMessaged = function (response) {
        console.log('resp: ' + response);
    };
    Socket.prototype.socketError = function () {
        console.log('err');
    };
    Socket.prototype.closeSocket = function () {
        console.log('close');
    };
    return Socket;
}());
window.onload = function () {
    var socket = new Socket();
    socket.establishSocket();
    //socket.closeSocket(1000,'success');
};
//# sourceMappingURL=app.js.map