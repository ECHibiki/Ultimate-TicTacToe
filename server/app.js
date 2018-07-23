"use strict";
var Socket = /** @class */ (function () {
    function Socket() {
        this.url = "http://144.172.129.226:3231";
        this.websocket = null;
        this.websocket = io.connect(this.url, { reconnection: false });
        this.socketListener('message', function (data) { console.log(data); });
    }
    Socket.prototype.sendSocket = function (event, arg) {
        this.websocket.emit(event, arg);
    };
    Socket.prototype.socketListener = function (event, fn) {
        this.websocket.on(event, fn);
    };
    return Socket;
}());
var GameSettings = /** @class */ (function () {
    function GameSettings(socket) {
        this.game = null;
        this.info_text = null;
        var config = {
            type: Phaser.CANVAS,
            width: 500,
            height: 550,
            scene: {
                preload: preload,
                create: create
            }
        };
        this.game = new Phaser.Game(config);
        function preload() {
            this.load.image('board', 'sprites/board.jpg');
            this.load.image('x', 'sprites/x.png');
            this.load.image('o', 'sprites/o.png');
            this.info_text = this.add.text(10, 16, '', { fontSize: '28px', fill: '#fff' });
        }
        function create() {
            var _this = this;
            this.info_text.setText('connecting...');
            this.board = null;
            this.x = [];
            this.o = [];
            socket.socketListener('ready', function (data) {
                _this.info_text.setText('Searching for players');
            });
            socket.socketListener('disconnect', function (data) {
                _this.info_text.setText('Game server is offline');
            });
            socket.socketListener('join', function (data) {
                _this.info_text.x = 25;
                _this.info_text.y = 510;
                _this.info_text.setText('Turn X');
                _this.board = _this.add.image(250, 250, 'board');
                _this.x[0] = _this.add.image(80, 80, 'x');
                _this.o[0] = _this.add.image(200, 200, 'o');
            });
            socket.socketListener('broken', function (data) {
                _this.info_text.x = 10;
                _this.info_text.y = 16;
                _this.info_text.setText('Disconnected with session');
                _this.board.destroy();
                _this.x.forEach(function (el, ind) {
                    _this.x[ind].destroy();
                });
                _this.o.forEach(function (el, ind) {
                    _this.o[ind].destroy();
                });
            });
            socket.sendSocket('ready', '');
        }
    }
    return GameSettings;
}());
window.onload = function () {
    //document.body.innerHTML = "<canvas id='game' width=500 height=500 style='border:solid black 1px'></canvas>";
    var socket = new Socket();
    var game = new GameSettings(socket);
};
//# sourceMappingURL=app.js.map