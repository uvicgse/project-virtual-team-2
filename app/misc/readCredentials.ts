var CryptoJS = require("crypto-js");
const os = require("os");
var jsonfile = require("jsonfile");
var fs = require("fs");
var file;

var encryptedOauthToken;

/*
  This function reads an encrypted Oauth token from data.json
  and stores the value in memory
*/
function retrieveEncryptedToken() {
  file = "token.json";

  // JSON object containg token
  var objRead = jsonfile.readFileSync(file);

  encryptedOauthToken = objRead.OauthToken;
}

/*
  This function retrieves and returns a valid Oauth token from the file system
  returns null if no token exists
*/
function getOauthToken() {
  retrieveEncryptedToken();
  if (encryptedOauthToken != null) {
    var decryptedTokenBytes = CryptoJS.AES.decrypt(
      encryptedOauthToken.toString(),
      os.hostname()
    );
    return decryptedTokenBytes.toString(CryptoJS.enc.Utf8);
  }
}