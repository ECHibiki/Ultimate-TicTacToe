import os
from flask_socketio import SocketIO, send, emit, join_room, leave_room, close_room, rooms

def start(room_id):
    session_handle = open('boards/' + room_id, 'w')
    session_handle.write(
'''- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -'''
    )
    session_handle.close()
    emitBoard(room_id)
    
def close(room_id):
    os.remove('boards/' + room_id)
    
def emitBoard(room_id):
    # emit('board', open(room_id, 'r').read(), room=room_id)
   send(open('boards/' + room_id, 'r').read(), room=room_id)