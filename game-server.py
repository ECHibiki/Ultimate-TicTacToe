from flask import Flask
from flask_socketio import SocketIO

import logging
import game
import matchmake
import sessionstart

app = Flask(__name__)
@app.route('/')
def socket_route():
    return open("client/builds/game.js", 'r').read()
@app.route('/socket')
def game_route():
    return game.run()
	
log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)
app.run(port=3231, debug=True)