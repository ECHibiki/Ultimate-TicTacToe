
class Socket {
	url:string = "http://localhost:3231"
	websocket:any = null

	constructor(){
	}

	establishSocket():void{
		this.websocket = io(this.url);
		this.websocket.on('connect', (data:any)=>{	console.log('con');});
		this.websocket.on('disconnect', (data:any)=>{	console.log('dsc');	});
		this.websocket.on("ping", (data:any) => {
			// console.log("received ping");
		});
		this.websocket.on("pong", (data:any) => {
			// console.log("received pong");
		});
		this.websocket.on('message', this.clientMessaged);
		this.websocket.on('error', this.socketError);
	}

	sendSocket(event:string, arg:string):void{
		console.log(this.websocket);
		this.websocket.emit(event, arg);
	}

	clientMessaged(response:any):void{
		console.log('resp: ' + response);
	}

	socketError():void{
		console.log('err')
	}

	closeSocket():void{
		console.log('close')
	}

}

window.onload = () => {
    var socket = new Socket();
    socket.establishSocket();
	//socket.closeSocket(1000,'success');
};