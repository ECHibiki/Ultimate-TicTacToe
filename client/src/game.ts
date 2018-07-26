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
	constructor(socket:any){
		
		var game:any = null; 
		var info_text:any = null;
		var client_id:string = ''
		var players_turn:boolean = false
		var player_piece:string = ''
		var board_width:number = 500
		var board_height:number = 500
		var game_lower_padding = 50
		
		var reapear_location_x:number = -100;
		var reapear_location_y:number = -100;
		
		var config = {
			type: Phaser.AUTO,
			width: board_width,
			height: board_height + game_lower_padding,
			scene: {
				preload: preload,
				create:create
			},
			parent:'phaser-game'
		};

		game = new Phaser.Game(config);
		
		function preload ()	{
			this.load.image('board', 'sprites/board.jpg');
			this.load.image('x', 'sprites/x.png');
			this.load.image('xG', 'sprites/xG.png');
			this.load.image('o', 'sprites/o.png');
			this.load.image('oG', 'sprites/oG.png');
			this.info_text =  this.add.text(10, 16, '', { fontSize: '22px', fill: '#fff' });
		}

		function create (){
			this.info_text.setText('connecting...');
			this.board = null;
			this.x_cursor_icon = null;
			this.x_previous = null;
			this.o_cursor_icon = null;
			this.o_previous = null;
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
				this.x_previous = this.add.image(900, 0, 'xG');
				this.o_cursor_icon = this.add.image(900, 0, 'o');	
				this.o_previous = this.add.image(900, 0, 'oG');	
			});
			
			socket.socketListener('broken',(data:any)=>{
				this.info_text.setText('Disconnected with other session')
			});
			socket.socketListener('board-data',(data:any)=>{
				var previous_x = data['Previous-Turn'].split('|')[0] * board_width / 9 + board_width / 18
				var previous_y = data['Previous-Turn'].split('|')[1] * board_height / 9 + board_height / 18

				//turns
				if(data[this.client_id]['Piece'] == data['Turn']){
					this.info_text.setText('Turn ' + data['Turn'] + '(you) - Move ' + data['Move'])
					this.players_turn = true
					this.player_piece = data['Turn']	
					if(data['Previous-Turn'] != '-'){
						if( data['Turn'] == 'x'){
							this.x_cursor_icon.x = reapear_location_x;
							this.x_cursor_icon.y = reapear_location_y;
							this.o_previous.x = previous_x;
							this.x_previous.x = -100;
							this.o_previous.y = previous_y;						
							this.x_previous.y = -100;						
						} 
						else{
							this.o_cursor_icon.x = reapear_location_x;
							this.o_cursor_icon.y = reapear_location_y;
							this.x_previous.x = previous_x;
							this.o_previous.x = -100;
							this.x_previous.y = previous_y;						
							this.o_previous.y = -100;		
						}
					} 
				}
				else{
					this.info_text.setText('Turn ' + data['Turn'] + '(opponent) - Move ' + data['Move']);
					this.players_turn = false;
					if( data['Turn'] == 'x') this.x_cursor_icon.visible = false;
					else this.o_cursor_icon.visible = false;
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
						if(ind_y == data['Previous-Turn'].split('|')[1] && ind_x == data['Previous-Turn'].split('|')[0]) return;
						if(e == 'x'){
							this.x_board.push(this.add.image(ind_x * board_width / 9 + board_width / 18, ind_y * board_height / 9 + board_height / 18, 'x'));
						}
						else if(e == 'o'){
							this.o_board.push(this.add.image(ind_x * board_width / 9 + board_width / 18, ind_y * board_height / 9 + board_height / 18, 'o'));
						}
					});
				});
			});			
			
			//input handlers
			this.input.on('pointerdown',(event:MouseEvent)=>{
				if(this.players_turn){
					let y = event.y;
					if(y > board_height - 1) y = board_height - 1;
					let x = event.x;
					var seg_xy = {
						'x': Math.floor(x / (board_width / 9)),
						'y': Math.floor(y / (board_height / 9)),
					};
					this.reapear_location_x = x * board_width / 9 + board_width / 18;
					this.reapear_location_y = y * board_height / 9 + board_height / 18;
					socket.sendSocket('move', seg_xy);
				}
			});
			//input handlers
			this.input.on('pointermove',(event:MouseEvent)=>{
				if(this.players_turn){
					let y = event.y;
					if(y > board_height - 1) y = board_height - 1;
					let x = event.x;
					var seg_xy = {
						'x': Math.floor(x / (board_width / 9)) * (board_width / 9) + (board_width / (9 * 2)),
						'y': Math.floor(y / (board_height / 9)) * (board_height / 9) + (board_height / (9 * 2)),
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
			socket.sendSocket('ready',GameConstants.client_name)
		}
	}	
}