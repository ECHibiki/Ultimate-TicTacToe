from flask import Flask
from flask_socketio import SocketIO, send, emit
import logging

import matchmake
import sessionstart

app = Flask(__name__)
socketio = SocketIO(app, ping_timeout=5, ping_interval=1)
counter = 0
@app.route('/')
def game_route():
    #return open("client/builds/game.js", 'r').read()
    global counter
    counter = counter + 1
    print(str(counter))
    return '/qa/ is gay -- test'
    
@socketio.on('message')
def handle_message(message):
    print('received message: ' + message)     
    
@socketio.on('json')
def handle_json(json):
    print('received json: ' + str(json))
    
@socketio.on('con')
def handle_connection(connected):
    print('received conn: ' + connected) 
    send('received conn')
    
@socketio.on('connect')
def on_connect():
    print("Client connected")

@socketio.on('disconnect')
def on_disconnect():
    print("Client disconnected")	
 
# if __name__ == '__main__':
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)
socketio.run(app, port=3231, host='0.0.0.0', debug=True)