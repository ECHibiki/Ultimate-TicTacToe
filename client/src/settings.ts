class Settings{
	constructor(){
		document.getElementById('name-set')!.addEventListener('click', (event)=>{
			document.cookie = 'code=' + prompt('set new name(available on refresh): ', document.cookie.split('=')[1])
		});
	}
}