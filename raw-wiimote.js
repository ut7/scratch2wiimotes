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

function isWiimote(deviceDesc) {
  return deviceDesc.product.match(/Nintendo/);
}

exports.open = function (callback) {
  var deviceDescs = HID.devices().filter(isWiimote);

  deviceDescs.forEach(function(deviceDesc, index) {
    var device = new HID.HID(deviceDesc.path);

    var ledState = 0x10 << index;
    var rumble = 0;

    device.on('data', function(data) {
      callback(index, data);

      if (data[2] & 0x80) {
        rumble = 1;
      } else {
        rumble = 0;
      }
      device.write(new Buffer([Command.SetLEDState, ledState | rumble]));
    });

    device.write(new Buffer([Command.SetReportingMode, ReportFlags.OnChange, ReportMode.Buttons]));
  });
};
