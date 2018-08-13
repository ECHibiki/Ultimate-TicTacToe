class RoomChat extends Chat{
	constructor(chat_object:HTMLElement|null, websocket:any){
		if (chat_object == null){
			console.log('chat_object NULL');
			return;
		}
		super(chat_object, websocket);
		this.initializeChat(<HTMLInputElement>chat_object.getElementsByTagName('INPUT')[0], 'room');
		
		this.handleRoomMessages();	
		this.retrieveRoomChatInfo();
	}
	
	handleRoomMessages():void{
		this.chat_socket.socketListener('room-client-message', (response:any)=>{
			var name_col_width:number = 4
			this.addTextToChatbox(this.main_chat_box.getElementsByTagName('UL')![0], name_col_width, response['contents'], response['sender']);
		});
		
		this.chat_socket.socketListener('room-server-message', (response:any)=>{
			this.addServerMessageToChatbox(this.main_chat_box.getElementsByTagName('UL')[0], response['contents']);
		});
	}
	
	retrieveRoomChatInfo():void{
		this.chat_socket.socketListener('room-chat-setup', (response_list:any)=>{
			document.getElementById('room-name')!.textContent = 'GameID: ' + response_list['Room'];
			var viewers = ''
			
			response_list['Viewers'].forEach((ele:string, ind:number)=>{
				if(ele.length > 20) ele = ele.substr(0,20) + '...'
				if (ind == 0){
					viewers = ele;
					return
				}
				viewers += ', ' + ele;
			});
			document.getElementById('challengers')!.textContent = viewers;

		});
		
		// this.chat_socket.sendSocket('room-chat-setup', GameConstants.client_name);
	}
	
	
}