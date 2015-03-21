/**
 * Simple TCP chat server implemented by Node'js.
 * Use `node app.js` to start the server and it will listen to localhost:4000.
 * The configration file are stored in conf.js.
 * You can start it in daemon mode, and its PID will be stored in `./pid`.
 * By using `kill -s SIGHUP $PID`, you'd be able to reload the configuration files.
 **/

var net = require('net');
var rl = require('readline');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var confPath = path.join(__dirname, "/conf.js");
var conf = require(confPath);
var fs = require('fs');

var MAX_LEN = 1000;
var MAX_IDLE_TIME = 60000; // 60s

// messages
var HELP_BAS = 'These commands are for your benifits: \n' +
               '-help --- show help manual\n' +
               '-quit --- quit the chat server\n';
var helpMsg = HELP_BAS;
var addon = {};

var LOGIN_MSG = 'Please name yourself: \n';
var TOO_LONG_MSG = 'The maximum length of one message is 1000, please note that\n';
var DUPLICATE_MSG = 'Oops, this name has been used, please try again:\n';

// configurations
var reloadConf = function () {
  helpMsg = HELP_BAS + conf.help;
  addon = conf.handler;
};

// init load
reloadConf();

// naive database
var db = {};
var number = 0;

var showUser = function () {
  console.log('current users:');
  for (var name in db) {
    console.log(name);
  }
  console.log();
};
var incNumber = function () {
  ++number;
  showUser();
};
var decNumber = function () {
  --number;
  showUser();
};

var broadcast = function (msg, senderName) {
  for (var name in db) {
    if (name === senderName) { // don't send back to the sender
      continue;
    }
    var client = db[name];
    client.write(senderName + ': ' + msg + '\n');
  }
};

var server = net.createServer(function (socket) {
  // init
  socket.addr = socket.remoteAddress + ':' + socket.remotePort;
  console.log('a new client connected: ' + socket.addr);
  socket.login = false;
  socket.name = null;

  // timer
  socket.timer = setInterval(function () {
    inputEmitter.emit('timeout');
  }, MAX_IDLE_TIME);

  var resetTimer = function() {
    clearInterval(socket.timer);
    socket.timer = setInterval(function () {
      socket.inputEmitter.emit('timeout');
    }, MAX_IDLE_TIME);
  };

  // auto disconnect logic
  socket.inputEmitter = new EventEmitter();
  socket.inputEmitter.on('timeout', function () {
    console.log('kill dead client ' + socket.addr);
    socket.end('You seem to be dead, so long!\n');
  });
  socket.inputEmitter.on('input', resetTimer);


  // hello works
  socket.write(helpMsg);
  socket.write('Current users: ' + number + '\n');
  socket.write(LOGIN_MSG);

  socket.on('end', function() {
    clearInterval(socket.timer);
    if (socket.login) {
      delete db[socket.name];
    }
    console.log('client ' + socket.addr + ' has disconnected');
    if (socket.login) {
      broadcast(socket.name + ' has left', socket.name);
    }
    decNumber();
  });

  // process the data
  socket.on('data', function(data) {
    socket.inputEmitter.emit('input');
    // prep works
    data = data.toString();
    data = data.trim(); // remove trailing crap
    console.log(socket.addr + ": " + data);

    if (data.length === 0) { // ignore empty message
      return;
    }
    if (data.length > MAX_LEN) {// prevent long request attacks(naive way)
      socket.write(TOO_LONG_MSG);
      return;
    }

    if (!socket.login) {
      if (db[data]) { // duplicate
        socket.write(DUPLICATE_MSG);
        return;
      } else { // logged in
        socket.name = data;
        db[socket.name] = socket;
        console.log(socket.name + ' has joined the chat');
        broadcast(socket.name + ' has joined the chat', socket.name);
        socket.login = true;
        incNumber();
      }
      return;
    }

    // basics
    if (data === '-quit') { // quit
      socket.end('bye!\n');
      return;
    }

    if (data === '-help') { // show help messages
      socket.write(helpMsg);
      return ;
    }

    // check addon functionalities
    var ar = data.split(' ');
    var handler = addon[ar[0]];
    if (handler) {
      var args = ar.slice(1, handler.length);
      args.push(function(data) {
        socket.write(data);
      });
      return handler.apply(null, args);
    }

    broadcast(data, socket.name);
  });
});

server.listen(4000, function() {
  console.log('Chat server started on port 4000');
});

// reload the configuration files
process.on('SIGHUP', function () {
  console.log('Received a SIGHUP, reloading the configration');
  // delete and reload
  delete require.cache[confPath];
  conf = require(confPath);
  reloadConf(conf);
  console.log('Reloaded the configuration');
});

// write the pid
console.log('The server\'s PID is: ' + process.pid +
           ', and it will be stored in' + path.join(__dirname, 'pid'));
fs.writeFileSync('pid', process.pid);
