from flask import Flask, request, send_from_directory
from flask_socketio import SocketIO, send, emit, join_room, leave_room, rooms
from werkzeug.contrib.fixers import ProxyFix
import logging

import matchmake
import session
import chat

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, num_proxies=1)
def get_remote_addr(self, forwarded_for):
    if len(forwarded_for) >= self.num_proxies:
        return forwarded_for[-self.num_proxies]
socketio = SocketIO(app, ping_timeout=10, ping_interval=5)
counter = 0
@app.route('/')
def gameRoute():
    #return open("client/builds/game.js", 'r').read()
    global counter
    counter = counter + 1
    print('Number of connections to / : ' + str(counter))
    return open('index.html', 'r', encoding='cp932', errors='ignore').read()
    
@app.route('/<path:path>')
def rscRoute(path):
    return send_from_directory('',path)

@app.route('/sprites/<path:path>')
def spriteRoute(path):
    return send_from_directory('sprites', path)
    
@socketio.on('message')
def handleMessage(message):
    print('received message: ' + message)     
    
@socketio.on('json')
def handleJSON(json):
    print('received json: ' + str(json))
        
@socketio.on('connect')
def onConnect():
    print("Client connected: " + request.sid)

@socketio.on('disconnect')
def onDisconnect():
    socket_id = request.sid
    session_closed, room_id =  matchmake.checkDisconnect(socket_id);
    if session_closed:
        session.close(room_id)
    print("Client disconnect: " + socket_id)
    
@socketio.on('ready')
def onConnect(client_name):
    socket_id = request.sid
    client_id = client_name
    emit('ready',socket_id)
    session_formed, room_id =  matchmake.checkJoin(socket_id, client_id);
    if session_formed:
        session.start(room_id)
    print("Client ready: " + socket_id)
 
@socketio.on('move')
def onMove(position):
    if len(rooms()) < 2:
        return
    print(str(position))
    socket_id = request.sid
    session.move(socket_id, position)
    print("Client Moved: " + socket_id + ' to ' + str(position['x']) + '-'+ str(position['y']))
    
@socketio.on('global-message')
def onGlobalMessage(g_message):
    print('global: ' + str(g_message))
    chat.globalMessage(g_message)
    
@socketio.on('global-fill')
def onGlobalMessage(f_message):
    socket_id = request.sid
    print('fill chat: ' + str(socket_id))
    chat.returnLogs(socket_id)

@socketio.on('room-message')
def onRoomMessage(r_message):
    print('room: ' + str(r_message))
    chat.roomMessage(r_message)

 
# if __name__ == '__main__':
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)
socketio.run(app, port=3231, host='0.0.0.0', debug=True)