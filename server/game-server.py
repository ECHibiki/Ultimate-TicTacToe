from flask import Flask, request, send_from_directory
from flask_socketio import SocketIO, send, emit, join_room, leave_room
from werkzeug.contrib.fixers import ProxyFix
import logging

import matchmake
import session

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, num_proxies=1)
def get_remote_addr(self, forwarded_for):
    if len(forwarded_for) >= self.num_proxies:
        return forwarded_for[-self.num_proxies]
socketio = SocketIO(app, ping_timeout=5, ping_interval=1)
counter = 0
@app.route('/')
def game_route():
    #return open("client/builds/game.js", 'r').read()
    global counter
    counter = counter + 1
    print('Number of connections to / : ' + str(counter))
    return open('index.html', 'r', encoding='cp932', errors='ignore').read()
    
@app.route('/<path:path>')
def rsc_route(path):
    return send_from_directory('',path)

@app.route('/sprites/<path:path>')
def spr_route(path):
    return send_from_directory('sprites', path)
    
@socketio.on('message')
def handle_message(message):
    print('received message: ' + message)     
    
@socketio.on('json')
def handle_json(json):
    print('received json: ' + str(json))
        
@socketio.on('connect')
def on_connect():
    print("Client connected: " + request.sid)

@socketio.on('disconnect')
def on_disconnect():
    user_id = request.sid
    session_closed, room_id =  matchmake.checkDisconnect(user_id);
    if session_closed:
        session.close(room_id)
    print("Client disconnect: " + user_id)
    
@socketio.on('ready')
def on_connect(ready):
    user_id = request.sid
    session_formed, room_id =  matchmake.checkJoin(user_id);
    if session_formed:
        session.start(room_id)
    else:
        emit('ready','1')
    print("Client ready: " + user_id)
 
# if __name__ == '__main__':
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)
socketio.run(app, port=3231, host='0.0.0.0', debug=True)