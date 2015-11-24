var wiimote = require('./raw-wiimote');

var VT100 = {
  CursorUp: function(n) { return "\x1b[" + n + "A"; },
  CursorDown: function(n) { return "\x1b[" + n + "B"; },
  ClearLine: "\x1b[2K"
};

var wiimoteCount = 0;

process.stdout.write(new Array(1 + wiimoteCount).join('\n'));

wiimote.open(function (index, data) {
  while (index > wiimoteCount) {
    process.stdout.write('\n');
    wiimoteCount++;
  }
  process.stdout.write(VT100.CursorUp(wiimoteCount - index + 1)
                       + VT100.ClearLine
                       + "\r" + index + ':'
                       + Object.keys(data.buttons).filter(
                           function(k){return data.buttons[k];}
                         ).join(',')
                       + "\r"
                       + VT100.CursorDown(wiimoteCount - index + 1));
});
