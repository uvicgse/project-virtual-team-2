var CryptoJS = require("crypto-js");
const os = require('os');
var jsonfile = require('jsonfile');
var fs = require('fs');
//TODO: I think the password and username can be removed
var encryptedOauthToken;

//test to call function and store token.
//you should use your token for testing and only push to your private repository!!!


function storeOauthToken(accessToken) {

  //Encrypt token
  encryptOauthToken(accessToken);

  //Write to the JSON file
  console.log("encrypted Oauth token is: " + encryptedOauthToken);
  var file = 'token.json';
  var obj = {'OauthToken': encryptedOauthToken.toString()};

  jsonfile.writeFile(file, obj, function (err) {
    if (err) throw err;
    console.log('Oauth Token successfully saved');
  })

  return;
}

/*
  This function will ecrypt an Oauth token and store in memory
  encrypted using AES encryption and using os.hostname() as the key
*/
function encryptOauthToken(accessToken) {
  encryptedOauthToken = CryptoJS.AES.encrypt(accessToken, os.hostname());
}