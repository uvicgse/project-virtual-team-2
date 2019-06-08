var CryptoJS = require("crypto-js");
const os = require('os');
var jsonfile = require('jsonfile');
var fs = require('fs');
//TODO: I think the password and username can be removed
var encryptedPassword;
var encryptedUsername;
var encryptedOauthToken


//TODO: I think this can/should be removed
function encrypt(username, password) {

    //OS.hostname() is the key.
    //AES encryption
       
    encryptedUsername = CryptoJS.AES.encrypt(username, os.hostname());
    encryptedPassword = CryptoJS.AES.encrypt(password, os.hostname());


    writetoJSON(encryptedUsername, encryptedPassword);
    
}

//TODO I think this can/should be removed
function encryptTemp(username, password) {
  encryptedUsername = CryptoJS.AES.encrypt(username, os.hostname());
  encryptedPassword = CryptoJS.AES.encrypt(password, os.hostname());  
}

/*
  This function takes in an Oauth token, encrypts it
  and then stores it in data.json
*/
function storeOauthToken(accessToken) {
  
  //Encrypt token
  encryptOauthToken(accessToken);

  //Write to the JSON file
  console.log("encrypted Oauth token is: " + encryptedOauthToken);
  var file = 'data.json';
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

//TODO: I think this can/should be removed
function getUsernameTemp() {
  if (encryptedUsername === undefined){ // the user has not logged in, return null
    return null;
  }else {
    var decryptedUsernameBytes = CryptoJS.AES.decrypt(encryptedUsername.toString(), os.hostname());
    return decryptedUsernameBytes.toString(CryptoJS.enc.Utf8);
  }
}

//TODO: I think this can/should be removed or possibly changed
function getPasswordTemp() {
  if(encryptedPassword === undefined){ //the user did not login, return null
    return null;
  }else {
    var decryptedPasswordBytes = CryptoJS.AES.decrypt(encryptedPassword.toString(), os.hostname());
    return decryptedPasswordBytes.toString(CryptoJS.enc.Utf8);
  }
}

//TODO: I think this can/should be removed
function writetoJSON(encryptedUsername, encryptedPassword) {
      
   console.log("encrypted username is: " + encryptedUsername);
   var file = 'data.json';
   var obj = {'username': encryptedUsername.toString(), 'password': encryptedPassword.toString()};
    
   jsonfile.writeFile(file, obj, function (err) {
     if (err) throw err;
     console.log('username and password succesfullt saved');
     
   })

}