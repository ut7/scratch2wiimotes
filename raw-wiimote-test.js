var wiimote = require('./raw-wiimote');

var VT100 = {
  CursorUp: function(n) { return "\x1b[" + n + "A"; },
  CursorDown: function(n) { return "\x1b[" + n + "B"; },
  ClearLine: "\x1b[2K"
};

var MaxWiimotes = 4;

process.stdout.write(new Array(1 + MaxWiimotes).join('\n'));

wiimote.open(function (index, data) {
  process.stdout.write(VT100.CursorUp(MaxWiimotes - index + 1)
                       + VT100.ClearLine
                       + "\r" + index + ':'
                       + Object.keys(data.buttons).filter(
                           function(k){return data.buttons[k]}
                         ).join(',')
                       + "\r"
                       + VT100.CursorDown(MaxWiimotes - index + 1));
});
