class GlobalChat extends Chat{
	constructor(chat_object:HTMLElement|null, websocket:any){
		if (chat_object == null){
			console.log('chat_object NULL');
			return;
		}
		super(chat_object, websocket)
		this.initializeSend(<HTMLInputElement>chat_object.getElementsByTagName('INPUT')[0], 'global-message');
		
		this.chat_socket.socketListener('global-message', (response:any)=>{
			var name_col_width:number = 2
			this.addTextToChatbox(chat_object.getElementsByTagName('UL')[1], name_col_width, response['contents'], response['sender']);
		});
		
		this.fillBox()
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