class Socket {
	url:string = "http://96.22.104.33:32232"
	websocket:any = null

	constructor(){	
		this.websocket = io.connect(this.url, {reconnection: false });
		this.socketListener('message', (data:any)=>{
			console.log(data);
		});
		this.socketListener('disconnect', (data:any)=>{
			console.log(data);
			this.websocket.disconnect();
		});
	}
	
	sendSocket(event:string, arg:string):void{
		this.websocket.emit(event, arg);
	}
	
	socketListener(event:any, fn:any){
		this.websocket.on(event, fn);
	}
}