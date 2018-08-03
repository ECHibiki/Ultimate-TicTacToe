

//From: https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

window.onload = () => {
    //document.body.innerHTML = "<canvas id='game' width=500 height=500 style='border:solid black 1px'></canvas>";
	if(document.cookie == ''){
		var code = prompt('message', makeid());
		if (code == '') code = makeid();
		document.cookie = 'code='+ code;
	}

	GameConstants.client_name = document.cookie.split('=')[1];

    var socket = new Socket();

	socket.socketListener('connected', (sid:string)=>{
		GameConstants.socket_id = sid;
		
		var room_chat = new RoomChat(document.getElementById('room-chat'), socket);
		var global_chat = new GlobalChat(document.getElementById('global-chat'), socket);

		var settings = new Settings();
	});

	
	var game = new GameSettings(socket);	
};