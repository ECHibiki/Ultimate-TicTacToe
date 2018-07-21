#!/usr/bin/python
print "Content-type: text/html\n\n";
import cgitb
import cgi
import socket
import os

print(socket.gethostbyname(socket.gethostname()) + "<br/>") 
print(cgi.escape(os.environ["REMOTE_ADDR"]))

