from flask import Flask, request
from flask_socketio import SocketIO, send, emit, join_room, leave_room, close_room, rooms

_rooms = {}
sid_cid_pairs = {}
waiting_users = []

# from https://stackoverflow.com/questions/2257441/random-string-generation-with-upper-case-letters-and-digits-in-python
import string
import random
import traceback

import misc
import session

def id_generator(size=6, chars=string.ascii_uppercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))

def checkJoin(sid,client_id):
    if len(waiting_users) == 0:
        addSID(sid,client_id)
        return False, None
    else:
        #grabs 1st entry with a split and seperates written client ID and socketID
        return True, formRoom(waiting_users[0].decode('utf-8').split('\n')[0].split('-')[0], waiting_users[0].decode('utf-8').split('\n')[0].split('-')[1], sid, client_id)   
        
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
            try:
                if viewer == misc.generateNameTag(sid, sid_cid_pairs[sid]):           
                        return True, room, index
            except:
                err_log = open('err_log', 'a', encoding='utf-8')
                err_log.write(traceback.format_exc())
                print(traceback.format_exc())

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
    waiting_users.append((sid + u'-' + cid).encode('utf-8'))
        
def clearSID(sid):
    found = False
    index = -1
    for pos, user in enumerate(waiting_users):
        if user.decode('utf-8').find(sid) != -1:
            found = True
            index = pos
    if not found:
        return
    
    del waiting_users[index]

  
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
    leave_room(room_to_clear)
    print(str(_rooms[room_to_clear]['Viewers']))
    _rooms[room_to_clear]['Viewers'].pop()
    if len(_rooms[room_to_clear]['Viewers']) == 0:
        try:
            session.close(room_to_clear)
            del _rooms[room_to_clear]
        except KeyError:
            print((u'room ' + room_to_clear + u' already cleared').encode('utf-8'))
        
    # close_room(room_to_clear)

def createSIDCIDPair(sid, cid):
    sid_cid_pairs[sid] = cid

def returnRoomIDs(sid):
    emit(u'room-fill', _rooms ,room=sid)
    
def becomeObserver(sid,cid,rid):
    _rooms[rid]['Viewers'].append(misc.generateNameTag(sid, cid))
    join_room(rid, sid=sid)
    createSIDCIDPair(sid,cid)