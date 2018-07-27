from flask_socketio import SocketIO, send, emit, join_room, leave_room, rooms
import urllib

def roomMessage(message):
    if message['contents'].strip() == '' or message['sender'].strip() == '': 
        return
    emit('room-message', {'contents': removeHazzards(message['contents']), 'sender': removeHazzards(message['sender'])}, room=rooms()[-1])
    
def globalMessage(message):
    if message['contents'].strip() == '' or message['sender'].strip() == '': 
        return
    log('chat/global.log', '<' + message['sender'].replace(' ', '%20') + '> ' + message['contents'].strip())
    emit('global-message', {'contents': removeHazzards(message['contents']), 'sender': removeHazzards(message['sender'])},broadcast=True)

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