from flask import Flask, request
from flask_socketio import SocketIO, send, emit, join_room, leave_room, close_room, rooms

_rooms = {}
sid_cid_pairs = {}

# from https://stackoverflow.com/questions/2257441/random-string-generation-with-upper-case-letters-and-digits-in-python
import string
import random

import misc

def id_generator(size=6, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))

def checkJoin(sid,client_id):
    waiting_list_handle = open('waiting', 'r', encoding='utf-8')
    waiting_list_text = waiting_list_handle.read()
    if waiting_list_text.find('\n') == -1:
        addSID(sid,client_id)
        return False, None
    else:
        #grabs 1st entry with a split and seperates written client ID and socketID
        return True, formRoom(waiting_list_text.split('\n')[0].split('-')[0], waiting_list_text.split('\n')[0].split('-')[1], sid, client_id)   
        
def checkDisconnect(sid):
    room_to_clear = findRoomBySID(sid)
    if room_to_clear != '':
        return True, room_to_clear
    else:
        clearSID(sid)
        return False, None
        
def checkObserverDisconnect(sid):
    for room in _rooms:
        print((str(_rooms[room]['Viewers'])).encode('utf-8'))
        for index, viewer in enumerate(_rooms[room]['Viewers']):
            if viewer == misc.generateNameTag(sid, sid_cid_pairs[sid]):           
                    return True, room, index
    
    return False, None, -1      

def findRoomBySID(sid):
    room_to_clear = ""
    for room in _rooms:
        if room.find(sid) > -1:
            found = True
            room_to_clear = room
            break
    return room_to_clear
        
def addSID(sid, cid):
    waiting_list_handle = open('waiting', 'a+', encoding='utf-8')
    waiting_list_handle.write(sid + u'-' + cid + u'\n')
    waiting_list_handle.close()
        
def clearSID(sid):
    waiting_list_handle = open('waiting', 'r+', encoding='utf-8')
    waiting_list_text = waiting_list_handle.read()
    waiting_list_handle.close()

    if waiting_list_text.find(sid) == -1:
        return
    
    waiting_list_arr = waiting_list_text.split('\n')
    for index, item in enumerate(waiting_list_arr):
        if item.find(sid) > -1:
            del waiting_list_arr[index]
    waiting_list_text =  '\n'.join(waiting_list_arr)
    
    waiting_list_handle = open('waiting', 'w', encoding='utf-8')
    waiting_list_handle.write(waiting_list_text)
    waiting_list_handle.close()
  
def formRoom(sid1, cid1, sid2, cid2):
    print((cid1 + u' vs. ' + cid2).encode('utf-8'))
    room_id =  (cid1 + u'|' + sid1 + u'-' + cid2 + u'|' + sid2)
    join_room(room_id, sid=sid1)
    join_room(room_id, sid=sid2)
    emit(u'join', cid1 + u' and ' + cid2 + u' have entered the room.', room=room_id)
    clearSID(sid1)
    _rooms[room_id] = {u'Code': id_generator(), u'Viewers':[misc.generateNameTag(sid1, cid1), misc.generateNameTag(sid2, cid2)]}
    return room_id
    
def clearRoom(room_to_clear, sid):
    emit(u'broken', sid_cid_pairs[sid] + u' has left the room: ' + sid, room=room_to_clear)
    try:
        del _rooms[room_to_clear]
    except KeyError:
        print((u'room ' + room_to_clear + u' already cleared').encode('utf-8'))
    try:
        del sid_cid_pairs[sid]
    except KeyError:
        print((u'sid ' + sid + u' already cleared').encode('utf-8'))
        
    # close_room(room_to_clear)

def createSIDCIDPair(sid, cid):
    sid_cid_pairs[sid] = cid

def returnRoomIDs(sid):
    emit(u'room-fill', _rooms ,room=sid)
    
def becomeObserver(sid,cid,rid):
    _rooms[rid]['Viewers'].append(misc.generateNameTag(sid, cid))
    join_room(rid, sid=sid)
    createSIDCIDPair(sid,cid)