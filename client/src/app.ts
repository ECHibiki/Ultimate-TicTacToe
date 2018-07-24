
class Socket {
	url:string = "http://144.172.129.226:3231"
	websocket:any = null

	constructor(){	
		this.websocket = io.connect(this.url, {reconnection: false });
		this.socketListener('message', (data:any)=>{console.log(data)});
	}
	
	sendSocket(event:string, arg:string):void{
		this.websocket.emit(event, arg);
	}
	
	socketListener(event:any, fn:any){
		this.websocket.on(event, fn);
	}
}

class GameSettings{
	game:any = null; 
	info_text:any = null;
	client_id:string = ''
	players_turn:boolean = false
	player_piece:string = ''
	board_width:number = 500
	board_height:number = 550
	
	constructor(socket:any){
		
		var that = this;
	   var config = {
			type: Phaser.CANVAS,
			width: this.board_width,
			height: this.board_height,
			scene: {
				preload: preload,
				create:create
			},
			parent:'phaser-game'
		};
		
		
		this.game = new Phaser.Game(config);
		
		function preload ()	{
			this.load.image('board', 'sprites/board.jpg');
			this.load.image('x', 'sprites/x.png');
			this.load.image('o', 'sprites/o.png');
			this.info_text =  this.add.text(10, 16, '', { fontSize: '22px', fill: '#fff' });
		}
		
		function create (){
			this.info_text.setText('connecting...');
			this.board = null;
			this.x_cursor_icon = null;
			this.o_cursor_icon = null;
			this.x_board = [];
			this.o_board = [];
					
			//socket handlers
			socket.socketListener('ready', (data:any)=>{
				this.info_text.setText('Searching for players...');
				console.log(data)
				this.client_id = data
				
			});
			socket.socketListener('disconnect', (data:any)=>{
				this.info_text.setText('Game server is offline');
			});
			
			socket.socketListener('join', (data:any)=>{
				this.info_text.x = 25;
				this.info_text.y = 510;
				this.info_text.setText('Setting up game...')
				this.board = this.add.image(250, 250, 'board');
				this.x_cursor_icon = this.add.image(900, 0, 'x');
				this.o_cursor_icon = this.add.image(900, 0, 'o');	
			});
			
			socket.socketListener('broken',(data:any)=>{
				this.info_text.setText('Disconnected with other session')
			});
			socket.socketListener('board-data',(data:any)=>{
				//turns
				if(data[this.client_id] == data['Turn']){
					this.info_text.setText('Turn ' + data['Turn'] + '(you) - Move ' + data['Move'])
					this.players_turn = true
					this.player_piece = data['Turn']
					// if( data['Turn'] == 'x') this.x_cursor_icon.visible = true;
					// else this.o_cursor_icon.visible = true;
				}
				else{
					this.info_text.setText('Turn ' + data['Turn'] + '(opponent) - Move ' + data['Move']);
					this.players_turn = false;
					// if( data['Turn'] == 'x') this.x_cursor_icon.visible = false;
					// else this.o_cursor_icon.visible = false;
				}
				//Extra messages
				if(data['Message'] != ''){
					this.info_text.setText(data['Message'])
				}				
				//board clear
				this.x_board.forEach((el:any, ind:number)=>{
					this.x_board[ind].destroy();
				});
				this.o_board.forEach((el:any, ind:number)=>{
					this.o_board[ind].destroy();
				});
				//board draw
				var board:string[] = data['Board'].split('\n');
				board.forEach((el:string, ind_y:number)=>{
					var el_split:string[] = el.split(' ')
					el_split.forEach((e:string, ind_x:number)=>{
						if(e == 'x'){
							this.x_board.push(this.add.image(ind_x * 500 / 9 + 500 / 18, ind_y * 500 / 9 + 500 / 18, 'x'));
						}
						else if(e == 'o'){
							this.o_board.push(this.add.image(ind_x * 500 / 9 + 500 / 18, ind_y * 500 / 9 + 500 / 18, 'o'));
						}
					});
				});
			});			
			
			//input handlers
			this.input.on('pointerdown',(event:MouseEvent)=>{
				if(this.players_turn){
					let y = event.y;
					if(y > 499) y = 499;
					let x = event.x;
					var seg_xy = {
						'x': Math.floor(x / (500 / 9)),
                        'y': Math.floor(y / (500 / 9)),
					};
					socket.sendSocket('move', seg_xy);
				}
			});
			//input handlers
			this.input.on('pointermove',(event:MouseEvent)=>{
				if(this.players_turn){
					let y = event.y;
					if(y > 499) y = 499;
					let x = event.x;
					var seg_xy = {
						'x': Math.floor(x / (500 / 9)) * (500 / 9) + (500 / (9 * 2)),
                        'y': Math.floor(y / (500 / 9)) * (500 / 9) + (500 / (9 * 2)),
					};
					if(this.player_piece == 'x'){
						this.x_cursor_icon.x = seg_xy['x'];
						this.x_cursor_icon.y = seg_xy['y'];
					}
					else{
						this.o_cursor_icon.x = seg_xy['x'];
						this.o_cursor_icon.y = seg_xy['y'];
					}	
				}
			}, this);

			//send ready sign
			socket.sendSocket('ready',document.cookie)
		}
	}	
}

//From: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

window.onload = () => {
    //document.body.innerHTML = "<canvas id='game' width=500 height=500 style='border:solid black 1px'></canvas>";
	if(document.cookie == undefined){
		document.cookie = 'code='+makeid();
	}
    var socket = new Socket();
	var game = new GameSettings(socket);
};