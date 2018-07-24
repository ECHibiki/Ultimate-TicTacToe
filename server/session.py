import os
import json
from random import shuffle
from flask_socketio import SocketIO, send, emit, join_room, leave_room, close_room, rooms

sessions = {}

def start(room_id):
    formSession(room_id)
    emitBoard(room_id)
    
def close(room_id):
    storeBoard(room_id)
    del sessions[room_id]
    
def formSession(room_id):
    users = room_id.split('-')
    rand = [0,1]
    shuffle(rand)
    print(users)
    print(rand)
    sessions[room_id] = { 'Board':
'''- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -''', 'Turn':'x',  'Move':0, users[rand[0]]:'x', users[rand[1]]:'o', 'Message':''}
   
def emitBoard(room_id):
   emit('board-data',sessions[room_id],room=room_id)
   
def storeBoard(room_id):
    with open('boards/' + room_id + '.json', 'w') as session_handle:
        session_handle.write(json.dumps(sessions[room_id]))
        session_handle.close()
    
def move(sid, position):
    room_id = determineRoom(sid)
    print(room_id)
    if validateTurn(sid, room_id):
        placePiece(position['x'], position['y'], room_id)
        swapTurn(room_id)
        emitBoard(room_id)
        return
    pass
    
def validateTurn(sid, room_id):
    if sessions[room_id]['Turn'] == sessions[room_id][sid]:
        return True
    return False

def placePiece(x, y, room_id):
    board_copy = sessions[room_id]['Board'].split('\n')
    board_to_replace = ''
    for index_r, row in enumerate(board_copy):  
        if index_r == y:
            row = row.split(' ')
            row[x] = sessions[room_id]['Turn']
            row = ' '.join(row)
        board_to_replace = board_to_replace + row + '\n'
    board_to_replace = board_to_replace[:-1]
    sessions[room_id]['Board'] = board_to_replace
            
            

def swapTurn(room_id):
    if sessions[room_id]['Turn'] == 'x':
        sessions[room_id]['Turn'] = 'o'
    else:
        sessions[room_id]['Turn'] = 'x'

def determineRoom(sid):
    return rooms()[1]
