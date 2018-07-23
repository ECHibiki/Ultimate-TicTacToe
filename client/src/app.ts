
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
	constructor(socket:any){
	   var config = {
			type: Phaser.CANVAS,
			width: 500,
			height: 550,
			scene: {
				preload: preload,
				create:create
			}
		};
		this.game = new Phaser.Game(config);
		function preload ()	{
			this.load.image('board', 'sprites/board.jpg');
			this.load.image('x', 'sprites/x.png');
			this.load.image('o', 'sprites/o.png');
			this.info_text =  this.add.text(10, 16, '', { fontSize: '28px', fill: '#fff' });
		}
		function create (){
			this.info_text.setText('connecting...');
			this.board = null;
			this.x = [];
			this.o = [];
					
			socket.socketListener('ready', (data:any)=>{
				this.info_text.setText('Searching for players');
			});
			
			socket.socketListener('disconnect', (data:any)=>{
				this.info_text.setText('Game server is offline');
			});
			
			socket.socketListener('join', (data:any)=>{
				this.info_text.x = 25;
				this.info_text.y = 510;
				this.info_text.setText('Turn X')
				this.board = this.add.image(250, 250, 'board');
				this.x[0] = this.add.image(80, 80, 'x');
				this.o[0] = this.add.image(200, 200, 'o');
			});
			
			socket.socketListener('broken',(data:any)=>{
				this.info_text.x = 10;
				this.info_text.y = 16;
				this.info_text.setText('Disconnected with session')
				this.board.destroy();
				this.x.forEach((el:any, ind:number)=>{
					this.x[ind].destroy();
				});
				this.o.forEach((el:any, ind:number)=>{
					this.o[ind].destroy();
				});
			});
			socket.sendSocket('ready','')
		}
	}
}



window.onload = () => {
    //document.body.innerHTML = "<canvas id='game' width=500 height=500 style='border:solid black 1px'></canvas>";
    var socket = new Socket();
	var game = new GameSettings(socket);
};