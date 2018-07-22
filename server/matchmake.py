from flask import Flask, request
from flask_socketio import SocketIO, send, emit, join_room, leave_room, close_room, rooms

_rooms = []

def checkJoin(sid):
    waiting_list_handle = open('waiting', 'r')
    waiting_list_text = waiting_list_handle.read()
    if waiting_list_text.find('\n') == -1:
        addSID(sid)
        return False
    else:
        formRoom(waiting_list_text.split('\n')[0], sid)
        return True

def checkDisconnect(sid):
    clear = False
    room_to_clear = ""
    for room in _rooms:
        if room.find(sid) > -1:
            clear = True
            room_to_clear = room
            break
    if clear:
        clearRoom(room_to_clear, sid)
        return True
    else:
        clearSID(sid)
        return False

        
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
    send(sid1 + ' has entered the room.', room=(sid1 + ' vs. ' + sid2))
    send(sid2 + ' has entered the room.', room=(sid1 + ' vs. ' + sid2))
    clearSID(sid1)
    _rooms.append(sid1 + ' vs. ' + sid2)
    
def clearRoom(room_to_clear, sid):
    send(sid + ' has left the room: ' + sid, room=room_to_clear)
    close_room(room_to_clear)
    _rooms.remove(room_to_clear)

    