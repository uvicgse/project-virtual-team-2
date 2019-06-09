var images = {};
var imageFiles = ["jarjar.jpg", "yoda.png", "obiwan.jpg"];
var imageCount = 0;
var githubAvatarUrl = require('github-avatar-url');
function getName(author) {
    var name = author.split("<")[0];
    return name;
}
function img4User(name) {
    var pic;
    var first = name.trim().charAt(0).toUpperCase();
    pic = "node_modules/material-letter-icons/dist/png/" + first + ".png";
    return pic;
}
function imageForUser(name, email, callback) {
    var pic;
    githubAvatarUrl(name, function (err, avatarURL) {
        if (!err) {
            console.log("avatar url: avatarURL");
            pic = avatarURL;
        }
        else {
            var first = name.trim().charAt(0).toUpperCase();
            pic = "node_modules/material-letter-icons/dist/png/" + first + ".png";
        }
        callback(pic);
    });
}
