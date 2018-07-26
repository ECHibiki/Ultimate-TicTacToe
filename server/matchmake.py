from flask import Flask, request
from flask_socketio import SocketIO, send, emit, join_room, leave_room, close_room, rooms

_rooms = []

def checkJoin(sid,client_id):
    waiting_list_handle = open('waiting', 'r')
    waiting_list_text = waiting_list_handle.read()
    if waiting_list_text.find('\n') == -1:
        addSID(sid,client_id)
        return False, None
    else:
        #grabs 1st entry with a split and seperates written client ID and socketID
        print(waiting_list_text)
        return True, formRoom(waiting_list_text.split('\n')[0].split('-')[0], waiting_list_text.split('\n')[0].split('-')[1], sid, client_id)

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

        
def addSID(sid, cid):
    waiting_list_handle = open('waiting', 'a+')
    waiting_list_handle.write(sid + '-' + cid + '\n')
    waiting_list_handle.close()
        
def clearSID(sid):
    waiting_list_handle = open('waiting', 'r+')
    waiting_list_text = waiting_list_handle.read()
    waiting_list_handle.close()

    if waiting_list_text.find(sid) == -1:
        return
    
    waiting_list_arr = waiting_list_text.split('\n')
    for index, item in enumerate(waiting_list_arr):
        if item.find(sid) > -1:
            del waiting_list_arr[index]
    waiting_list_text =  '\n'.join(waiting_list_arr)
    #print('text: ' + waiting_list_text)
    
    waiting_list_handle = open('waiting', 'w')
    waiting_list_handle.write(waiting_list_text)
    waiting_list_handle.close()
  
def formRoom(sid1, cid1, sid2, cid2):
    print(cid1 + ' vs. ' + cid2)
    room_id =  (cid1 + '|' + sid1 + '-' + cid2 + '|' + sid2)
    join_room(room_id, sid=sid1)
    join_room(room_id, sid=sid2)
    emit('join', cid1 + ' and ' + cid2 + ' have entered the room.', room=room_id)
    clearSID(sid1)
    _rooms.append(room_id)
    return room_id
    
def clearRoom(room_to_clear, sid):
    print(str(_rooms))
    print(room_to_clear)
    print(sid)
    emit('broken', sid + ' has left the room: ' + sid, room=room_to_clear)
    close_room(room_to_clear)
    try:
        _rooms.remove(room_to_clear)
    except ValueError:
        pass
    return room_to_clear

    