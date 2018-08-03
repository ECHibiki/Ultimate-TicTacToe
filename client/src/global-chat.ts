class GlobalChat extends Chat{
	constructor(chat_object:HTMLElement|null, websocket:any){
		if (chat_object == null){
			console.log('chat_object NULL');
			return;
		}
		super(chat_object, websocket)
		this.initializeChat(<HTMLInputElement>chat_object.getElementsByTagName('INPUT')[0], 'global');

		this.handleGlobalChatMessages();
		this.enableGlobalChatInfo();
		this.fillBox();
	}
	
	handleGlobalChatMessages():void{
		this.chat_socket.socketListener('global-client-message', (response:any)=>{
			var name_col_width:number = 2;
			this.addTextToChatbox(this.main_chat_box.getElementsByTagName('UL')[1], name_col_width, response['contents'], response['sender']);
		});
	}
	
	enableGlobalChatInfo():void{
		this.chat_socket.socketListener('global-chat-setup', (chatter_list:any)=>{
			document.getElementById('global-count')!.textContent = chatter_list.length + ' People Online';
			var player_list = this.main_chat_box.getElementsByTagName('UL')[0];
			var player_list_text = "<li><mark class='' id='current-user'>" + GameConstants.client_name + "(" + GameConstants.socket_id.substr(0,4) + ")</mark></li>";
			
			chatter_list.forEach((el:string)=>{
				if(el == GameConstants.client_name + "(" + GameConstants.socket_id.substr(0,4) + ")") return;
				player_list_text += "<li><div>" + el + "</div></li>";
			});
			
			player_list.innerHTML = player_list_text;
		});
	}
	
	
	fillBox():void{
		this.chat_socket.socketListener('global-fill', (response_list:any[])=>{
			var string_to_add = ""
			response_list.forEach((response_obj, ind)=>{
				string_to_add += `<li><div class='row'>
								<div class='col-` + 2 + ` border-right text-right text-truncate font-weight-bold' style='opacity:1.0'>` + response_obj['sender'] + `</div>
								<div class='col-` + 10 + ` text-left'>` + response_obj['contents'] + `</div>
							</div></li>`;
			});
			this.main_chat_box!.getElementsByTagName('UL')[1].innerHTML = string_to_add;
			var scroll_mx = (<HTMLElement>this.main_chat_box!.getElementsByTagName('UL')[1]).scrollHeight;
			(<HTMLElement>this.main_chat_box!.getElementsByTagName('UL')[1]).scrollTo(0,scroll_mx);
		});
		
		this.chat_socket.sendSocket('global-fill','1');
	}
}