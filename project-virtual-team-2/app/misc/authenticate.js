var $ = require("jquery");
var Git = require("nodegit");
var repo;
var github = require("octonode");
var repoName;
var githubName;
var aid, atoken;
var client;
var avaterImg;
var repoList = {};
var url;
var repoNotFound = 0;
var signed = 0;
var changes = 0;
var signedAfter = false;
var loginScopes = [
    "repo",
    "user"
];
function CommitNoPush() {
    if (CommitButNoPush == 1) {
        $("#modalW2").modal();
    }
}
function signInHead(callback) {
    encryptTemp(document.getElementById("Email1").value, document.getElementById("Password1").value);
    continuedWithoutSignIn = false;
    signedAfter = true;
    if (signed == 1) {
        if ((changes == 1) || (CommitButNoPush == 1)) {
            $("#modalW2").modal();
        }
        else {
            getUserInfo(callback);
        }
    }
    else {
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
    document.getElementById("password").value = getPassword();
}
function searchRepoName() {
    var ul = document.getElementById("repo-dropdown");
    ul.innerHTML = '';
    encryptTemp(document.getElementById("username").value, document.getElementById("password").value);
    cred = Git.Cred.userpassPlaintextNew(getUsernameTemp(), getPasswordTemp());
    var ghme = client.me();
    ghme.repos(function (err, data, head) {
        var ghme = client.me();
        for (var i = 0; i < data.length; i++) {
            var rep = Object.values(data)[i];
            console.log("url of repo: " + rep['html_url']);
            if (parseInt(rep['forks_count']) == 0) {
                if (rep['full_name'].search(document.getElementById("searchRep").value) != -1) {
                    displayBranch(rep['full_name'], "repo-dropdown", "selectRepo(this)");
                    repoList[rep['full_name']] = rep['html_url'];
                }
                else {
                    repoNotFound = 1;
                }
            }
        }
        if (repoNotFound == 1) {
            ul.innerHTML = '';
            displayBranch(document.getElementById("searchRep").value + ":" + " Is NOT a valid repository.", "repo-dropdown", "");
            repoNotFound = 0;
        }
    });
}
function getUserInfo(callback) {
    if (signedAfter === true) {
        encryptTemp(document.getElementById("Email1").value, document.getElementById("Password1").value);
    }
    else {
        encryptTemp(document.getElementById("username").value, document.getElementById("password").value);
    }
    cred = Git.Cred.userpassPlaintextNew(getUsernameTemp(), getPasswordTemp());
    client = github.client({
        username: getUsernameTemp(),
        password: getPasswordTemp()
    });
    var ghme = client.me();
    ghme.info(function (err, data, head) {
        if (err) {
            if (err.toString().indexOf("OTP") !== -1) {
                github.auth.config({
                    username: getUsernameTemp(),
                    password: getPasswordTemp()
                }).login({ "scopes": loginScopes,
                    "note": Math.random().toString()
                }, function (err, id, token, headers) {
                    document.getElementById("submitOtpButton").onclick = function () {
                        submitOTP(callback);
                    };
                    $("#otpModal").modal('show');
                });
            }
            else if (err == "Error: getaddrinfo ENOTFOUND api.github.com api.github.com:443" || err == "Error: getaddrinfo ENOENT api.github.com:443" || err == "Error: getaddrinfo EAI_AGAIN api.github.com:443") {
                displayModal("No internet connection - Unable to complete sign in");
            }
            else if (err == "Error: Bad credentials") {
                displayModal("Incorrect username or password - Unable to complete sign in");
            }
            else {
                displayModal(err);
            }
            document.getElementById('grey-out').style.display = 'none';
        }
        if (!err) {
            processLogin(ghme, callback);
        }
    });
}
function submitOTP(callback) {
    github.auth.config({
        username: getUsernameTemp(),
        password: getPasswordTemp(),
        otp: document.getElementById("otp").value
    }).login({ "scopes": loginScopes,
        "note": Math.random().toString()
    }, function (err, id, token, headers) {
        if (err) {
            displayModal(err);
        }
        else {
            client = github.client(token);
            var ghme = client.me();
            processLogin(ghme, callback);
        }
    });
}
function processLogin(ghme, callback) {
    ghme.info(function (err, data, head) {
        if (err) {
            displayModal(err);
        }
        else {
            var rememberLogin = document.getElementById("rememberLogin");
            var username = document.getElementById("username").value;
            var password = document.getElementById("password").value;
            if (rememberLogin.checked == true) {
                encrypt(username, password);
            }
            else {
                var credentialFile = './data.json';
                if (fs.existsSync(credentialFile)) {
                    fs.unlinkSync(credentialFile);
                }
            }
            avaterImg = Object.values(data)[2];
            document.getElementById("githubname").innerHTML = data["login"];
            var docGitUser = document.getElementById("githubname");
            var doc = document.getElementById("avatar");
            signed = 1;
            callback();
        }
    });
    ghme.repos(function (err, data, head) {
        if (err) {
            return;
        }
        else {
            displayUsername();
            document.getElementById("avatar").innerHTML = "Sign out";
            console.log("number of repos: " + data.length);
            for (var i = 0; i < data.length; i++) {
                var rep = Object.values(data)[i];
                console.log("url of repo: " + rep['html_url']);
                if (rep['fork'] == false) {
                    if (parseInt(rep['forks_count']) == 0) {
                        displayBranch(rep['full_name'], "repo-dropdown", "selectRepo(this)");
                        repoList[rep['full_name']] = rep['html_url'];
                    }
                    else {
                        createDropDownFork(rep['full_name'], "repo-dropdown");
                        repoList[rep['full_name']] = rep['html_url'];
                        for (var i_1 = 0; i_1 < data.length; i_1++) {
                            var rep2 = Object.values(data)[i_1];
                            if (rep2['name'] == rep['name']) {
                                displayBranch("&nbsp; &nbsp;" + rep2['full_name'], rep['full_name'], "selectRepo(this)");
                                repoList["&nbsp; &nbsp;" + rep2['full_name']] = rep2['html_url'];
                            }
                        }
                    }
                }
            }
        }
    });
}
function make_base_auth(user, password) {
    var tok = user + ':' + password;
    var hash = btoa(tok);
    return 'Basic ' + hash;
}
function selectRepo(ele) {
    url = repoList[ele.innerHTML];
    var butt = document.getElementById("cloneButton");
    butt.innerHTML = 'Clone ' + ele.innerHTML;
    butt.setAttribute('class', 'btn btn-primary');
    if (butt.innerHTML != 'Clone') {
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
    var splitUrl = url.split("/");
    var local;
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
function signInOrOut() {
    var doc = document.getElementById("avatar");
    if (doc.innerHTML === "Sign In") {
        doc.innerHTML = "";
    }
    else if (doc.innerHTML === "") {
        doc.innerHTML = "Sign In";
    }
    if (doc.innerHTML === "Sign out") {
        $("#avatar").removeAttr("data-toggle");
        if (changes == 1 || CommitButNoPush == 1) {
            $("#modalW2").modal();
        }
        else {
            redirectToHomePage();
        }
    }
}
function redirectToHomePage() {
    window.onbeforeunload = Confirmed;
    window.location.href = "index.html";
    signed = 0;
    changes = 0;
    CommitButNoPush = 0;
}
function closeIssue() {
}
function addIssue(rep, id, onclick) {
    var ul = document.getElementById(id);
    var li = document.createElement("li");
    var issueTitle = document.createElement("p");
    var issueBody = document.createElement("p");
    var assignees = document.createElement("p");
    var closeIssue = document.createElement("button");
    closeIssue.innerHTML = "Comments";
    closeIssue.setAttribute("onclick", onclick);
    closeIssue.setAttribute("id", rep["number"]);
    closeIssue.setAttribute("class", "btn btn-primary");
    assignees.innerHTML = "Assignees: ";
    issueTitle.setAttribute("class", "issue-text");
    issueBody.setAttribute("class", "issue-text");
    assignees.setAttribute("class", "issue-text");
    li.setAttribute("role", "presentation");
    li.setAttribute("class", "list-group-item");
    issueTitle.innerHTML = "Issue Name:" + rep["title"];
    issueBody.innerHTML = "Body:" + rep["body"];
    li.appendChild(issueTitle);
    li.appendChild(issueBody);
    if (rep["assignees"].length != 0) {
        for (var i = 0; i < rep["assignees"].length; i++) {
            assignees.innerHTML += rep["assignees"][i]["login"];
            if ((i + 1) >= rep["assignees"].length) {
                assignees.innerHTML += ".";
            }
            else {
                assignees.innerHTML += ",";
            }
        }
        li.appendChild(assignees);
    }
    if (rep["comments"].length != 0) {
    }
    li.appendChild(closeIssue);
    ul.appendChild(li);
}
function addComment(rep, id) {
    var ul = document.getElementById(id);
    var li = document.createElement("li");
    var button = document.createElement("button");
    var comment = document.createElement("p");
    li.setAttribute("role", "presentation");
    li.setAttribute("class", "list-group-item");
    comment.innerHTML = rep["user"]["login"] + ":" + rep["body"];
    comment.setAttribute("class", "issue-text");
    li.appendChild(comment);
    ul.appendChild(li);
}
$('#commentModal').on('hidden.bs.modal', function () {
    var comment = document.getElementById("#comment-list");
    comment.innerHTML = "";
});
var issueId = 0;
function commentOnIssue(ele) {
    repoName = document.getElementById("repo-name").innerHTML;
    githubName = document.getElementById("githubname").innerHTML;
    $('#commentModal').modal('show');
    issueId = ele["id"];
    var ul = document.getElementById("comment-list");
    ul.innerHTML = '';
    var ghissue = client.issue(githubName + '/' + repoName, ele["id"]);
    ghissue.comments(function (err, data, head) {
        for (var i = 0; i < data.length; i++) {
            var rep = Object.values(data)[i];
            addComment(rep, "comment-list");
        }
    });
}
function createCommentForIssue() {
    var theArray = $('#newComment').serializeArray();
    repoName = document.getElementById("repo-name").innerHTML;
    githubName = document.getElementById("githubname").innerHTML;
    var ghissue = client.issue(githubName + '/' + repoName, issueId);
    ghissue.createComment({
        body: theArray[0]["value"]
    }, function (err, data, head) {
        var ele = { id: issueId };
        commentOnIssue(ele);
    });
}
function createIssue() {
    var theArray = $('#newIssue').serializeArray();
    repoName = document.getElementById("repo-name").innerHTML;
    githubName = document.getElementById("githubname").innerHTML;
    if (repoName != "repository" && theArray != null) {
        encryptTemp(document.getElementById("username").value, document.getElementById("password").value);
        cred = Git.Cred.userpassPlaintextNew(getUsernameTemp(), getPasswordTemp());
        client = github.client({
            username: getUsernameTemp(),
            password: getPasswordTemp()
        });
        var ghme = client.me();
        var ghrepo = client.repo(githubName + '/' + repoName);
        ghrepo.issue({
            "title": theArray[0]["value"],
            "body": theArray[1]["value"],
            "assignee": theArray[2]["value"]
        }, function (err, data, head) {
            if (err != null) {
                document.getElementById("error-text-box").innerHTML = "Invalid Assignee: " + theArray[2]["value"];
                $('#errorModal').modal('show');
            }
            else {
                document.getElementById("issue-error-title").innerHTML = "Success";
                document.getElementById("error-text-box").innerHTML = "Successfuly added new Issue: " + theArray[0]["value"];
                $('#errorModal').modal('show');
            }
        });
        $('#issue-modal').modal('hide');
        displayIssues();
    }
}
function displayIssues() {
    repoName = document.getElementById("repo-name").innerHTML;
    githubName = document.getElementById("githubname").innerHTML;
    if (repoName != "repository") {
        var ul = document.getElementById("issue-dropdown");
        ul.innerHTML = '';
        encryptTemp(document.getElementById("username").value, document.getElementById("password").value);
        cred = Git.Cred.userpassPlaintextNew(getUsernameTemp(), getPasswordTemp());
        client = github.client({
            username: getUsernameTemp(),
            password: getPasswordTemp()
        });
        var ghme = client.me();
        var ghrepo = client.repo(githubName + '/' + repoName);
        ghrepo.issues(function (err, data, head) {
            for (var i = 0; i < data.length; i++) {
                var rep = Object.values(data)[i];
                if (rep["state"] != "closed") {
                    addIssue(rep, "issue-dropdown", "commentOnIssue(this)");
                }
            }
        });
    }
}
