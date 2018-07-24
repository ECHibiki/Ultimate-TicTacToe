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
        this.client_id = '';
        this.players_turn = false;
        this.player_piece = '';
        this.board_width = 500;
        this.board_height = 550;
        var that = this;
        var config = {
            type: Phaser.CANVAS,
            width: this.board_width,
            height: this.board_height,
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
            this.x_cursor_icon = null;
            this.o_cursor_icon = null;
            this.x_board = [];
            this.o_board = [];
            //socket handlers
            socket.socketListener('ready', function (data) {
                _this.info_text.setText('Searching for players');
                console.log(data);
                _this.client_id = data;
            });
            socket.socketListener('disconnect', function (data) {
                _this.info_text.setText('Game server is offline');
            });
            socket.socketListener('join', function (data) {
                _this.info_text.x = 25;
                _this.info_text.y = 510;
                _this.info_text.setText('Setting up game...');
                _this.board = _this.add.image(250, 250, 'board');
                _this.x_cursor_icon = _this.add.image(900, 0, 'x');
                _this.o_cursor_icon = _this.add.image(900, 0, 'o');
            });
            socket.socketListener('broken', function (data) {
                _this.info_text.setText('Disconnected with session');
            });
            socket.socketListener('board-data', function (data) {
                //turns
                if (data[_this.client_id] == data['Turn']) {
                    _this.info_text.setText('Turn ' + data['Turn'] + '(you)');
                    _this.players_turn = true;
                    _this.player_piece = data['Turn'];
                    // if( data['Turn'] == 'x') this.x_cursor_icon.visible = true;
                    // else this.o_cursor_icon.visible = true;
                }
                else {
                    _this.info_text.setText('Turn ' + data['Turn'] + '(opponent)');
                    _this.players_turn = false;
                    // if( data['Turn'] == 'x') this.x_cursor_icon.visible = false;
                    // else this.o_cursor_icon.visible = false;
                }
                //Extra messages
                if (data['Message'] != '') {
                    _this.info_text.setText(data['Message']);
                }
                //board clear
                _this.x_board.forEach(function (el, ind) {
                    _this.x_board[ind].destroy();
                });
                _this.o_board.forEach(function (el, ind) {
                    _this.o_board[ind].destroy();
                });
                //board draw
                var board = data['Board'].split('\n');
                board.forEach(function (el, ind_y) {
                    var el_split = el.split(' ');
                    el_split.forEach(function (e, ind_x) {
                        if (e == 'x') {
                            _this.x_board.push(_this.add.image(ind_x * 500 / 9 + 500 / 18, ind_y * 500 / 9 + 500 / 18, 'x'));
                        }
                        else if (e == 'o') {
                            _this.o_board.push(_this.add.image(ind_x * 500 / 9 + 500 / 18, ind_y * 500 / 9 + 500 / 18, 'o'));
                        }
                    });
                });
            });
            //input handlers
            this.input.on('pointerdown', function (event) {
                if (_this.players_turn) {
                    var y = event.y;
                    if (y > 499)
                        y = 499;
                    var x = event.x;
                    var seg_xy = {
                        'x': Math.floor(x / (500 / 9)),
                        'y': Math.floor(y / (500 / 9)),
                    };
                    socket.sendSocket('move', seg_xy);
                }
            });
            //input handlers
            this.input.on('pointermove', function (event) {
                if (_this.players_turn) {
                    var y = event.y;
                    if (y > 499)
                        y = 499;
                    var x = event.x;
                    var seg_xy = {
                        'x': Math.floor(x / (500 / 9)) * (500 / 9) + (500 / (9 * 2)),
                        'y': Math.floor(y / (500 / 9)) * (500 / 9) + (500 / (9 * 2)),
                    };
                    if (_this.player_piece == 'x') {
                        _this.x_cursor_icon.x = seg_xy['x'];
                        _this.x_cursor_icon.y = seg_xy['y'];
                    }
                    else {
                        _this.o_cursor_icon.x = seg_xy['x'];
                        _this.o_cursor_icon.y = seg_xy['y'];
                    }
                }
            }, this);
            //send ready sign
            socket.sendSocket('ready', document.cookie);
        }
    }
    return GameSettings;
}());
//From: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 5; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}
window.onload = function () {
    //document.body.innerHTML = "<canvas id='game' width=500 height=500 style='border:solid black 1px'></canvas>";
    if (document.cookie == undefined) {
        document.cookie = 'code=' + makeid();
    }
    var socket = new Socket();
    var game = new GameSettings(socket);
};
//# sourceMappingURL=app.js.map