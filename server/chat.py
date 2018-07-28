from flask_socketio import SocketIO, send, emit, join_room, leave_room, rooms
import urllib
import matchmake

import misc

chatters = []

def roomMessage(sid, message):
    print(rooms()[-1])
    if message['contents'].strip() == '' or message['sender'].strip() == '': 
        return
    emit('room-client-message', {'contents': removeHazzards(message['contents']), 'sender': removeHazzards(misc.generateNameTag(sid, message['sender']))}, room=rooms()[-1])
 
def roomServerMessage(message, room_id):
    emit('room-server-message', {'contents': message}, room=room_id)
 
def roomChatInfo(sid, cid):
    room_name = rooms()[-1]
    print(matchmake._rooms)
    try:
        all_viewers = matchmake._rooms[room_name]['Viewers']
        room_code = matchmake._rooms[room_name]['Code']
        print(all_viewers)
        emit('room-chat-setup', {'Room':room_code, 'Viewers':all_viewers}, room=room_name)
    except KeyError:
        emit('room-chat-setup', {'Room':'Forming...', 'Viewers':[misc.generateNameTag(sid, cid)]}, room=room_name)
    roomServerMessage('Client ' + cid + ' has joined the room',room_name)
     
def globalMessage(sid, message):
    if message['contents'].strip() == '' or message['sender'].strip() == '': 
        return
    log('chat/global.log', '<' + misc.generateNameTag(sid, message['sender'].replace(' ', '%20')) + '> ' + message['contents'].strip())
    print (str({'contents': removeHazzards(message['contents']), 'sender': removeHazzards(misc.generateNameTag(sid, message['sender']))}))
    emit('global-client-message', {'contents': removeHazzards(message['contents']), 'sender': removeHazzards(misc.generateNameTag(sid, message['sender']))},broadcast=True)

def globalChatInfo(sid, cid):
    chatters.append(misc.generateNameTag(sid, cid))
    emit('global-chat-setup', chatters, broadcast=True)

def returnLogs(sid):
    log_lines = removeHazzards(open('chat/global.log').read()).split('\n')
    to_emit = []
    for line in log_lines:
        sender = line[:line.find(' ')].replace('%20', ' ')
        contents = line[line.find(' '):]
        to_emit.append({'sender': sender, 'contents': contents})
    emit('global-fill', to_emit,room=sid)
    
def removeHazzards(line):
    line = line.replace('<', '&lt;')
    line = line.replace('>', '&gt;')
    return line.strip()
    
def log(file, line):
    open(file, 'a').write(line + '\n')
    
def clearChatter(sid):
    cid = matchmake.sid_cid_pairs[sid]
    del chatters[chatters.index(misc.generateNameTag(sid, cid))]
    emit('global-chat-setup', chatters, broadcast=True)
