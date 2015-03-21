// wrapper for additional functions of server
// the handler is a object that has such attributes .func, .help and .prefix
// the handler function .func's argument should end with a callback
// .help is just a manual
// .prefix is the command prefix
// modify the `handlers` array to change the modules to load

var http = require('http');

// wrapper for http.get
var httpGet = function(url, callback) {
  http.get(url, function (res) {
    if (200 !== res.statusCode) {
      return callback(null);
    }
    var body = '';
    res.setEncoding('utf8');

    res.on('data', function (chunk) {
      body += chunk;
    });

    res.on('end', function () {
      body = JSON.parse(body);
      return callback(body);
    });
  });
};

var getWeather = function (city, callback) {
  var url = 'http://api.openweathermap.org/data/2.5/weather?q=' + city +
    '&units=metric';
  httpGet(url, function (data) {
    if (!data || data.cod !== 200) {
      return callback('error, please try again');
    }
    var ret = 'Weather: ' + data.weather[0].main + '\n' +
      'Temperture: ' + data.main.temp + '\n';
    return callback(ret);
  });
};

var weatherHandler = {
  prefix: '-weather',
  help: '-weather C --- show current weather of city C. \n',
  func: getWeather,
};

// get a city's geographic coordinate
// same API call return different data, just for demonstration
var getCoord = function (city, callback) {
  var url = 'http://api.openweathermap.org/data/2.5/weather?q=' + city +
    '&units=metric';
  httpGet(url, function (data) {
    if (!data || data.cod !== 200) {
      return callback('error, please try again');
    }
    var ret = 'Longitude: ' + data.coord.lon + '\n' +
      'Latitude: ' + data.coord.lat + '\n';
    return callback(ret);
  });
};

var coordHandler = {
  prefix: '-location',
  help: '-location C --- show location of city C. \n',
  func: getCoord,
};

// list handlers to load
// uncomment the second to modify the addons
var handlers = [
  weatherHandler,
  // coordHandler,
];

var helpmsg = '';
var funcs = {};
for (var i in handlers) {
  helpmsg += handlers[i].help;
  funcs[handlers[i].prefix] = handlers[i].func;
}

module.exports = {
  help: helpmsg,
  handler: funcs,
};
