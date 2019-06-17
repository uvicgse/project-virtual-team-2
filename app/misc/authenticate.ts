/// <reference path="git.ts" />

let $ = require("jquery");

//import * as nodegit from "git";
//import NodeGit, { Status } from "nodegit";

let Git = require("nodegit");
let repo;

let github = require("octonode");
let repoName;
let githubName;
let aid, atoken;
let client;
let avaterImg;
let repoList = {};
let url;
var repoNotFound = 0;
var signed = 0;
var changes = 0;
let signedAfter = false;

let oauthpass = 'x-oauth-basic';
let electronOauth2 = require('electron-oauth2');
let account;


const OauthConfig = {
  clientId: 'c2509d8769f5f1e46028',
  clientSecret: 'e4717832659e95c2f8f4237a3390cf09013b94f7',
  authorizationUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  useBasicAuthorizationHeader: false,
  redirectUri: 'http://localhost:9000/user/signin/callback'
};

const windowParams = {
  alwaysOnTop: true,
  autoHideMenuBar: true,
  webPreferences: {
    nodeIntegration: false,
  }
};
const options = {
  scope: 'repo user'
};
const myApiOauth = electronOauth2(OauthConfig, windowParams);

function authenticateUser(callback) {
  // Opens Oauth Window and Retrieves Token
  myApiOauth.getAccessToken(options)
    .then(token => {
      if(!token) {
        return;
      }

      storeOauthToken(token['access_token']);
      console.log("ACCESS TOKEN IS:", token)

      // Initialize github client with token from Oauth
      client = github.client(token['access_token']);

      console.log("build client");
      // If the client fails to be initialized, a new access token is required...
      if (!client.token)
        return;

      // Set the account global to access the username later on
      client.get('/user', {}, function (err, status, body, headers) {
        // Set the account variable
        account = body;

        // When user differs sign in, the sign in button must be hidden
        // hideSignInButton();

        // Trigger next step in login process
        getUserInfo(callback);
      });

    }, err => {
      console.log('Error while getting token', err);
	}).catch( err => {
    console.log(err);
  });
}


/* // Code for requesting Oauth token using https and then storing using storeOauthToken()
   // Possibly works possibly not, might just use the electron-oauth2 library to do same thing instead
// https for communicating with Github
var https = require("https");
const {BrowserWindow} = require('electron').remote
// GitHub Credentials
var options = {
    // This is given by registering VisualGit with Github Oauth
    client_id: '096b43fe7908abe70257',
    // Possibly shouldn't be used because unsure if electron can hide this data
    client_secret: 'c61f9340a34bf3c7a34897e538dd05acd18f8802',
    // To adjust permissions
    scopes: 'gist'
};

function openOauthWindow(){
  console.log("Oauth: OpenOauthWindow");

  // Create the URL for GitHub Oauth
  var authWindow = new BrowserWindow({ width: 800, height: 600, show: false, 'node-integration': false })
  var githubUrl = 'https://github.com/login/oauth/authorize?';
  var authUrl = githubUrl + 'client_id=' + options.client_id + '&scope=' + options.scopes;

  // Load the Oauth URL
  authWindow.loadURL(authUrl);
  authWindow.show();

  authWindow.webContents.on('will-navigate', function (event, url) {
    handleCallback(url, authWindow);
  });

  authWindow.webContents.on('did-get-redirect-request', function (event, oldUrl, newUrl) {
    handleCallback(newUrl, authWindow);
  });

  authWindow.on('close', function() {
    authWindow = null;
  }, false);

}

function handleCallback(url, authWindow){
  var raw_code = /code=([^&]*)/.exec(url) || null;
  var code = (raw_code && raw_code.length > 1) ? raw_code[1] : null;
  var error = /\?error=(.+)$/.exec(url);

  if (code || error) {
    // Close the browser if code found or error
    authWindow.destroy();
  }

  // If there is a code, proceed to get token from github
  if (code) {
    requestGithubToken(options, code);
  } else if (error) {
    alert('Oops! Something went wrong and we couldn\'t' +
      'log you in using Github. Please try again.');
  }
}

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
              // Store it
              console.log('received token: ' + response.body.access_token);
              storeOauthToken(response.body.access_token);
          }
      });
      response.on('error', function (err) {
          console.log("GITHUB OAUTH REQUEST ERROR: " + err.message);
      });
  });

  req.write(postData);
  req.end();
} */

//Called then user pushes to sign out even if they have commited changes but not pushed; prompts a confirmation modal
function CommitNoPush() {
        if (CommitButNoPush == 1) {
                $("#modalW2").modal();
        }
}
//create credential using oauth
function createCredentials() {
  Git.Cred.userpassPlaintextNew(getOauthToken(), oauthpass);
}

function signInHead(callback) {
  encryptTemp(document.getElementById("Email1").value, document.getElementById("Password1").value);
  continuedWithoutSignIn = false;
  signedAfter = true;
  if (signed == 1){
    if ((changes == 1)){
      $("#modalW2").modal();
    }
    else {
      getUserInfo(callback);
    }
  }
  else{
    getUserInfo(callback);
  }
}

function LogInAfterConfirm(callback) {
        encryptTemp(document.getElementById("Email1").value, document.getElementById("Password1").value);
        getUserInfo(callback);
}

function ModalSignIn(callback) {
        encryptTemp(document.getElementById("Email1").value, document.getElementById("Password1").value);
        getUserInfo(callback);
}



function loginWithSaved(callback) {
    document.getElementById("username").value = getUsername();
    document.getElementById("password").value = getPassword(); //get decrypted username n password
}

function searchRepoName() {
  let ul = document.getElementById("repo-dropdown");

  ul.innerHTML = ''; // clears the dropdown menu which shows all the repos

  // Gets users name and password
  encryptTemp(document.getElementById("username").value, document.getElementById("password").value);
  //obtain a new copy of cred every time by calling constructor method.
  cred = createCredentials();

  var ghme = client.me();
  ghme.repos(function (err, data, head) {
    var ghme = client.me();

    for (let i = 0; i < data.length; i++) {

      let rep = Object.values(data)[i];
      console.log("url of repo: " + rep['html_url']);

      // Searches from the text input and adds to the list if repo name is found
      if (parseInt(rep['forks_count']) == 0) {
        if (rep['full_name'].search(document.getElementById("searchRep").value) != -1) {
          displayBranch(rep['full_name'], "repo-dropdown", "selectRepo(this)");
          repoList[rep['full_name']] = rep['html_url'];
        } else {
          repoNotFound = 1;
        }
      }

    }
    if(repoNotFound == 1){
      ul.innerHTML = '';
      displayBranch(document.getElementById("searchRep").value + ":" + " Is NOT a valid repository.", "repo-dropdown", "");
      repoNotFound = 0;
    }
  });
}

function getUserInfo(callback) {
  // if (signedAfter === true){  // if the trys to login after clicking "continues without sign in"
  //   encryptTemp(document.getElementById("Email1").value, document.getElementById("Password1").value);
  // }
  // else {
  //   encryptTemp(document.getElementById("username").value, document.getElementById("password").value);
  // }
  //calling constructor method
  console.log("called getuserinfo");
  cred = createCredentials();

  client = github.client(getOauthToken());
  var ghme = client.me();

  ghme.info(function(err, data, head) {
    if (!err) {
      processLogin(ghme, callback);
    }

  });
}

function processLogin(ghme, callback) {
  ghme.info(function(err, data, head) {
    if (err) {
      displayModal(err);
    } else {
      avaterImg = Object.values(data)[2]
      document.getElementById("githubname").innerHTML = data["login"]
          signed = 1;

      callback();
    }
  });

  ghme.repos(function(err, data, head) {
    if (err) {
      return;
    } else {
       displayUsername();
      document.getElementById("avatar").innerHTML = "Sign out";
      console.log("number of repos: " + data.length);
      for (let i = 0; i < data.length; i++) {
        let rep = Object.values(data)[i];
        console.log("url of repo: " + rep['html_url']);

        if(rep['fork'] == false) {
          if(parseInt(rep['forks_count']) == 0) {
            displayBranch(rep['full_name'], "repo-dropdown", "selectRepo(this)");
            repoList[rep['full_name']] = rep['html_url'];
          }
          else {
            //Create a collapseable list for the forked repo
            createDropDownFork(rep['full_name'],"repo-dropdown");
            repoList[rep['full_name']] = rep['html_url'];
            //Reiterate through and get all the forks of the repo and add to list
            for(let i = 0; i < data.length; i++) {
              let rep2 = Object.values(data)[i];
              if(rep2['name'] == rep['name']) {
                displayBranch("&nbsp; &nbsp;" +rep2['full_name'],rep['full_name'],"selectRepo(this)")
                repoList["&nbsp; &nbsp;"+rep2['full_name']] = rep2['html_url'];
              }
            }
          }
        }
      }
    }
  });
}

//Converts string to base 64 to be used for Basic Authorization in external API calls
function make_base_auth(user, password) {
  var tok = user + ':' + password;
  var hash = btoa(tok);
  return 'Basic ' + hash;
}

function selectRepo(ele) {
  url = repoList[ele.innerHTML];
  let butt = document.getElementById("cloneButton");
  butt.innerHTML = 'Clone ' + ele.innerHTML;
  butt.setAttribute('class', 'btn btn-primary');
  if (butt.innerHTML != 'Clone'){
    butt.disabled = false;
  }
  console.log("selected " + ele.innerHTML + " as repository");
}

function cloneRepo() {
  if (url === null) {
    updateModalText("Web URL for repo could not be found. Try cloning by providing the repo's web URL directly in the 'Add repository' window");
    return;
  }

  hidePRPanel();

  console.log("cloning " + url);
  let splitUrl = url.split("/");
  let local;
  if (splitUrl.length >= 2) {
    local = splitUrl[splitUrl.length - 1];
  }
  console.log("cloning " + local);

  if (local == null) {
    updateModalText("Error: could not define name of repo");
    return;
  }

  downloadFunc(url, local);
  url = null;
  $('#repo-modal').modal('hide');

  switchToMainPanel();
}

//TODO: implement signout
function signInOrOut() {
      redirectToHomePage();
}

function redirectToHomePage() {
  window.onbeforeunload = Confirmed;
  window.location.href = "index.html";
  signed = 0;
  changes = 0;
  //LogInAfterConfirm();
}

function closeIssue() {

}

function addIssue(rep,id, onclick) {
  let ul = document.getElementById(id);
  let li = document.createElement("li");
  let issueTitle = document.createElement("p");
  let issueBody = document.createElement("p");
  let assignees = document.createElement("p");
  let closeIssue = document.createElement("button");
  closeIssue.innerHTML = "Comments"
  closeIssue.setAttribute("onclick",onclick)
  closeIssue.setAttribute("id",rep["number"]);
  closeIssue.setAttribute("class","btn btn-primary")
  assignees.innerHTML = "Assignees: "
  issueTitle.setAttribute("class", "issue-text");
  issueBody.setAttribute("class","issue-text");
  assignees.setAttribute("class","issue-text");
  li.setAttribute("role", "presentation")
  li.setAttribute("class","list-group-item")
  issueTitle.innerHTML = "Issue Name:" +rep["title"];
  issueBody.innerHTML = "Body:" + rep["body"];
  li.appendChild(issueTitle);
  li.appendChild(issueBody);
  if(rep["assignees"].length != 0 ) {
    for(let i = 0;i<rep["assignees"].length; i++) {
      assignees.innerHTML += rep["assignees"][i]["login"]
      if((i+1)>=rep["assignees"].length) {
        assignees.innerHTML += "."
      }
      else {
        assignees.innerHTML += ","
      }
    }
    li.appendChild(assignees);
  }
  if(rep["comments"].length != 0 ) {
  }
  li.appendChild(closeIssue);
  ul.appendChild(li);
}

function addComment(rep,id) {
  let ul = document.getElementById(id);
  let li = document.createElement("li");
  let button = document.createElement("button");
  let comment = document.createElement("p");
  li.setAttribute("role", "presentation")
  li.setAttribute("class","list-group-item")
  comment.innerHTML = rep["user"]["login"] +":" + rep["body"];
  comment.setAttribute("class","issue-text");
  li.appendChild(comment);
  ul.appendChild(li);

}

$('#commentModal').on('hidden.bs.modal', function () {
  var comment = document.getElementById("#comment-list");
  comment.innerHTML = "";
})


let issueId = 0;
function commentOnIssue(ele) {
  repoName = document.getElementById("repo-name").innerHTML
  githubName = document.getElementById("githubname").innerHTML
  $('#commentModal').modal('show');
  issueId = ele["id"];
  let ul = document.getElementById("comment-list");
  ul.innerHTML = ''; // clears the dropdown menu which shows all the issues
  var ghissue= client.issue(githubName + '/' + repoName,ele["id"]);
  ghissue.comments(function (err, data, head) {
    for (let i = 0; i < data.length; i++) {
      let rep = Object.values(data)[i];
        addComment(rep, "comment-list");
  }
  });
}


function createCommentForIssue() {
  var theArray = $('#newComment').serializeArray();
  repoName = document.getElementById("repo-name").innerHTML
  githubName = document.getElementById("githubname").innerHTML
  var ghissue= client.issue(githubName + '/' + repoName,issueId);
  ghissue.createComment({
    body: theArray[0]["value"]
  }, function (err, data, head) {
    let ele = {id:issueId};
    commentOnIssue(ele)
  });
}


function createIssue() {
  var theArray = $('#newIssue').serializeArray();
  repoName = document.getElementById("repo-name").innerHTML
  githubName = document.getElementById("githubname").innerHTML
  if (repoName != "repository" && theArray != null) {
      cred = createCredentials();
      client = github.client(getOauthToken());
      var ghme = client.me();
      var ghrepo = client.repo(githubName + '/' + repoName);
      ghrepo.issue({
        "title": theArray[0]["value"],
        "body": theArray[1]["value"],
        "assignee": theArray[2]["value"]
      }, function (err, data, head) {
        if(err != null) {
          document.getElementById("error-text-box").innerHTML = "Invalid Assignee: " + theArray[2]["value"];
          $('#errorModal').modal('show');
        }
        else {
          document.getElementById("issue-error-title").innerHTML = "Success";
          document.getElementById("error-text-box").innerHTML = "Successfuly added new Issue: " + theArray[0]["value"];
          $('#errorModal').modal('show');
        }
      }); //issue
      $('#issue-modal').modal('hide');
      displayIssues();
    }
}

function displayIssues() {
   repoName = document.getElementById("repo-name").innerHTML
   githubName = document.getElementById("githubname").innerHTML
      if (repoName != "repository") {

          let ul = document.getElementById("issue-dropdown");

          ul.innerHTML = ''; // clears the dropdown menu which shows all the issues

          cred = createCredentials();

          client = github.client(getOauthToken());

          var ghme = client.me();
          var ghrepo = client.repo(githubName + '/' + repoName);
          ghrepo.issues(function (err, data, head) {
              for (let i = 0; i < data.length; i++) {
                  let rep = Object.values(data)[i];
                  if(rep["state"] != "closed") {
                    addIssue(rep, "issue-dropdown", "commentOnIssue(this)");
                  }
              }
          });
      }
    }
