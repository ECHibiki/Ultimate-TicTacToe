"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var GameConstants = /** @class */ (function () {
    function GameConstants() {
    }
    GameConstants.client_name = '';
    GameConstants.socket_id = '';
    return GameConstants;
}());
var Socket = /** @class */ (function () {
    function Socket() {
        var _this = this;
        this.url = "http://96.22.104.33:32232";
        this.websocket = null;
        this.websocket = io.connect(this.url, { reconnection: false });
        this.socketListener('message', function (data) {
            console.log(data);
        });
        this.socketListener('disconnect', function (data) {
            console.log(data);
            _this.websocket.disconnect();
        });
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
        var place_in_progress = false;
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
                    _this.place_in_progress = false;
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
                    _this.place_in_progress = true;
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
                if (_this.players_turn && _this.place_in_progress == false) {
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
var Chat = /** @class */ (function () {
    function Chat(chat_object, websocket) {
        this.main_chat_box = null;
        this.chat_socket = null;
        if (chat_object == null) {
            console.log('chat_object NULL');
            return;
        }
        this.main_chat_box = chat_object;
        this.chat_socket = websocket;
    }
    Chat.prototype.initializeChat = function (text_input_element, label) {
        var _this = this;
        text_input_element.addEventListener('keydown', function (event) {
            if (event.keyCode === 13) {
                _this.chat_socket.sendSocket(label + '-client-message', { 'contents': text_input_element.value, 'sender': GameConstants.client_name });
                text_input_element.value = '';
            }
        });
        var name_tab = document.getElementById(label + '-username');
        name_tab.textContent = '<' + GameConstants.client_name + '(' + GameConstants.socket_id.substr(0, 4) + ')>';
        name_tab.addEventListener('click', function (event) {
            _this.chat_socket.sendSocket(label + '-client-message', { 'contents': text_input_element.value, 'sender': GameConstants.client_name });
            text_input_element.value = '';
        });
    };
    Chat.prototype.addTextToChatbox = function (chat_list, name_width, response, sender) {
        if (chat_list == null) {
            console.log('chat_list NULL');
            return;
        }
        var list_el = document.createElement('LI');
        list_el.innerHTML = "<div class='row'>\n\t\t\t\t\t\t\t\t<div class='col-" + name_width + " border-right text-right text-truncate font-weight-bold' style='opacity:1.0'>&lt;" + sender + "&gt;</div>\n\t\t\t\t\t\t\t\t<div class='col-" + (12 - name_width) + " text-left'>" + response + "</div>\n\t\t\t\t\t\t\t</div>";
        chat_list.appendChild(list_el);
        var scroll_mx = chat_list.scrollHeight;
        chat_list.scrollTo(0, scroll_mx);
    };
    Chat.prototype.addServerMessageToChatbox = function (chat_list, response) {
        if (chat_list == null) {
            console.log('chat_list NULL');
            return;
        }
        var list_el = document.createElement('LI');
        list_el.innerHTML = "<li>\n\t\t\t\t\t\t\t\t<div class='col-12 px-4 py-2 text-left font-italic'>" + response + "\n\t\t\t\t\t\t\t\t</div>\n\t\t\t\t\t\t\t</li>";
        chat_list.appendChild(list_el);
        var scroll_mx = chat_list.scrollHeight;
        chat_list.scrollTo(0, scroll_mx);
    };
    return Chat;
}());
var GlobalChat = /** @class */ (function (_super) {
    __extends(GlobalChat, _super);
    function GlobalChat(chat_object, websocket) {
        var _this = this;
        if (chat_object == null) {
            console.log('chat_object NULL');
            return;
        }
        _this = _super.call(this, chat_object, websocket) || this;
        _this.initializeChat(chat_object.getElementsByTagName('INPUT')[0], 'global');
        _this.handleGlobalChatMessages();
        _this.enableGlobalChatInfo();
        _this.fillBox();
        return _this;
    }
    GlobalChat.prototype.handleGlobalChatMessages = function () {
        var _this = this;
        this.chat_socket.socketListener('global-client-message', function (response) {
            var name_col_width = 2;
            _this.addTextToChatbox(_this.main_chat_box.getElementsByTagName('UL')[1], name_col_width, response['contents'], response['sender']);
        });
    };
    GlobalChat.prototype.enableGlobalChatInfo = function () {
        var _this = this;
        this.chat_socket.socketListener('global-chat-setup', function (chatter_list) {
            document.getElementById('global-count').textContent = chatter_list.length + ' People Online';
            var player_list = _this.main_chat_box.getElementsByTagName('UL')[0];
            var player_list_text = "<li><mark class='' id='current-user'>" + GameConstants.client_name + "(" + GameConstants.socket_id.substr(0, 4) + ")</mark></li>";
            chatter_list.forEach(function (el) {
                if (el == GameConstants.client_name + "(" + GameConstants.socket_id.substr(0, 4) + ")")
                    return;
                player_list_text += "<li><div>" + el + "</div></li>";
            });
            player_list.innerHTML = player_list_text;
        });
    };
    GlobalChat.prototype.fillBox = function () {
        var _this = this;
        this.chat_socket.socketListener('global-fill', function (response_list) {
            var string_to_add = "";
            response_list.forEach(function (response_obj, ind) {
                string_to_add += "<li><div class='row'>\n\t\t\t\t\t\t\t\t<div class='col-" + 2 + " border-right text-right text-truncate font-weight-bold' style='opacity:1.0'>" + response_obj['sender'] + "</div>\n\t\t\t\t\t\t\t\t<div class='col-" + 10 + " text-left'>" + response_obj['contents'] + "</div>\n\t\t\t\t\t\t\t</div></li>";
            });
            _this.main_chat_box.getElementsByTagName('UL')[1].innerHTML = string_to_add;
            var scroll_mx = _this.main_chat_box.getElementsByTagName('UL')[1].scrollHeight;
            _this.main_chat_box.getElementsByTagName('UL')[1].scrollTo(0, scroll_mx);
        });
        this.chat_socket.sendSocket('global-fill', '1');
    };
    return GlobalChat;
}(Chat));
var RoomChat = /** @class */ (function (_super) {
    __extends(RoomChat, _super);
    function RoomChat(chat_object, websocket) {
        var _this = this;
        if (chat_object == null) {
            console.log('chat_object NULL');
            return;
        }
        _this = _super.call(this, chat_object, websocket) || this;
        _this.initializeChat(chat_object.getElementsByTagName('INPUT')[0], 'room');
        _this.handleRoomMessages();
        _this.enableRoomChatInfo();
        return _this;
    }
    RoomChat.prototype.handleRoomMessages = function () {
        var _this = this;
        this.chat_socket.socketListener('room-client-message', function (response) {
            var name_col_width = 3;
            _this.addTextToChatbox(_this.main_chat_box.getElementsByTagName('UL')[0], name_col_width, response['contents'], response['sender']);
        });
        this.chat_socket.socketListener('room-server-message', function (response) {
            _this.addServerMessageToChatbox(_this.main_chat_box.getElementsByTagName('UL')[0], response['contents']);
        });
    };
    RoomChat.prototype.enableRoomChatInfo = function () {
        this.chat_socket.socketListener('room-chat-setup', function (response_list) {
            document.getElementById('room-name').textContent = 'GameID: ' + response_list['Room'];
            var viewers = '';
            response_list['Viewers'].forEach(function (ele, ind) {
                if (ind == 0) {
                    viewers = ele;
                    return;
                }
                viewers += ', ' + ele;
            });
            document.getElementById('challengers').textContent = viewers;
        });
        // this.chat_socket.sendSocket('room-chat-setup', GameConstants.client_name);
    };
    return RoomChat;
}(Chat));
var Settings = /** @class */ (function () {
    function Settings() {
        document.getElementById('name-set').addEventListener('click', function (event) {
            document.cookie = 'code=' + prompt('set new name(available on refresh): ', document.cookie.split('=')[1]);
        });
    }
    return Settings;
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
    socket.socketListener('connected', function (sid) {
        GameConstants.socket_id = sid;
        var room_chat = new RoomChat(document.getElementById('room-chat'), socket);
        var global_chat = new GlobalChat(document.getElementById('global-chat'), socket);
        var settings = new Settings();
    });
    var game = new GameSettings(socket);
};
//# sourceMappingURL=app.js.map