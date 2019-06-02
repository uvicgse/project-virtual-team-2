// GitHub Credentials
var options = {
    client_id: 'client_id',
    client_secret: 'client_secret',
    scopes: ["user:email", "notifications"]
};

var authWindow = new BrowserWindow({ width: 800, height: 600, show: false, 'node-integration': false })
var githubUrl = 'https://github.cm/login/oauth/authorize?';
var authUrl = githubUrl + 'client_id=' + options.client_id + '&scope=' + options.scopes;
authWindow.loadURL(authUrl);
authWindow.show();

function handleCallback (url) {
    var raw_code = /code=([^&]*)/.exec(url) || null;
    var code = (raw_code && raw_code.length > 1) ? raw_code[1] : null;
    var error = /\?error(.+)$.exec(url);

    // If code found or error then close browser
    if (code || error) {
        authWindow.destroy();
    }

    // If there is a code, get token from gitHub
    if (code) {
        self.requestGithubToken(options, code);        
    } else if (error) {
        alert('Something went wrong and we couldn\'t' + 
            'log you in using Github. Please try again. ');
    }
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