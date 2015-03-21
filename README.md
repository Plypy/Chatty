###Fils
app.js: main server logic
conf.js: additional functions
pid: generated file that store the PID of the program

###Details
Use `node app.js &` to run the server, and the server will run in port 4000

And then you can use `telnet` to connect to that server.
Server orginally only support `-quit` and `-help` command,
additional commands reside in `conf.js`, you can change the `handlers` array
inside it to choose modules to use.

Once the `conf.js` is updated, you can use `kill -s SIGHUP (pid)` to reload it.

As this simple chat server is a proof-of-concept thing, lots of details are omitted.
