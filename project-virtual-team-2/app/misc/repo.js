var Git = require("nodegit");
var repoFullPath;
var repoLocalPath;
var bname = {};
var branchCommit = [];
var remoteName = {};
var localBranches = [];
var readFile = require("fs-sync");
var checkFile = require("fs");
var repoCurrentBranch = "master";
var modal;
var span;
var contributors = [0];
var previousOpen;
var repoName = "";
var fs = require('fs').promises;
var jsonfile = require('jsonfile');
var path = require('path');
var settingsPath = path.join(__dirname, ".settings");
var recentFiles = path.join(settingsPath, 'recent_repos.json');
function downloadRepository() {
    var fullLocalPath;
    if (document.getElementById("repoSave").value != null || document.getElementById("repoSave").value != "") {
        fullLocalPath = document.getElementById("repoSave").value;
    }
    else {
        fullLocalPath = document.getElementById("dirPickerSaveNew").files[0].path;
        console.log(repoFullPath);
    }
    var cloneURL = document.getElementById("repoClone").value;
    if (!cloneURL || cloneURL.length === 0) {
        updateModalText("Clone Failed - Empty URL Given");
        switchToAddRepositoryPanel();
    }
    else {
        downloadFunc(cloneURL, fullLocalPath);
    }
}
function createSettingsDir() {
    try {
        fs.mkdirSync(settingsPath);
    }
    catch (err) {
        if (err.code != 'EEXIST')
            throw err;
    }
}
function loadMostRecentRepos() {
    try {
        var fd = fs.readFileSync(recentFiles, 'utf8');
        var recentRepos = JSON.parse(fd);
        return recentRepos.last5Repos.map(function (item) { return item.filePath; });
    }
    catch (_a) {
        return [];
    }
}
function saveMostRecentRepos(fullLocalPath) {
    var now = new Date();
    var date = JSON.stringify(now);
    var recentRepos;
    var index = -1;
    try {
        var fd = fs.readFileSync(recentFiles, 'utf8');
        recentRepos = JSON.parse(fd);
    }
    catch (e) {
        console.log(e);
    }
    var obj = {
        filePath: fullLocalPath,
        date: date
    };
    if (recentRepos === undefined) {
        recentRepos = {
            last5Repos: [obj]
        };
    }
    else {
        index = recentRepos.last5Repos.map(function (item) { return item.filePath; }).indexOf(fullLocalPath);
        if (index >= 0) {
            recentRepos.last5Repos.splice(index, 1);
            recentRepos.last5Repos.push(obj);
        }
        else {
            if (recentRepos.last5Repos.length > 4) {
                recentRepos.last5Repos.splice(0, 1);
            }
            recentRepos.last5Repos.push(obj);
        }
    }
    try {
        jsonfile.writeFileSync(recentFiles, recentRepos, { flag: 'w' });
    }
    catch (err) {
        console.log(err);
    }
}
function downloadFunc(cloneURL, fullLocalPath) {
    console.log("Path of cloning repo: " + fullLocalPath);
    var progressDiv = document.getElementById("cloneProgressDiv");
    progressDiv.style.visibility = "visible";
    var options = {};
    options = {
        fetchOpts: {
            callbacks: {
                certificateCheck: function () {
                    return 1;
                },
                credentials: function () {
                    return Git.Cred.userpassPlaintextNew(getUsernameTemp(), getPasswordTemp());
                },
                transferProgress: function (data) {
                    var bytesRatio = data.receivedObjects() / data.totalObjects();
                    updateProgressBar(bytesRatio);
                }
            }
        }
    };
    console.log("cloning into " + fullLocalPath);
    var repository = Git.Clone.clone(cloneURL, fullLocalPath, options)
        .then(function (repository) {
        progressDiv.style.visibility = 'collapse';
        updateProgressBar(0);
        console.log("Repo successfully cloned");
        document.getElementById('spinner').style.display = 'block';
        refreshAll(repository);
        updateModalText("Clone Successful, repository saved under: " + fullLocalPath);
        addCommand("git clone " + cloneURL + " " + fullLocalPath);
        repoFullPath = fullLocalPath;
        repoLocalPath = fullLocalPath;
        document.getElementById('spinner').style.display = 'block';
        refreshAll(repository);
        switchToMainPanel();
        saveMostRecentRepos(fullLocalPath);
    }, function (err) {
        updateModalText("Clone Failed - " + err);
        console.log("repo.ts, line 64, failed to clone repo: " + err);
        switchToAddRepositoryPanel();
    });
}
function updateProgressBar(ratio) {
    var progressBar = document.getElementById("cloneProgressBar");
    var percentage = Math.floor(ratio * 100) + "%";
    progressBar.style.width = percentage;
    progressBar.innerHTML = percentage;
}
function openRepository() {
    console.log("Open Repository");
    if (document.getElementById("dirPickerOpenLocal").value === previousOpen && previousOpen != undefined) {
        return;
    }
    hidePRPanel();
    if (document.getElementById("repoOpen").value == null || document.getElementById("repoOpen").value == "") {
        var localPath = document.getElementById("dirPickerOpenLocal").files[0].webkitRelativePath;
        var fullLocalPath = document.getElementById("dirPickerOpenLocal").files[0].path;
        previousOpen = document.getElementById("dirPickerOpenLocal").value;
        document.getElementById("repoOpen").value = fullLocalPath;
        document.getElementById("repoOpen").text = fullLocalPath;
    }
    else {
        var localPath = document.getElementById("repoOpen").value;
        var fullLocalPath = void 0;
        if (checkFile.existsSync(localPath)) {
            fullLocalPath = localPath;
        }
        else {
            fullLocalPath = require("path").join(__dirname, localPath);
        }
    }
    console.log("Trying to open repository at " + fullLocalPath);
    displayModal("Opening Local Repository...");
    Git.Repository.open(fullLocalPath).then(function (repository) {
        repoFullPath = fullLocalPath;
        repoLocalPath = localPath;
        if (readFile.exists(repoFullPath + "/.git/MERGE_HEAD")) {
            var tid = readFile.read(repoFullPath + "/.git/MERGE_HEAD", null);
            console.log("current HEAD commit: " + tid);
        }
        if (readFile.exists(repoFullPath + "/.git/config")) {
            var gitConfigFileText = readFile.read(repoFullPath + "/.git/config", null);
            var searchString = "[remote \"origin\"]";
            gitConfigFileText = gitConfigFileText.substr(gitConfigFileText.indexOf(searchString) + searchString.length, gitConfigFileText.length);
            gitConfigFileText = gitConfigFileText.substr(0, gitConfigFileText.indexOf(".git"));
            var gitConfigFileSubstrings = gitConfigFileText.split('/');
            if (gitConfigFileSubstrings[0].indexOf("@") != -1) {
                gitConfigFileSubstrings[0] = gitConfigFileSubstrings[0].substring(gitConfigFileSubstrings[0].indexOf(":") + 1);
            }
            var repoOwner = gitConfigFileSubstrings[gitConfigFileSubstrings.length - 2];
            repoName = gitConfigFileSubstrings[gitConfigFileSubstrings.length - 1];
            if (!continuedWithoutSignIn) {
                $.ajax({
                    url: "https://api.github.com/repos/" + repoOwner + "/" + repoName + "/contributors",
                    type: "GET",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', make_base_auth(getUsername(), getPassword()));
                    },
                    headers: {
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    success: function (response) {
                        for (var i = 0; i < response.length; i++) {
                            contributors[i] = {
                                "username": response[i].login,
                                "name": "",
                                "email": ""
                            };
                        }
                        console.log("The contributors for this project are ", contributors);
                    },
                    error: function (xhr, status, error) {
                        console.log("The XML Http Request of the GitHub API call is: ", xhr);
                        console.log("The status of the GitHub API call is: ", status);
                        console.log("The error of the GitHub API call is: ", error);
                    }
                });
            }
        }
        document.getElementById('spinner').style.display = 'block';
        refreshAll(repository);
        console.log("Repo successfully opened");
        updateModalText("Repository successfully opened");
        saveMostRecentRepos(fullLocalPath);
    }, function (err) {
        updateModalText("No repository found. Select a folder with a repository.");
        console.log("repo.ts, line 101, cannot open repository: " + err);
        switchToAddRepositoryPanel();
    });
    document.getElementById("dirPickerOpenLocal").value = "";
}
function createLocalRepository() {
    if (document.getElementById("repoCreate").value == null || document.getElementById("repoCreate").value == "") {
        document.getElementById("dirPickerCreateLocal").click();
        var localPath = document.getElementById("dirPickerCreateLocal").files[0].webkitRelativePath;
        var fullLocalPath = document.getElementById("dirPickerCreateLocal").files[0].path;
        document.getElementById("repoCreate").value = fullLocalPath;
        document.getElementById("repoCreate").text = fullLocalPath;
        saveMostRecentRepos(fullLocalPath);
    }
    else {
        var localPath = document.getElementById("repoCreate").value;
        var fullLocalPath = void 0;
        if (!require('path').isAbsolute(localPath)) {
            updateModalText('The filepath is not valid. For OSX and Ubuntu the filepath should start with /, for Windows C:\\\\');
            return;
        }
        else {
            if (checkFile.existsSync(localPath)) {
                fullLocalPath = localPath;
            }
            else {
                checkFile.mkdirSync(localPath);
                fullLocalPath = localPath;
            }
        }
    }
    if (checkFile.existsSync(require("path").join(fullLocalPath, ".git"))) {
        updateModalText("This folder is already a git repository. Please try to open it instead.");
    }
    else {
        displayModal("creating repository at " + require("path").join(fullLocalPath, ".git"));
        Git.Repository.init(fullLocalPath, 0).then(function (repository) {
            repoFullPath = fullLocalPath;
            repoLocalPath = localPath;
            refreshAll(repository);
            updateModalText("Repository successfully created");
            document.getElementById("repoCreate").value = "";
            document.getElementById("dirPickerCreateLocal").value = null;
            switchToMainPanel();
        }, function (err) {
            updateModalText("Creating Failed - " + err);
        });
    }
}
function addBranchestoNode(thisB) {
    var elem = document.getElementById("otherBranches");
    elem.innerHTML = '';
    for (var i = 0; i < localBranches.length; i++) {
        if (localBranches[i] !== thisB) {
            console.log("local branch: " + localBranches[i]);
            var li = document.createElement("li");
            var a = document.createElement("a");
            a.appendChild(document.createTextNode(localBranches[i]));
            a.setAttribute("tabindex", "0");
            a.setAttribute("href", "#");
            li.appendChild(a);
            elem.appendChild(li);
        }
    }
}
function refreshAll(repository) {
    document.getElementById('spinner').style.display = 'block';
    var branch;
    bname = [];
    repository.getCurrentBranch()
        .then(function (reference) {
        var branchParts = reference.name().split("/");
        console.log("branch parts: " + branchParts);
        branch = branchParts[branchParts.length - 1];
    })
        .then(function () {
        return repository.getReferences(Git.Reference.TYPE.LISTALL);
    })
        .then(function (branchList) {
        var count = 0;
        clearBranchElement();
        var _loop_1 = function (i) {
            console.log("branch name: " + branchList[i].name());
            var bp = branchList[i].name().split("/")[branchList[i].name().split("/").length - 1];
            Git.Reference.nameToId(repository, branchList[i].name()).then(function (oid) {
                console.log("old id " + oid);
                if (branchList[i].isRemote()) {
                    remoteName[bp] = oid;
                }
                else {
                    branchCommit.push(branchList[i]);
                    console.log(bp + " adding to end of " + oid.tostrS());
                    if (oid.tostrS() in bname) {
                        bname[oid.tostrS()].push(branchList[i]);
                    }
                    else {
                        bname[oid.tostrS()] = [branchList[i]];
                    }
                }
            }, function (err) {
                console.log("repo.ts, line 273, could not find referenced branch" + err);
            });
            if (branchList[i].isRemote()) {
                if (localBranches.indexOf(bp) < 0) {
                    displayBranch(bp, "branch-dropdown", "checkoutRemoteBranch(this)");
                }
            }
            else {
                localBranches.push(bp);
                displayBranch(bp, "branch-dropdown", "checkoutLocalBranch(this)");
            }
        };
        for (var i = 0; i < branchList.length; i++) {
            _loop_1(i);
        }
    })
        .then(function () {
        console.log("Updating the graph and the labels");
        drawGraph();
        var breakStringFrom;
        if (repoLocalPath.length > 20) {
            for (var i = 0; i < repoLocalPath.length; i++) {
                if (repoLocalPath[i] == "/") {
                    breakStringFrom = i;
                }
            }
            repoLocalPath = "..." + repoLocalPath.slice(breakStringFrom, repoLocalPath.length);
        }
        document.getElementById("repo-name").innerHTML = repoLocalPath;
        document.getElementById("branch-name").innerHTML = branch + '<span class="caret"></span>';
    }, function (err) {
        window.alert("Warning:\n" +
            "No branches have been found in this repository.\n" +
            "This is likely because there have been no commits made.");
        console.log("No branches found. Setting default label values to master");
        console.log("Updating the labels and graph");
        drawGraph();
        document.getElementById("repo-name").innerHTML = repoLocalPath;
        document.getElementById("branch-name").innerHTML = "master" + '<span class="caret"></span>';
    });
}
function getAllBranches() {
    var repos;
    Git.Repository.open(repoFullPath)
        .then(function (repo) {
        repos = repo;
        return repo.getReferenceNames(Git.Reference.TYPE.LISTALL);
    })
        .then(function (branchList) {
        clearBranchElement();
        for (var i = 0; i < branchList.length; i++) {
            console.log("branch discovered: " + branchList[i]);
            var bp = branchList[i].split("/");
            if (bp[1] !== "remotes") {
                displayBranch(bp[bp.length - 1], "branch-dropdown", "checkoutLocalBranch(this)");
            }
            Git.Reference.nameToId(repos, branchList[i]).then(function (oid) {
                console.log("old id " + oid);
            });
        }
    });
}
function getOtherBranches() {
    var list;
    var repos;
    Git.Repository.open(repoFullPath)
        .then(function (repo) {
        repos = repo;
        return repo.getReferenceNames(Git.Reference.TYPE.LISTALL);
    })
        .then(function (branchList) {
        clearMergeElement();
        list = branchList;
    })
        .then(function () {
        return repos.getCurrentBranch();
    })
        .then(function (ref) {
        var name = ref.name().split("/");
        console.log("merging remote branch with tracked local branch");
        clearBranchElement();
        for (var i = 0; i < list.length; i++) {
            var bp = list[i].split("/");
            if (bp[1] !== "remotes" && bp[bp.length - 1] !== name[name.length - 1]) {
                displayBranch(bp[bp.length - 1], "merge-dropdown", "mergeLocalBranches(this)");
            }
        }
    });
}
function clearMergeElement() {
    var ul = document.getElementById("merge-dropdown");
    ul.innerHTML = '';
}
function clearBranchElement() {
    var ul = document.getElementById("branch-dropdown");
    var li = document.getElementById("create-branch");
    ul.innerHTML = '';
    ul.appendChild(li);
}
function displayBranch(name, id, onclick) {
    var ul = document.getElementById(id);
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.setAttribute("href", "#");
    a.setAttribute("class", "list-group-item");
    a.setAttribute("onclick", onclick + ";event.stopPropagation()");
    li.setAttribute("role", "presentation");
    a.appendChild(document.createTextNode(name));
    a.innerHTML = name;
    li.appendChild(a);
    if (id == "branch-dropdown") {
        var isLocal = 0;
        var isRemote = 0;
        Git.Repository.open(repoFullPath)
            .then(function (repo) {
            Git.Reference.list(repo).then(function (array) {
                if (array.includes("refs/remotes/origin/" + name)) {
                    a.innerHTML += "<img src='./assets/remote-branch.png' width='20' height='20' align='right' title='Remote'>";
                    isRemote = 1;
                }
            });
        });
        Git.Repository.open(repoFullPath)
            .then(function (repo) {
            repo.getBranch(name).then(function () {
                a.innerHTML += "<img src='./assets/local-branch.png' width='20' height='20' align='right' title='Local'>";
                isLocal = 1;
            });
        });
        if (name.toLowerCase() != "master") {
            var button = document.createElement("Button");
            button.innerHTML = "Delete";
            button.classList.add('btn-danger');
            $(button).click(function () {
                if (isRemote && !isLocal) {
                    document.getElementById("localDeleteButton").style.display = 'none';
                    document.getElementById("remoteDeleteButton").style.display = '';
                }
                else if (isLocal && !isRemote) {
                    document.getElementById("remoteDeleteButton").style.display = 'none';
                    document.getElementById("localDeleteButton").style.display = '';
                }
                else {
                    document.getElementById("localDeleteButton").style.display = '';
                    document.getElementById("remoteDeleteButton").style.display = '';
                }
                $('#branch-to-delete').val(name);
                document.getElementById("displayedBranchName").innerHTML = name;
                $('#delete-branch-modal').modal();
            });
            li.appendChild(button);
        }
    }
    ul.appendChild(li);
}
function createDropDownFork(name, id) {
    var ul = document.getElementById(id);
    var button = document.createElement("div");
    var div = document.createElement("ul");
    var innerText = document.createTextNode(name + " (Forked List)");
    button.className = name;
    button.appendChild(innerText);
    var icon = document.createElement("i");
    icon.style.cssFloat = "right";
    icon.style.marginRight = "20px";
    icon.className = "fa fa-window-minimize";
    button.appendChild(icon);
    div.setAttribute("id", name);
    div.setAttribute("role", "menu");
    div.setAttribute("class", "list-group");
    button.onclick = function (e) {
        showDropDown(button);
        icon.className === "fa fa-window-minimize" ? icon.className = "fa fa-plus" : icon.className = "fa fa-window-minimize";
    };
    button.appendChild(div);
    ul.appendChild(button);
}
function showDropDown(ele) {
    var div = document.getElementById(ele.className);
    if (div.style.display === 'none') {
        div.style.display = 'block';
    }
    else {
        div.style.display = 'none';
    }
}
function checkoutLocalBranch(element) {
    var bn;
    var img = "<img";
    if (typeof element === "string") {
        bn = element;
    }
    else {
        bn = element.innerHTML;
    }
    if (bn.includes(img)) {
        bn = bn.substr(0, bn.lastIndexOf(img));
        if (bn.includes(img)) {
            bn = bn.substr(0, bn.lastIndexOf(img));
        }
    }
    console.log("name of branch being checked out: " + bn);
    Git.Repository.open(repoFullPath)
        .then(function (repo) {
        document.getElementById('spinner').style.display = 'block';
        addCommand("git checkout " + bn);
        repo.checkoutBranch("refs/heads/" + bn)
            .then(function () {
            refreshAll(repo);
        }, function (err) {
            console.log("repo.tx, line 271, cannot checkout local branch: " + err);
        });
    });
}
function checkoutRemoteBranch(element) {
    var bn;
    var img = "<img";
    if (typeof element === "string") {
        bn = element;
    }
    else {
        bn = element.innerHTML;
    }
    if (bn.includes(img)) {
        bn = bn.substr(0, bn.lastIndexOf(img));
        if (bn.includes(img)) {
            bn = bn.substr(0, bn.lastIndexOf(img));
        }
    }
    console.log("current branch name: " + bn);
    var repos;
    Git.Repository.open(repoFullPath)
        .then(function (repo) {
        repos = repo;
        addCommand("git fetch");
        addCommand("git checkout -b " + bn);
        var cid = remoteName[bn];
        console.log("name of remote branch:  " + cid);
        return Git.Commit.lookup(repo, cid);
    })
        .then(function (commit) {
        console.log("commiting");
        return Git.Branch.create(repos, bn, commit, 0);
    })
        .then(function (code) {
        console.log("name of local branch " + bn);
        repos.mergeBranches(bn, "origin/" + bn)
            .then(function () {
            document.getElementById('spinner').style.display = 'block';
            refreshAll(repos);
            console.log("Pull successful");
        });
    }, function (err) {
        console.log("repo.ts, line 306, could not pull from repository" + err);
    });
}
function updateLocalPath() {
    var fullLocalPath;
    var text = document.getElementById("repoClone").value;
    var splitText = text.split(/\.|:|\//);
    if (splitText[splitText.length - 1] == "git") {
        fullLocalPath = require("path").join(__dirname, splitText[splitText.length - 2]);
        updateRepoSaveText(fullLocalPath);
    }
    else {
        fullLocalPath = require("path").join(__dirname, splitText[splitText.length - 1]);
        updateRepoSaveText(fullLocalPath);
    }
}
function updateRepoSaveText(fullLocalPath) {
    document.getElementById("repoSave").value = fullLocalPath;
    document.getElementById("repoSave").text = fullLocalPath;
}
function chooseLocalPath() {
    if (document.getElementById("repoClone").value == null || document.getElementById("repoClone").value == "") {
        window.alert("Please enter the URL of the repository you wish to clone");
    }
    else {
        var text = document.getElementById("repoClone").value;
        var splitText = text.split(/\.|:|\//);
        var fullLocalPath = void 0;
        localPath = document.getElementById("dirPickerSaveNew").files[0].webkitRelativePath;
        fullLocalPath = document.getElementById("dirPickerSaveNew").files[0].path;
        updateRepoSaveText(fullLocalPath);
    }
}
function displayModal(text) {
    document.getElementById("modal-text-box").innerHTML = text;
    $('#modal').modal('show');
}
function updateModalText(text) {
    document.getElementById("modal-text-box").innerHTML = text;
    $('#modal').modal('show');
}
function hidePRPanel() {
    var prStatus1 = document.getElementById("pr-status-1");
    var prStatus2 = document.getElementById("pr-status-2");
    if (prStatus1 != null && prStatus2 != null) {
        prStatus1.style.display = "none";
        prStatus2.style.display = "none";
    }
    var prPanel = document.getElementById("pull-request-panel");
    var bodyPanel = document.getElementById("body-panel");
    var prListContainer = document.getElementById("pr-list-container");
    var prDisplayPanel = document.getElementById("pr-display-panel");
    if (prPanel != null && bodyPanel != null && prListContainer != null && prDisplayPanel != null) {
        prPanel.style.width = "60px";
        prListContainer.style.display = "none";
        bodyPanel.style.width = "calc(80% - 60px)";
        prDisplayPanel.style.display = "none";
    }
    var prDiv = document.getElementById("pr-div");
    if (prDiv != null) {
        prDiv.innerHTML = "";
    }
    var prDiff = document.getElementById("pr-diff");
    if (prDiff != null) {
        prDiff.innerHTML = "";
    }
    var prList = document.getElementById("pr-list");
    if (prList != null) {
        prList.innerHTML = "";
    }
    var prFrom = document.getElementById("pr-from");
    if (prFrom != null) {
        prFrom.innerHTML = "";
    }
    var prTo = document.getElementById("pr-to");
    if (prTo != null) {
        prTo.innerHTML = "";
    }
}
