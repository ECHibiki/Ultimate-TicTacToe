

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
	
	socket.socketListener('error', (err:string)=>{
		console.log(err);
		alert('Server had an error\n ' + err);
	});
	
	var game = new GameSettings(socket);	
	
	//scale everything to good size
    //scale everything to good size
    var win_width = window.innerWidth / window.devicePixelRatio;
    console.log(win_width);
    if (win_width < 1400) {
        var scale = win_width / 1400;
        var height = 550 * window.devicePixelRatio * scale;
        var width = 500 * window.devicePixelRatio * scale;
        (<HTMLElement>document.getElementById('phaser-game')!.firstChild!).style.height = height + 'px';
        (<HTMLElement>document.getElementById('phaser-game')!.firstChild!).style.width = width + 'px';
        (<HTMLElement>document.getElementById('game-details')!).style.width = width + 'px';
        (<HTMLElement>document.getElementById('game-details')!).style.height = height + 'px';
    }
    else {
        var scale = 1.0;
		var height = 550 * window.devicePixelRatio * scale;
        var width = 500 * window.devicePixelRatio * scale;
        (<HTMLElement>document.getElementById('phaser-game')!.firstChild!).style.height = height + 'px';
        (<HTMLElement>document.getElementById('phaser-game')!.firstChild!).style.width = width + 'px';
        (<HTMLElement>document.getElementById('game-details')!).style.width = width + 'px';
		(<HTMLElement>document.getElementById('game-details')!).style.height = height + 'px';
    }
		var ul_arr = (<NodeListOf<HTMLElement>>document.querySelectorAll("ul[ul-tag='']"));
        ul_arr[0].style.height = document.getElementById('game-details')!.offsetHeight - 
											(100 + document.getElementById('r-h2')!.offsetHeight + document.getElementById('added-msg')!.offsetHeight +  document.getElementById('info-tabs')!.offsetHeight) + 'px';
        ul_arr[1].style.height = document.getElementById('game-details')!.offsetHeight - 
											(180 + document.getElementById('r-h2')!.offsetHeight + document.getElementById('added-msg')!.offsetHeight +  document.getElementById('info-tabs')!.offsetHeight) + 'px';
        ul_arr[2].style.height = document.getElementById('game-details')!.offsetHeight - 
											(183 + document.getElementById('r-h2')!.offsetHeight + document.getElementById('added-msg')!.offsetHeight +  document.getElementById('info-tabs')!.offsetHeight) + 'px';
};