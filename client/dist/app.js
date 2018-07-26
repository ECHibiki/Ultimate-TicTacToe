"use strict";
var GameConstants = /** @class */ (function () {
    function GameConstants() {
    }
    GameConstants.client_name = '';
    return GameConstants;
}());
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
        var game = null;
        var info_text = null;
        var client_id = '';
        var players_turn = false;
        var player_piece = '';
        var board_width = 500;
        var board_height = 500;
        var game_lower_padding = 50;
        var reapear_location_x = -100;
        var reapear_location_y = -100;
        var config = {
            type: Phaser.AUTO,
            width: board_width,
            height: board_height + game_lower_padding,
            scene: {
                preload: preload,
                create: create
            },
            parent: 'phaser-game'
        };
        game = new Phaser.Game(config);
        function preload() {
            this.load.image('board', 'sprites/board.jpg');
            this.load.image('x', 'sprites/x.png');
            this.load.image('xG', 'sprites/xG.png');
            this.load.image('o', 'sprites/o.png');
            this.load.image('oG', 'sprites/oG.png');
            this.info_text = this.add.text(10, 16, '', { fontSize: '22px', fill: '#fff' });
        }
        function create() {
            var _this = this;
            this.info_text.setText('connecting...');
            this.board = null;
            this.x_cursor_icon = null;
            this.x_previous = null;
            this.o_cursor_icon = null;
            this.o_previous = null;
            this.x_board = [];
            this.o_board = [];
            //socket handlers
            socket.socketListener('ready', function (data) {
                _this.info_text.setText('Searching for players...');
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
                _this.x_previous = _this.add.image(900, 0, 'xG');
                _this.o_cursor_icon = _this.add.image(900, 0, 'o');
                _this.o_previous = _this.add.image(900, 0, 'oG');
            });
            socket.socketListener('broken', function (data) {
                _this.info_text.setText('Disconnected with other session');
            });
            socket.socketListener('board-data', function (data) {
                var previous_x = data['Previous-Turn'].split('|')[0] * board_width / 9 + board_width / 18;
                var previous_y = data['Previous-Turn'].split('|')[1] * board_height / 9 + board_height / 18;
                //turns
                if (data[_this.client_id]['Piece'] == data['Turn']) {
                    _this.info_text.setText('Turn ' + data['Turn'] + '(you) - Move ' + data['Move']);
                    _this.players_turn = true;
                    _this.player_piece = data['Turn'];
                    if (data['Previous-Turn'] != '-') {
                        if (data['Turn'] == 'x') {
                            _this.x_cursor_icon.x = reapear_location_x;
                            _this.x_cursor_icon.y = reapear_location_y;
                            _this.o_previous.x = previous_x;
                            _this.x_previous.x = -100;
                            _this.o_previous.y = previous_y;
                            _this.x_previous.y = -100;
                        }
                        else {
                            _this.o_cursor_icon.x = reapear_location_x;
                            _this.o_cursor_icon.y = reapear_location_y;
                            _this.x_previous.x = previous_x;
                            _this.o_previous.x = -100;
                            _this.x_previous.y = previous_y;
                            _this.o_previous.y = -100;
                        }
                    }
                }
                else {
                    _this.info_text.setText('Turn ' + data['Turn'] + '(opponent) - Move ' + data['Move']);
                    _this.players_turn = false;
                    if (data['Turn'] == 'x')
                        _this.x_cursor_icon.visible = false;
                    else
                        _this.o_cursor_icon.visible = false;
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
                        if (ind_y == data['Previous-Turn'].split('|')[1] && ind_x == data['Previous-Turn'].split('|')[0])
                            return;
                        if (e == 'x') {
                            _this.x_board.push(_this.add.image(ind_x * board_width / 9 + board_width / 18, ind_y * board_height / 9 + board_height / 18, 'x'));
                        }
                        else if (e == 'o') {
                            _this.o_board.push(_this.add.image(ind_x * board_width / 9 + board_width / 18, ind_y * board_height / 9 + board_height / 18, 'o'));
                        }
                    });
                });
            });
            //input handlers
            this.input.on('pointerdown', function (event) {
                if (_this.players_turn) {
                    var y = event.y;
                    if (y > board_height - 1)
                        y = board_height - 1;
                    var x = event.x;
                    var seg_xy = {
                        'x': Math.floor(x / (board_width / 9)),
                        'y': Math.floor(y / (board_height / 9)),
                    };
                    _this.reapear_location_x = x * board_width / 9 + board_width / 18;
                    _this.reapear_location_y = y * board_height / 9 + board_height / 18;
                    socket.sendSocket('move', seg_xy);
                }
            });
            //input handlers
            this.input.on('pointermove', function (event) {
                if (_this.players_turn) {
                    var y = event.y;
                    if (y > board_height - 1)
                        y = board_height - 1;
                    var x = event.x;
                    var seg_xy = {
                        'x': Math.floor(x / (board_width / 9)) * (board_width / 9) + (board_width / (9 * 2)),
                        'y': Math.floor(y / (board_height / 9)) * (board_height / 9) + (board_height / (9 * 2)),
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
            socket.sendSocket('ready', GameConstants.client_name);
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
    if (document.cookie == '') {
        var code = prompt('message', makeid());
        if (code == '')
            code = makeid();
        document.cookie = 'code=' + code;
    }
    GameConstants.client_name = document.cookie.split('=')[1];
    var socket = new Socket();
    var game = new GameSettings(socket);
};
var Chat = /** @class */ (function () {
    function Chat() {
    }
    return Chat;
}());
//# sourceMappingURL=app.js.map