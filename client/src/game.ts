class GameSettings{	
	constructor(socket:any){
				
		var game:any = null; 
		var info_text:any = null;
		var play_text:any = null;		
		var spectate_text:any = null;
		var cancel_text:any = null;
		var back_text:any = null;
		var leave_text:any = null;
				
		var client_id:string = ''
		var players_turn:boolean = false
		var place_in_progress:boolean = false
		var player_piece:string = ''
		var board_width:number = 500
		var board_height:number = 500
		var game_lower_padding = 50
		
		var reapear_location_x:number = 900;
		var reapear_location_y:number = 900;
		
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
		
		document.body.addEventListener('notification-move', (notification:any)=>{
			if(document.hasFocus() == true){
				do{
					var x_ind = document.title.indexOf('(x)');			
					if(x_ind > -1){
						document.title = document.title.substr(x_ind + 3);
					}
					var o_ind = document.title.indexOf('(o)');
					if(o_ind > -1){
						document.title = document.title.substr(o_ind + 3);
					}	
				}
				while (x_ind > -1 || o_ind > -1);
			}
			
			if(document.hasFocus() == false){
				do{
					var x_ind = document.title.indexOf('(x)');			
					if(x_ind > -1){
						document.title = document.title.substr(x_ind + 3);
					}
					var o_ind = document.title.indexOf('(o)');
					if(o_ind > -1){
						document.title = document.title.substr(o_ind + 3);
					}	
				}
				while (x_ind > 3 || o_ind > 3);
				document.title = "(" + notification.detail + ") " + document.title;
			}
		});	
		
		function preload ()	{			
			this.load.image('board', 'sprites/board.jpg');
			this.load.image('menu', 'sprites/mainbg.jpg');
			this.load.image('x', 'sprites/x.png');
			this.load.image('xG', 'sprites/xG.png');
			this.load.image('o', 'sprites/o.png');
			this.load.image('oG', 'sprites/oG.png');	

			this.load.audio('start', ['sfx/game-start.mp3']);
			this.load.audio('move', ['sfx/move-done.mp3']);
			this.load.audio('win', ['sfx/win-fx.mp3']);
			this.load.audio('lose', ['sfx/lose-fx.mp3']);		
		}
		
		function playGame(click_evnt:any){
		
			this.game_start_sfx = this.sound.add('start', {pauseOnBlur:"false"});
			this.move_sfx = this.sound.add('move', {pauseOnBlur:"false"});
			this.lose_sfx = this.sound.add('win', {pauseOnBlur:"false"});
			this.win_sfx = this.sound.add('lose', {pauseOnBlur:"false"});

			this.spectate_text.x = 900;
			this.play_text.x = 900;
			this.leave_text.x = 900;
						
			//socket handlers
			socket.socketListener('ready', (data:any)=>{
				this.info_text.setText('Searching for players...');
				this.info_text.x = 10;
				this.info_text.y = 16;
				this.cancel_text.x = 10;
			});
			socket.socketListener('disconnect', (data:any)=>{
				this.info_text.setText('Game server is offline');
				this.leave_text.x = 390;
				this.leave_text.y = 510;
			});
			
			socket.socketListener('join', (data:any)=>{
				this.cancel_text.x = 900
				
				this.info_text.x = 25;
				this.info_text.y = 510;
				this.info_text.setText('Setting up game...')
				this.board = this.add.image(250, 250, 'board');
				this.x_cursor_icon = this.add.image(900, 0, 'x');
				this.x_previous = this.add.image(900, 0, 'xG');
				this.o_cursor_icon = this.add.image(900, 0, 'o');	
				this.o_previous = this.add.image(900, 0, 'oG');	
				
				this.game_start_sfx.play()
				
			});
			
			socket.socketListener('broken',(data:any)=>{
				this.info_text.setText('Opponent Left');
				this.leave_text.x = 390;
				this.leave_text.y = 510;
			});
			socket.socketListener('board-data',(data:any)=>{
				var previous_x = data['Previous-Turn'].split('|')[0] * board_width / 9 + board_width / 18
				var previous_y = data['Previous-Turn'].split('|')[1] * board_height / 9 + board_height / 18
				
				if(data['Message'].indexOf('wins') > -1){
					this.leave_text.x = 390;
					this.leave_text.y = 510;
				}
				//turns
				if(data['Message'].indexOf('wins') > -1 || data['Message'].indexOf('Won') > -1){
					if(data[GameConstants.socket_id]['Piece'] == data['Turn']){
						this.lose_sfx.play();
					}
					else{
						this.win_sfx.play();
					}
				}
				else if (data['Success'] == '1'){
					this.move_sfx.play();
				}
				
				var notif_ev = new CustomEvent('notification-move', { detail: data['Turn']});
				document.body.dispatchEvent(notif_ev);
				
				if(data[GameConstants.socket_id]['Piece'] == data['Turn']){
					this.place_in_progress = false;
					this.info_text.setText('Turn ' + data['Turn'] + '(you) - Move ' + data['Move'])
					this.players_turn = true
					this.player_piece = data['Turn']
					if(data['Turn'] == 'x') this.x_cursor_icon.visible = true;
					else this.o_cursor_icon.visible = true;
					
				}
				else{
					this.info_text.setText('Turn ' + data['Turn'] + '(opponent) - Move ' + data['Move']);
					this.players_turn = false;
					this.x_cursor_icon.visible = false;
					this.x_cursor_icon.x = 900;
					this.o_cursor_icon.visible = false;
					this.o_cursor_icon.x = 900;
				}
				if(data['Previous-Turn'] != '-'){
					if( data['Turn'] == 'x'){
						this.x_cursor_icon.x = this.reapear_location_x;
						this.x_cursor_icon.y = this.reapear_location_y;
						this.o_previous.x = previous_x;
						this.x_previous.x = -100;
						this.o_previous.y = previous_y;						
						this.x_previous.y = -100;						
					} 
					else{
						this.o_cursor_icon.x = this.reapear_location_x;
						this.o_cursor_icon.y = this.reapear_location_y;
						this.x_previous.x = previous_x;
						this.o_previous.x = -100;
						this.x_previous.y = previous_y;						
						this.o_previous.y = -100;		
					}
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
				var board_data:string[] = data['Board'].split('\n');
				board_data.forEach((el:string, ind_y:number)=>{			
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
			this.input.on('pointerdown', pointDown, this);
			//input handlers
			this.input.on('pointermove',pointMove, this);

			//send ready sign
			socket.sendSocket('ready', GameConstants.client_name);
			
		}
		
		function pointMove(event:MouseEvent){
			if(this.players_turn && this.place_in_progress == false){
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
		}
		
		function pointDown(event:MouseEvent){
			if(this.players_turn){
				this.place_in_progress = true;
				let y = event.y;
				if(y > board_height - 1) y = board_height - 1;
				let x = event.x;
				var seg_xy = {
					'x': Math.floor(x / (board_width / 9)),
					'y': Math.floor(y / (board_height / 9)),
				};
				this.reapear_location_x = Math.floor(x / (board_width / 9)) * board_width / 9 + board_width / 18;
				this.reapear_location_y = Math.floor(y / (board_width / 9)) * board_height / 9 + board_height / 18;
				socket.sendSocket('move', seg_xy);
			}
		}
		
		function cancelSearch(click_evnt:any){
			this.play_text.x = 10;
			this.spectate_text.x = 10;
			this.info_text.x = 900;
			this.cancel_text.x = 900;
			
			socket.sendSocket('cancel', GameConstants.client_name);
			socket.removeSocketListeners(['ready', 'disconnect', 'join', 'broken', 'board-data']);
			//remove input handlers
			this.input.off('pointerdown',pointDown);
			//remove input handlers
			this.input.off('pointermove',pointMove);
		}
		
		function spectateMenu(click_evnt:any){	
			socket.sendSocket('room-fill', GameConstants.client_name);		
			
			this.info_text.x = 900;
			this.play_text.x = 900;
			this.spectate_text.x = 900;
			
			this.back_text.x = 250;
			
			socket.socketListener('room-fill', (rooms_resp:any)=>{
				let num = 0;
				let spacing = 30;
				for (let room in rooms_resp){
					var room_handel = (room_to_join:string)=>{
						this.rooms_list_arr.push(this.add.text(30, (num+1)*spacing, rooms_resp[room_to_join]['Code'], { fontSize: '22px', fill: '#fff' }))
						this.rooms_list_arr[num].setInteractive();
						this.rooms_list_arr[num].on('pointerdown', ()=>{							
							this.rooms_list_arr.forEach((el:any, ind:number)=>{
								this.rooms_list_arr[ind].destroy();
							});
							this.rooms_list_arr.forEach((el:any, ind:number)=>{
								this.rooms_list_arr.splice(ind);
							});
							socket.removeSocketListeners(['room-fill']);
							this.back_text.x = 900;
							spectateRoom(room_to_join, this);
						}, this);
						num++;
					}
					room_handel(room)
				}
			}, this);
		}
		
		function spectateMenuClear(click_evnt:any){
			this.play_text.x = 10;
			this.spectate_text.x = 10;
			this.back_text.x = 900;
			this.rooms_list_arr.forEach((el:any, ind:number)=>{
				this.rooms_list_arr[ind].destroy();
			});
			this.rooms_list_arr.forEach((el:any, ind:number)=>{
				this.rooms_list_arr.splice(ind);
			});
			
			socket.removeSocketListeners(['room-fill']);
		}
		
		function spectateRoom(room:string, this_copy:any){
			socket.sendSocket('spectate-room', {'client_name': GameConstants.client_name, 'room':room});					
			socket.socketListener('spectate-join', (conf:any)=>{
				
				this_copy.info_text.x = 25;
				this_copy.info_text.y = 510;
				
				this_copy.leave_text.x = 390;
				this_copy.leave_text.y = 510;


				
				this_copy.info_text.setText('Setting up game...')
				this_copy.board = this_copy.add.image(250, 250, 'board');
				this_copy.x_cursor_icon = this_copy.add.image(900, 0, 'x');
				this_copy.x_previous = this_copy.add.image(900, 0, 'xG');
				this_copy.o_cursor_icon = this_copy.add.image(900, 0, 'o');	
				this_copy.o_previous = this_copy.add.image(900, 0, 'oG');	
				
				this_copy.move_sfx = this_copy.sound.add('move', {pauseOnBlur:"false"});
				this_copy.lose_sfx = this_copy.sound.add('win', {pauseOnBlur:"false"});
				this_copy.win_sfx = this_copy.sound.add('lose', {pauseOnBlur:"false"});
				
				//socket handlers
				socket.socketListener('ready', (data:any)=>{
					this_copy.info_text.setText('Searching for players...');
					this_copy.info_text.x = 10					
				});
				socket.socketListener('disconnect', (data:any)=>{
					this_copy.info_text.setText('Game server is offline');
				});
				
				socket.socketListener('broken',(data:any)=>{
					this_copy.info_text.setText('Disconnected with other session')
				});
				socket.socketListener('board-data',(data:any)=>{
					var previous_x = data['Previous-Turn'].split('|')[0] * board_width / 9 + board_width / 18
					var previous_y = data['Previous-Turn'].split('|')[1] * board_height / 9 + board_height / 18
					if(data['Message'].indexOf('wins') > -1){
						this.leave_text.x = 390;
						this.leave_text.y = 510;
					}
					//turns
					if(data['Message'].indexOf('wins') > -1 || data['Message'].indexOf('Won') > -1){
						this_copy.win_sfx.play();
					}
					else if (data['Success'] == '1'){
						this_copy.move_sfx.play();
					}
					this_copy.move_sfx.play()
					if(data['Previous-Turn'] != '-'){
						if( data['Turn'] == 'x'){
							this_copy.x_cursor_icon.x = reapear_location_x;
							this_copy.x_cursor_icon.y = reapear_location_y;
							this_copy.o_previous.x = previous_x;
							this_copy.x_previous.x = -100;
							this_copy.o_previous.y = previous_y;						
							this_copy.x_previous.y = -100;						
						} 
						else{
							this_copy.o_cursor_icon.x = reapear_location_x;
							this_copy.o_cursor_icon.y = reapear_location_y;
							this_copy.x_previous.x = previous_x;
							this_copy.o_previous.x = -100;
							this_copy.x_previous.y = previous_y;						
							this_copy.o_previous.y = -100;		
						}
					} 

					this_copy.info_text.setText('Turn ' + data['Turn'] + ' - Move ' + data['Move']);
					this_copy.players_turn = false;
					if( data['Turn'] == 'x') this_copy.x_cursor_icon.visible = false;
					else this_copy.o_cursor_icon.visible = false;

					//Extra messages
					if(data['Message'] != ''){
						this_copy.info_text.setText(data['Message'])
					}				
					//board clear
					this_copy.x_board.forEach((el:any, ind:number)=>{
						this_copy.x_board[ind].destroy();
					});
					this_copy.o_board.forEach((el:any, ind:number)=>{
						this_copy.o_board[ind].destroy();
					});
					//board draw
					var board_data:string[] = data['Board'].split('\n');
					board_data.forEach((el:string, ind_y:number)=>{			
						var el_split:string[] = el.split(' ')
						el_split.forEach((e:string, ind_x:number)=>{
							if(ind_y == data['Previous-Turn'].split('|')[1] && ind_x == data['Previous-Turn'].split('|')[0]) return;
							if(e == 'x'){
								this_copy.x_board.push(this_copy.add.image(ind_x * board_width / 9 + board_width / 18, ind_y * board_height / 9 + board_height / 18, 'x'));
							}
							else if(e == 'o'){
								this_copy.o_board.push(this_copy.add.image(ind_x * board_width / 9 + board_width / 18, ind_y * board_height / 9 + board_height / 18, 'o'));
							}
						});
					});
				});

				socket.sendSocket('spectate-connect', {'client_name': GameConstants.client_name, 'room':room});	
			}, this);
		}

		function leaveRoom(click_evnt:any){
			this.play_text.x = 10;
			this.spectate_text.x = 10;
			this.info_text.x = 900;
			this.cancel_text.x = 900;
			this.back_text.x = 900;		
			this.leave_text.x = 900;		
			
			this.board.x = 900;
			this.board.destroy();
			this.board ='';
			this.x_cursor_icon.x = 900;
			this.x_cursor_icon.destroy();
			this.x_previous.x = 900;
			this.x_previous.destroy();
			this.o_cursor_icon.x = 900;
			this.o_cursor_icon.destroy();	
			this.o_previous.x = 900;
			this.o_previous.destroy();	
			
			//board clear
			this.x_board.forEach((el:any, ind:number)=>{
				this.x_board[ind].x = 900;
				this.x_board[ind].destroy();
			});
			this.o_board.forEach((el:any, ind:number)=>{
				this.o_board[ind].x = 900;
				this.o_board[ind].destroy();
			});			
			this.x_board.forEach((el:any, ind:number)=>{
				this.x_board.splice(ind);
			});
			this.o_board.forEach((el:any, ind:number)=>{
				this.o_board.splice(ind);
			});
				
			
			socket.sendSocket('leave', GameConstants.client_name);
			socket.removeSocketListeners(['spectate-join', 'ready', 'disconnect', 'join', 'broken', 'board-data']);
			//remove input handlers
			this.input.off('pointerdown',pointDown);
			//remove input handlers
			this.input.off('pointermove',pointMove);
		}
		
		function create (){
			this.board = null;
			this.x_cursor_icon = null;
			this.x_previous = null;
			this.o_cursor_icon = null;
			this.o_previous = null;
			this.x_board = [];
			this.o_board = [];
			this.rooms_list_arr = [];		
			
			this.game_start_sfx = null;
			this.move_sfx = null;
			this.lose_sfx = null;
			this.win_sfx = null;
			
			this.add.image(250,275,'menu');
			
			this.info_text =  this.add.text(10, 16, 'building game...', { fontSize: '22px', fill: '#fff' });
			
			this.play_text =  this.add.text(900, 16, 'Play', { fontSize: '32px', fill: '#fff' });
			this.play_text.setInteractive();
			this.play_text.on('pointerdown', playGame, this);
			
			this.spectate_text =  this.add.text(900, 100, 'Spectate', { fontSize: '32px', fill: '#fff' });			
			this.spectate_text.setInteractive();
			this.spectate_text.on('pointerdown', spectateMenu, this);				
			
			this.cancel_text =  this.add.text(900, 100, 'Cancel', { fontSize: '32px', fill: '#fff' });			
			this.cancel_text.setInteractive();
			this.cancel_text.on('pointerdown', cancelSearch, this);				
			
			this.back_text =  this.add.text(900, 100, 'Back', { fontSize: '32px', fill: '#fff' });			
			this.back_text.setInteractive();
			this.back_text.on('pointerdown', spectateMenuClear, this);			

			this.leave_text =  this.add.text(900, 100, 'Leave', { fontSize: '32px', fill: '#fff' });			
			this.leave_text.setInteractive();
			this.leave_text.on('pointerdown', leaveRoom, this);		
			
			this.info_text.x = 900;											
			this.play_text.x = 30;
			this.play_text.y = 30;
			this.spectate_text.x = 30;				
			this.spectate_text.y = 100;		

			socket.sendSocket('client-load', GameConstants.client_name);			
		}
	}	
}