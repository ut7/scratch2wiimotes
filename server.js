var express = require('express');
var wiimote = require('./hid-wiimote');
var app = express();

var lastWiimote = {buttons:{}};

wiimote.open(function (wiimoteData) {
  console.log(wiimoteData);
  lastWiimote = wiimoteData;
});

app.use(function logErrors(err, req, res, next) {
  console.error(err.stack);
  next(err);
});

app.get('/poll', function(req, res) {
  res.send([
           'button_a ' + !!lastWiimote.buttons.a,
           'button_b ' + !!lastWiimote.buttons.trigger,
           'dleft '    + !!lastWiimote.buttons.dleft,
           'dup '      + !!lastWiimote.buttons.dup,
           'dright '   + !!lastWiimote.buttons.dright,
           'ddown '    + !!lastWiimote.buttons.ddown,
           ''
  ].join('\n'));
});

app.get('/reset_all', function(req, res) {
  console.log('reset_all');
  res.send('\n');
});

app.get('*', function (req, res) {
  console.log(req.method + ' ' + req.url);
  res.send('unknown\n');
});

var server = app.listen(3000, function() {
  console.log('Listening on port %d', server.address().port);
});
