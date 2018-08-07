import os
import json
import numpy as np
import time
from random import shuffle
from math import floor, ceil
from flask_socketio import SocketIO, send, emit, join_room, leave_room, close_room, rooms

import matchmake
import chat
import misc

sessions = {}

def start(room_id):
    formSession(room_id)
    emitBoard(room_id)
    
def close(room_id):
    try:
        storeBoard(room_id)
        del sessions[room_id]
    except KeyError:
        pass
        
def formSession(room_id):
    users = room_id.split('-')
    # cid|sid-cid|sid
    client_names = [users[0].split('|')[0], users[1].split('|')[0]]
    socket_names = [users[0].split('|')[1], users[1].split('|')[1]]
    rand = [0,1]
    shuffle(rand)
    sessions[room_id] = { 'Board':
'''- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -
- - - - - - - - -''', 'Reduced-Board': 
'''- - -
- - -
- - -''',  'Turn':'x', 'Previous-Turn':'-', 'Move':0, socket_names[rand[0]]:{'Piece':'x', 'Client-Name':client_names[rand[0]]}, 
                                                      socket_names[rand[1]]:{'Piece':'o', 'Client-Name':client_names[rand[1]]}, 
                                                      'Message':'', 'Observers':[], 'Success':'0'}
   
def emitBoard(room_id, target=None):
    if target==None:
        target = room_id
    emit('board-data',sessions[room_id],room=target)
   
def storeBoard(room_id):
    filename = matchmake._rooms[room_id]['Code'] + '.' + str(time.time()) 
    with open('boards/' + filename + '.json', 'w', encoding='utf-8') as session_handle:
        session_handle.write(json.dumps(sessions[room_id]))
        session_handle.close()
    
def move(sid, position):
    room_id = determineRoom(sid)
    #legal
    if validateTurn(sid, position['x'], position['y'], room_id):
        chat.roomServerMessage(str(misc.generateNameTag(sid, sessions[room_id][sid]['Client-Name']))+ ' moved to ' +
                                   str(position['x'] + 1) + ', ' + str(position['y'] + 1) , room_id)
        placePieceBoard(position['x'], position['y'], room_id)
        sessions[room_id]['Previous-Turn'] = str(position['x']) + "|" + str(position['y'])
        sessions[room_id]['Move'] = sessions[room_id]['Move'] + 1
        
        three_x_three_main = reduce3X3(position['x'], position['y'], sessions[room_id]['Board'])
        if checkGridWon(three_x_three_main):
            three_x_three_reduced = array3X3(sessions[room_id]['Reduced-Board'])
            if three_x_three_reduced[floor(position['y'] / 3)][floor(position['x'] / 3)] == '-':
                sessions[room_id]['Reduced-Board'] = placePieceOn3X3(floor(position['x'] / 3), floor(position['y'] / 3), three_x_three_reduced, sessions[room_id]['Turn'])
                if checkGridWon(three_x_three_reduced):
                    sessions[room_id]['Message'] = 'Player ' + sessions[room_id][sid]['Client-Name'] +'(' + sessions[room_id]['Turn'] + ') wins!'                   
                    chat.roomServerMessage(str(misc.generateNameTag(sid, sessions[room_id][sid]['Client-Name']))+ ' Wins.', room_id)
                    storeBoard(room_id)
                    swapTurn(room_id)
                else:
                    swapTurn(room_id)
                    sessions[room_id]['Message'] = 'Section Won - Turn '+ sessions[room_id]['Turn'] 
            else:
                swapTurn(room_id)
                sessions[room_id]['Message'] = 'Section Already Won - Turn '+ sessions[room_id]['Turn'] 
        else:
            sessions[room_id]['Message'] = ''
            swapTurn(room_id)
        sessions[room_id]['Success'] = '1'
        emitBoard(room_id, target=room_id)
    #illegal
    else:
        sessions[room_id]['Success'] = '0'
        emitBoard(room_id, target=sid)
    
def validateTurn(sid, x, y, room_id):
    if sessions[room_id]['Turn'] == sessions[room_id][sid]['Piece']:
        if not isOverlap(x, y, room_id):
            if propperSegment(x, y, room_id):
                return True
            else:
                sessions[room_id]['Message'] = 'Not a legal move - Previous ' + sessions[room_id]['Previous-Turn']
        else:
            sessions[room_id]['Message'] = 'Piece overlaps'
    else:
        sessions[room_id]['Message'] = 'Not your turn'

    return False

def array3X3(three_x_three):
    three_x_three = three_x_three.split('\n')
    for index, row in enumerate(three_x_three):
            three_x_three[index] = row.split(' ')
    return three_x_three
    
def reduce3X3(x, y, nine_x_nine):
    nine_x_nine = nine_x_nine.split('\n')
    three_x_three = []
    for index, row in enumerate(nine_x_nine):
        if index >= floor(y / 3) * 3 and index < ceil((y+1) / 3) * 3:
            three_x_three.append(row.split(' ')[floor(x / 3) * 3 : ceil((x+1) / 3) * 3])
    return three_x_three

def propperSegment(x, y, room_id):
    if sessions[room_id]['Previous-Turn'] != '-':
        xy_prev = sessions[room_id]['Previous-Turn'].split('|')
        x_prev = int(xy_prev[0]) % 3
        x_cur = floor(x / 3)
        y_prev = int(xy_prev[1]) % 3
        y_cur = floor(y / 3)
           
        reduced_check  = sessions[room_id]['Reduced-Board'].split('\n')
        if reduced_check[y_prev].split(' ')[x_prev] != '-':
            return True    
        if x_prev == x_cur and y_prev == y_cur:
            return True
        else:
            return False
    else:
        return True

def checkGridWon(three_x_three):    
    #row
    for row in three_x_three:
        if row[0] == row[1] and row[0] == row[2] and row[0] != '-' and row[1] != '-' and row[2] != '-':
            return True
    #col
    three_x_three = list(map(list, np.transpose(three_x_three)))
    for col in three_x_three:
        if col[0] == col[1] and col[0] == col[2] and col[0] != '-' and col[1] != '-' and col[2] != '-':
            return True
    #diag
    if  three_x_three[1][1] == three_x_three[0][0] and three_x_three[1][1] == three_x_three[2][2] and three_x_three[1][1] != '-' and three_x_three[0][0] != '-' and three_x_three[2][2] != '-':
        return True
    if three_x_three[1][1] == three_x_three[2][0] and three_x_three[1][1] == three_x_three[0][2] and three_x_three[1][1] != '-' and three_x_three[2][0] != '-' and three_x_three[0][2] != '-':
        return True
    return False
    
def isOverlap(x, y, room_id): 
    board_copy = sessions[room_id]['Board'].split('\n')
    row = board_copy[y].split(' ')
    if row[x] == '-':
        return False
    else:
        return True
        
def placePieceBoard(x, y, room_id):
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
 
def placePieceOn3X3(x, y, three_x_three, piece):
    three_x_three[y][x] = piece
    three_x_three_copy = ''
    for row in three_x_three:
        three_x_three_copy = three_x_three_copy + ' '.join(row) + '\n'
    return three_x_three_copy[:-1]
             
            
def swapTurn(room_id):
    if sessions[room_id]['Turn'] == 'x':
        sessions[room_id]['Turn'] = 'o'
    else:
        sessions[room_id]['Turn'] = 'x'

def determineRoom(sid):
    for room in rooms():
        if room.find('|') > -1:
            return room

def observeRoom(rid):
    sessions[rid]['Observers'].append(rid)