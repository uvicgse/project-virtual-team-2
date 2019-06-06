var CryptoJS = require("crypto-js");
const os = require("os");
var jsonfile = require("jsonfile");
var fs = require("fs");
var file;

var encryptedPassword;
var encryptedUsername;

function decrypt() {
  file = "data.json";

  var objRead = jsonfile.readFileSync(file); //JSON Object containing credentials

  encryptedUsername = objRead.username;
  encryptedPassword = objRead.password;
}

function getUsername() {
  if (encryptedUsername != null) {
    var decryptedUsernameBytes = CryptoJS.AES.decrypt(
      encryptedUsername.toString(),
      os.hostname()
    );
    return decryptedUsernameBytes.toString(CryptoJS.enc.Utf8);
  }
}

function getPassword() {
  var decryptedPasswordBytes = CryptoJS.AES.decrypt(
    encryptedPassword.toString(),
    os.hostname()
  );
  return decryptedPasswordBytes.toString(CryptoJS.enc.Utf8);
}
