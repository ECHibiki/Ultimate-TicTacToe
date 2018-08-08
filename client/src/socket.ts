class Socket {
	url:string = "localhost:3801"
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
	
	removeSocketListeners(listeners:string[]):void{
		listeners.forEach((ele:string, ind:number)=>{
			console.log(ele)
			this.websocket.off(ele)
		});
	}
}