from flask import Flask, request
from flask_socketio import SocketIO, send, emit, join_room, leave_room, close_room, rooms

_rooms = []

def checkJoin(sid):
    waiting_list_handle = open('waiting', 'r')
    waiting_list_text = waiting_list_handle.read()
    if waiting_list_text.find('\n') == -1:
        addSID(sid)
        return False, None
    else:
        return True, formRoom(waiting_list_text.split('\n')[0], sid)

def checkDisconnect(sid):
    clear = False
    room_to_clear = ""
    for room in _rooms:
        if room.find(sid) > -1:
            clear = True
            room_to_clear = room
            break
    if clear:
        return True, clearRoom(room_to_clear, sid)
    else:
        clearSID(sid)
        return False, None

        
def addSID(sid):
    waiting_list_handle = open('waiting', 'a+')
    waiting_list_handle.write(sid + '\n')
    waiting_list_handle.close()
        
def clearSID(sid):
    waiting_list_handle = open('waiting', 'r+')
    waiting_list_text = waiting_list_handle.read()
    waiting_list_handle.close()

    waiting_list_arr = waiting_list_text.split('\n')
    del waiting_list_arr[waiting_list_arr.index(sid)]
    waiting_list_text =  '\n'.join(waiting_list_arr)
    print('text: ' + waiting_list_text)
    
    waiting_list_handle = open('waiting', 'w')
    waiting_list_handle.write(waiting_list_text)
    waiting_list_handle.close()
  
def formRoom(sid1, sid2):
    print(sid1 + ' vs. ' + sid2)
    join_room(sid1 + ' vs. ' + sid2, sid=sid1)
    join_room(sid1 + ' vs. ' + sid2, sid=sid2)
    emit('join', sid1 + ' and ' + sid2 + ' have entered the room.', room=(sid1 + ' vs. ' + sid2))
    clearSID(sid1)
    _rooms.append(sid1 + ' vs. ' + sid2)
    return sid1 + ' vs. ' + sid2
    
def clearRoom(room_to_clear, sid):
    emit('broken', sid + ' has left the room: ' + sid, room=room_to_clear)
    # close_room(room_to_clear)
    _rooms.remove(room_to_clear)
    return room_to_clear

    