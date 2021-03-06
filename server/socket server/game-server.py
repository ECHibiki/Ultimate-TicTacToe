from flask import Flask, request, send_from_directory
from flask_socketio import SocketIO, send, emit, join_room, leave_room, rooms
from werkzeug.contrib.fixers import ProxyFix
import logging

import matchmake
import session
import chat
import misc

import traceback

app = Flask(__name__)
app.secret_key = 'hjksdertyhoua/sdfg'
socketio = SocketIO(app, allow_upgrades=True, engineio_logger=False) #ping_timeout=20, ping_interval=10,
# @app.route('/')
# def gameRoute():
    # #return open("client/builds/game.js", 'r').read()
    # return open('index.html', 'r', encoding='utf-8', errors='ignore').read()
    
# @app.route('/<path:path>')
# def rscRoute(path):
    # return send_from_directory('',path)

# @app.route('/sprites/<path:path>')
# def spriteRoute(path):
    # return send_from_directory('sprites', path)

# @app.route('/sfx/<path:path>')
# def sfxRoute(path):
    # return send_from_directory('sfx', path)        
    
@socketio.on('ping')
def handleMessage(message):
    print('received message: ' + message)     
    
@socketio.on('pong')
def handleJSON(message):
    print('received message: ' + str(message))
        
@socketio.on('connect')
def onConnect():
    emit('connected', request.sid)
    print(u"Client connected: " + request.sid)
    
@socketio.on('ready')
def onReady(client_name):
    try:
        socket_id = request.sid
        client_id = client_name
        emit('ready',socket_id)
        session_formed, room_id =  matchmake.checkJoin(socket_id, client_id);
        if session_formed:
            session.start(room_id)
        chat.roomChatInfo(socket_id, client_id) 
        chat.roomServerMessage('Client ' + misc.generateNameTag(socket_id, matchmake.sid_cid_pairs[socket_id]) + ' has joined the room',room_id)
        print((u'Client ready: ' + client_name).encode('utf-8'))
    except Exception:
        err_log = open('err_log', 'a', encoding='utf-8')
        err_log.write(traceback.format_exc())
        print(traceback.format_exc())

@socketio.on('cancel')
def onCancel(client_name):
    try:
        socket_id = request.sid
        session_closed, room_id =  matchmake.checkDisconnect(socket_id);
        if session_closed:
            session.close(room_id)
            chat.roomServerMessage('Client ' + misc.generateNameTag(socket_id, matchmake.sid_cid_pairs[socket_id]) + ' has left the room', room_id)
            matchmake.clearRoom(room_id, socket_id)    
        else:
            room_found, room, index = matchmake.checkObserverDisconnect(socket_id)
            if room_found:
                del matchmake._rooms[room]['Viewers'][index]
                chat.roomServerMessage('Client ' +misc.generateNameTag(socket_id, matchmake.sid_cid_pairs[socket_id]) + ' has left the room', room)
                chat.roomChatInfo(socket_id,  matchmake.sid_cid_pairs[socket_id]) 
        print((u'Client canceled: ' + client_name).encode('utf-8'))
    except Exception:
        err_log = open('err_log', 'a', encoding='utf-8')
        err_log.write(traceback.format_exc())
        print(traceback.format_exc())       

@socketio.on('disconnect')
def onDisconnect():
    try:
        socket_id = request.sid
        chat.removeGlobalClient(socket_id)
        session_closed, room_id =  matchmake.checkDisconnect(socket_id);
        if session_closed:
            chat.roomServerMessage('Client ' + misc.generateNameTag(socket_id, matchmake.sid_cid_pairs[socket_id]) + ' has left the room', room_id)
            matchmake.clearRoom(room_id, socket_id)    
            try:
                del matchmake.sid_cid_pairs[socket_id]
            except KeyError:
                print((u'sid ' + sid + u' already cleared').encode('utf-8'))
        else:
            room_found, room, index = matchmake.checkObserverDisconnect(socket_id)
            if room_found:
                del matchmake._rooms[room]['Viewers'][index]
                chat.roomServerMessage('Client ' + misc.generateNameTag(socket_id, matchmake.sid_cid_pairs[socket_id]) + ' has left the room', room)
                chat.roomChatInfo(socket_id,  matchmake.sid_cid_pairs[socket_id]) 
        print(u"Client disconnect: " + socket_id)
    except Exception:
        err_log = open('err_log', 'a', encoding='utf-8')
        err_log.write(traceback.format_exc())
        print(traceback.format_exc())

@socketio.on('leave')
def onLeave(leave_client):
    try:
        socket_id = request.sid
        session_closed, room_id =  matchmake.checkDisconnect(socket_id);
        if session_closed:
            chat.roomServerMessage('Client ' + misc.generateNameTag(socket_id, matchmake.sid_cid_pairs[socket_id]) + ' has left the room', room_id)
            matchmake.clearRoom(room_id, socket_id)    
        else:
            room_found, room, index = matchmake.checkObserverDisconnect(socket_id)
            if room_found:
                del matchmake._rooms[room]['Viewers'][index]
                chat.roomServerMessage('Client ' + misc.generateNameTag(socket_id, matchmake.sid_cid_pairs[socket_id]) + ' has left the room', room)
                chat.roomChatInfo(socket_id,  matchmake.sid_cid_pairs[socket_id]) 
        print(u"Client left: " + socket_id)
    except Exception:
        err_log = open('err_log', 'a', encoding='utf-8')
        err_log.write(traceback.format_exc())
        print(traceback.format_exc())

@socketio.on('spectate-room')
def onSpectate(data):
    try:
        socket_id = request.sid
        client_id = data['client_name']
        room_id = data['room']
        matchmake.becomeObserver(socket_id, client_id, room_id)
        session.observeRoom(room_id)
        emit('spectate-join', socket_id)
        print(u"Client spectating: " + str(data))
    except Exception:
        err_log = open('err_log', 'a', encoding='utf-8')
        err_log.write(traceback.format_exc())
        print(traceback.format_exc())
    
@socketio.on('spectate-connect')
def onSpectate(data):
    try:
        socket_id = request.sid
        client_id = data['client_name']
        room_id = data['room']
        session.emitBoard(room_id, socket_id)
        chat.roomChatInfo(socket_id, client_id) 
        chat.roomServerMessage('Client ' + misc.generateNameTag(socket_id, matchmake.sid_cid_pairs[socket_id]) + ' has joined the room (Spectating)',room_id)
        print(u"Client spectating: " + str(data))
    except Exception:
        err_log = open('err_log', 'a', encoding='utf-8')
        err_log.write(traceback.format_exc())
        print(traceback.format_exc())
    
@socketio.on('client-load')
def onLoad(client_name):
    try:
        socket_id = request.sid
        client_id = client_name
        matchmake.createSIDCIDPair(socket_id, client_id)
        chat.globalChatInfo(socket_id, client_id)
        print((u"Client load: " + client_name).encode('utf-8'))
    except Exception:
        err_log = open('err_log', 'a', encoding='utf-8')
        err_log.write(traceback.format_exc())
        print(traceback.format_exc())
 
@socketio.on('move')
def onMove(position):
    try:
        print(str(rooms()))
        if len(rooms()) < 2:
            return
        socket_id = request.sid
        session.move(socket_id, position)
        print(u"Client Moved: " + socket_id + ' to ' + str(position['x']) + '-'+ str(position['y']))
    except Exception:
        err_log = open('err_log', 'a', encoding='utf-8')
        err_log.write(traceback.format_exc())
        emit('disconnect', '')
        print(traceback.format_exc())

@socketio.on('global-client-message')
def onGlobalMessage(g_message):
    try:
        socket_id = request.sid
        chat.globalMessage(socket_id, g_message)
        print(u"Client messaged-G: " + str(g_message))
    except Exception:
        err_log = open('err_log', 'a', encoding='utf-8')
        err_log.write(traceback.format_exc())
        print(traceback.format_exc())
    
@socketio.on('global-fill')
def onGlobalFill(fg_message):
    try:
        socket_id = request.sid
        chat.returnLogs(socket_id)
        print(u"Client filled: " + socket_id)
    except Exception:
        err_log = open('err_log', 'a', encoding='utf-8')
        err_log.write(traceback.format_exc())
        print(traceback.format_exc())

@socketio.on('room-client-message')
def onRoomMessage(r_message):
    try:
        socket_id = request.sid
        chat.roomMessage(socket_id, r_message)
        print(u"Client messaged-R: " + str(r_message))
    except Exception:
        err_log = open('err_log', 'a', encoding='utf-8')
        err_log.write(traceback.format_exc())
        print(traceback.format_exc())

@socketio.on('room-fill')
def onRoomFill(fr_message):
    try:
        socket_id = request.sid
        matchmake.returnRoomIDs(socket_id)
    except Exception:
        err_log = open('err_log', 'a', encoding='utf-8')
        err_log.write(traceback.format_exc())
        print(traceback.format_exc())
 
# if __name__ == '__main__':
log = logging.getLogger('werkzeug')
log.setLevel(logging.NOTSET)
print('server setting')
socketio.run(app, port=3801, host='0.0.0.0', debug=False)
print('server set')