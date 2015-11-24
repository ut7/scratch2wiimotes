var wiimote = require('./raw-wiimote');

var VT100 = {
  CursorUp: function(n) { return "\x1b[" + n + "A"; },
  CursorDown: function(n) { return "\x1b[" + n + "B"; },
  ClearLine: "\x1b[2K"
};

var MaxWiimotes = 4;

process.stdout.write(new Array(1 + MaxWiimotes).join('\n'));

wiimote.open(function (index, data) {
  process.stdout.write(VT100.CursorUp(MaxWiimotes - index)
                       + VT100.ClearLine
                       + "\r" + index + ':'
                       + data.toString('hex').replace(/../g, ' $&')
                       + "\r"
                       + VT100.CursorDown(MaxWiimotes - index));
});
