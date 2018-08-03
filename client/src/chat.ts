class Chat{
	main_chat_box:any = null; 
	chat_socket:any = null;
	constructor(chat_object:HTMLElement|null, websocket:any){
		if (chat_object == null){
			console.log('chat_object NULL');
			return;
		}
		this.main_chat_box = chat_object;
		this.chat_socket = websocket;	
	}
	
	initializeChat(text_input_element:HTMLInputElement, label:string):void{
		text_input_element.addEventListener('keydown', (event)=>{
			if(event.keyCode === 13){
				this.chat_socket.sendSocket(label + '-client-message', {'contents':text_input_element.value, 'sender':GameConstants.client_name });
				text_input_element.value = ''
			}
		});
		var name_tab = document.getElementById(label + '-username')!;
		name_tab.textContent = '<' + GameConstants.client_name + '(' + GameConstants.socket_id.substr(0,4) +')>';
		name_tab.addEventListener('click',(event)=>{
			this.chat_socket.sendSocket(label + '-client-message', {'contents':text_input_element.value, 'sender':GameConstants.client_name });
			text_input_element.value = ''
		});
	}
	
	
	addTextToChatbox(chat_list:Node|null, name_width:number, response:string, sender:string):void{
		if (chat_list == null){
			console.log('chat_list NULL');
			return;
		}
		var list_el = document.createElement('LI');
		list_el.innerHTML = `<div class='row'>
								<div class='col-` + name_width + ` border-right text-right text-truncate font-weight-bold' style='opacity:1.0'>&lt;` + sender + `&gt;</div>
								<div class='col-` + (12 - name_width) + ` text-left'>` + response + `</div>
							</div>`;
		chat_list.appendChild(list_el);
		var scroll_mx = (<HTMLElement>chat_list).scrollHeight;
		(<HTMLElement>chat_list).scrollTo(0,scroll_mx);
	}
	addServerMessageToChatbox(chat_list:Node|null, response:string):void{
		if (chat_list == null){
			console.log('chat_list NULL');
			return;
		}
		var list_el = document.createElement('LI');
		list_el.innerHTML = `<li>
								<div class='col-12 px-4 py-2 text-left font-italic'>` + response + `
								</div>
							</li>`;
		chat_list.appendChild(list_el);
		var scroll_mx = (<HTMLElement>chat_list).scrollHeight;
		(<HTMLElement>chat_list).scrollTo(0,scroll_mx);
												
	}
}