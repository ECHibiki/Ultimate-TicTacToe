class RoomChat extends Chat{
	constructor(chat_object:HTMLElement|null, websocket:any){
		if (chat_object == null){
			console.log('chat_object NULL');
			return;
		}
		super(chat_object, websocket)
		this.initializeSend(<HTMLInputElement>chat_object.getElementsByTagName('INPUT')[0], 'room-message');
		
		this.chat_socket.socketListener('room-message', (response:any)=>{
			var name_col_width:number = 3
			this.addTextToChatbox(chat_object.getElementsByTagName('UL')[0], name_col_width, response['contents'], response['sender']);
		});
	}
	
}