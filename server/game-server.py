from flask import Flask, request
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
    
@app.route('/app.js')
def js_route():
    return open('app.js', 'r', encoding='cp932', errors='ignore').read()
    
@socketio.on('message')
def handle_message(message):
    print('received message: ' + message)     
    
@socketio.on('json')
def handle_json(json):
    print('received json: ' + str(json))
        
@socketio.on('connect')
def on_connect():
    user_id = request.sid
    session_formed =  matchmake.checkJoin(user_id);
    print("Client connected: " + user_id)

@socketio.on('disconnect')
def on_disconnect():
    user_id = request.sid
    matchmake.checkDisconnect(user_id);
    print("Client disconnect: " + user_id)
    
@socketio.on('join')
def on_join(data):
    username = session['username']
    room = data['room']
    send(username + ' has entered the room.', room=room)
    
@socketio.on('leave')
def on_leave(data):
    username = session['username']
    room = data['room']
    send(username + ' has left the room.', room=room)
 
# if __name__ == '__main__':
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)
socketio.run(app, port=3231, host='0.0.0.0', debug=True)