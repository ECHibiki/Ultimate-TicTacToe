from flask_socketio import SocketIO, send, emit, join_room, leave_room, rooms
import urllib
import matchmake

import misc

chatters = []

def roomMessage(sid, message):
    if message['contents'].strip() == '' or message['sender'].strip() == '': 
        return
        
    client_room = ''
    for room in rooms():
        if room.find('|') > -1:
            client_room = room
            break 
    emit('room-client-message', {'contents': removeHazzards(message['contents']), 'sender': removeHazzards(misc.generateNameTag(sid, message['sender']))}, room=client_room)
 
def roomServerMessage(message, room_id):
    emit('room-server-message', {'contents': removeHazzards(message)}, room=room_id)
 
def roomChatInfo(sid, cid):
    room_name = ''
    for room in rooms():
        if room.find('|') > -1:
            room_name = room
            break
    if room_name == '':
        room_name = rooms()[-1]
    try:
        all_viewers = matchmake._rooms[room_name]['Viewers']
        for index, viewer in enumerate(all_viewers):
            all_viewers[index] = removeHazzards(viewer)
        room_code = matchmake._rooms[room_name]['Code']
        emit('room-chat-setup', {'Room':room_code, 'Viewers':all_viewers}, room=room_name)
    except KeyError:
        emit('room-chat-setup', {'Room':'Forming...', 'Viewers':[misc.generateNameTag(sid, cid)]}, room=room_name)
    
def globalMessage(sid, message):
    if message['contents'].strip() == '' or message['sender'].strip() == '': 
        return
    message['contents'] = removeHazzards(message['contents']).strip()
    log('chat/global.log', '&lt;' + removeHazzards(misc.generateNameTag(sid, message['sender'].replace(' ', '%20'))) + '&gt; ' + message['contents'])
    emit('global-client-message', {'contents': message['contents'], 'sender': removeHazzards(misc.generateNameTag(sid, message['sender']))},broadcast=True)

def globalChatInfo(sid, cid):
    chatters.append(removeHazzards(misc.generateNameTag(sid, cid)))
    emit('global-chat-setup', chatters, broadcast=True)

def returnLogs(sid):
    log_lines = (open('chat/global.log', 'r', encoding='utf-8').read()).split('\n')
    chat_logs = []
    for line in log_lines:
        sender = line[:line.find(' ')].replace('%20', ' ')
        contents = line[line.find(' '):]
        chat_logs.append({'sender': sender, 'contents': contents})
    emit('global-fill', chat_logs,room=sid)
    
def removeHazzards(line):
    line = line.replace('<', '&lt;')
    line = line.replace('>', '&gt;')
    return line.strip()
    
def log(file, line):
    open(file, 'a', encoding='utf-8').write(line + '\n')
    
def removeGlobalClient(sid):
    try:
        cid = matchmake.sid_cid_pairs[sid]
        del chatters[chatters.index(removeHazzards(misc.generateNameTag(sid, cid)))]
    except KeyError:
        print(sid + ' key err');
    emit('global-chat-setup', chatters, broadcast=True)
