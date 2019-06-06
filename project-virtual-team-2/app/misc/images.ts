let images = {};
// let imageFiles = ["dog1.jpg", "dog2.jpg", "dog3.jpg", "dog4.jpg", "dog5.jpg"];
let imageFiles = ["jarjar.jpg", "yoda.png", "obiwan.jpg"];
let imageCount = 0;
let githubAvatarUrl = require('github-avatar-url');

function getName(author: string) {
  let name = author.split("<")[0];
  return name;
}

function img4User(name:string) {
  let pic;
  let first = name.trim().charAt(0).toUpperCase();
  pic =  "node_modules/material-letter-icons/dist/png/" + first + ".png";
  return pic;
}

function imageForUser(name: string, email: string, callback) {
  let pic;
  githubAvatarUrl(name, function(err,avatarURL){
    if(!err) {
      console.log("avatar url: avatarURL");
      pic = avatarURL;
    } else {
      let first = name.trim().charAt(0).toUpperCase();
      pic =  "node_modules/material-letter-icons/dist/png/" + first + ".png";
    }
    callback(pic);
  });

  // if (images[email] === undefined) {
  //   images[email] = "assets/img/starwars/" + imageFiles[imageCount];
  //   imageCount++;
  //   if (imageCount >= imageFiles.length) {
  //     imageCount = 0;
  //   }
  // }
  // return images[email];
}
