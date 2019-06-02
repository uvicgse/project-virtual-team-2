// https for communicating with Github 
var https = require("https");

// GitHub Credentials
var options = {
    // This is given by registering VisualGit with Github Oauth
    client_id: '096b43fe7908abe70257',
    // Possibly shouldn't be used because unsure if electron can hide this data
    client_secret: 'client_secret',
    // 
    scopes: ["user:email", "notifications"]
};

// Create the URL for GitHub Oauth
var authWindow = new BrowserWindow({ width: 800, height: 600, show: false, 'node-integration': false })
var githubUrl = 'https://github.cm/login/oauth/authorize?';
var authUrl = githubUrl + 'client_id=' + options.client_id + '&scope=' + options.scopes;

// Load the Oauth URL
authWindow.loadURL(authUrl);
authWindow.show();

function handleCallback (url) {
    var raw_code = /code=([^&]*)/.exec(url) || null;
    var code = (raw_code && raw_code.length > 1) ? raw_code[1] : null;
    var error = /\?error=(.+)$/.exec(url);

    // If code found or error then close browser
    if (code || error) {
        authWindow.destroy();
    }

    // If there is a code, get token from gitHub
    if (code) {
        requestGithubToken(options, code);        
    }
    // Otherwise deal with error
    else if (error) {
        alert('Something went wrong and we couldn\'t' + 
            'log you in using Github. Please try again. ');
    }
}

// Function to get Github Token using https
function requestGithubToken (options, code) {
    console.log("code received: " + code);

    var postData = 'client_id=' + options.client_id +
     '&client_secret=' + options.client_secret + 
     '&code=' + code;
    
    var post = {
        host: "github.com",
        path: "/login/oauth/access_token",
        method: "POST",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length,
                "Accept": "application/json"
        }
    };

    var req = https.request(post, function(response){
        var result = '';
        response.on('data', function(data) {
            result = result + data;
        });
        response.on('end', function () {
            var json = JSON.parse(result.toString());
            console.log("access token recieved: " + json.access_token);
            if (response && response.ok) {
                // Success - Received Token.
                // Store it in localStorage maybe?
                console.log(response.body.access_token);
            }
        });
        response.on('error', function (err) {
            console.log("GITHUB OAUTH REQUEST ERROR: " + err.message);
        });
    });
    
    req.write(postData);
    req.end();
}

authWindow.webContents.on('will-navigate', function (event, url) {
    handleCallback(url);
});

authWindow.webContents.on('did-get-redirect-request', function (event, oldUrl, newUrl) {
    handleCallback(newUrl);
});

// Reset the authWindow on close
authWindow.on('close', function() {
    authwindow = null;
}, false);