var HID = require('node-hid');

var Command = {
  SetLEDState: 0x11,
  SetReportingMode: 0x12
};

var ReportFlags = {
  OnChange: 0x00,
  Continuous: 0x04
};

var ReportMode = {
  Buttons: 0x30,
  ButtonsAccelerometer: 0x31
};

var VT100 = {
  CursorUp: function(n) { return "\x1b[" + n + "A"; },
  CursorDown: function(n) { return "\x1b[" + n + "B"; },
  ClearLine: "\x1b[2K"
};

function isWiimote(deviceDesc) {
  return deviceDesc.product.match(/Nintendo/);
}

var deviceDescs = HID.devices().filter(isWiimote);

deviceDescs.forEach(function(deviceDesc, index) {
  var device = new HID.HID(deviceDesc.path);

  var ledState = 0x10 << index;
  var rumble = 0;

  process.stdout.write(deviceDesc.path + "\n");

  var rowsUp = deviceDescs.length - index;

  device.on('data', function(data) {
    process.stdout.write(VT100.CursorUp(rowsUp) + VT100.ClearLine
                        + "\r" + deviceDesc.path + ':'
                        + data.toString('hex').replace(/../g, ' $&')
                        + "\r"
                        + VT100.CursorDown(rowsUp));
    if (data[2] & 0x80) {
      rumble = 1;
    } else {
      rumble = 0;
    }
    device.write(new Buffer([Command.SetLEDState, ledState | rumble]));
  });

  device.write(new Buffer([Command.SetReportingMode, ReportFlags.OnChange, ReportMode.Buttons]));
});
