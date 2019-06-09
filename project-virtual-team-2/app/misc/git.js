"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var opn = require('opn');
var $ = require("jquery");
var Git = require("nodegit");
var fs = require("fs");
var async = require("async");
var readFile = require("fs-sync");
var green = "#84db00";
var repo, index, oid, remote, commitMessage;
var filesToAdd = [];
var theirCommit = null;
var modifiedFiles;
var warnbool;
var CommitButNoPush = 0;
var stagedFiles;
var vis = require("vis");
var commitHistory = [];
var commitToRevert = 0;
var commitHead = 0;
var commitID = 0;
function passReferenceCommits() {
    Git.Repository.open(repoFullPath)
        .then(function (commits) {
        sortedListOfCommits(commits);
    });
}
function sortedListOfCommits(commits) {
    while (commits.length > 0) {
        var commit = commits.shift();
        var parents = commit.parents();
        if (parents === null || parents.length === 0) {
            commitHistory.push(commit);
        }
        else {
            var count = 0;
            for (var i = 0; i < parents.length; i++) {
                var psha = parents[i].toString();
                for (var j = 0; j < commitHistory.length; j++) {
                    if (commitHistory[j].toString() === psha) {
                        count++;
                        break;
                    }
                }
                if (count < i + 1) {
                    break;
                }
            }
            if (count === parents.length) {
                commitHistory.push(commit);
            }
            else {
                commits.push(commit);
            }
        }
    }
}
function cloneFromRemote() {
    switchToClonePanel();
}
function refreshColor() {
    var userColorFilePath = ".settings/user_color.txt";
    if (fs.existsSync(userColorFilePath)) {
        fs.readFile(userColorFilePath, function (err, buffer) {
            var color = buffer.toString();
            changeColor(color);
        });
    }
}
function stage() {
    var repository;
    Git.Repository.open(repoFullPath)
        .then(function (repoResult) {
        repository = repoResult;
        console.log("found a repository");
        return repository.refreshIndex();
    })
        .then(function (indexResult) {
        console.log("found a file to stage");
        index = indexResult;
        var filesToStage = [];
        filesToAdd = [];
        var fileElements = document.getElementsByClassName('file');
        for (var i = 0; i < fileElements.length; i++) {
            var fileElementChildren = fileElements[i].childNodes;
            if (fileElementChildren[1].checked === true) {
                filesToStage.push(fileElementChildren[0].innerHTML);
                filesToAdd.push(fileElementChildren[0].innerHTML);
            }
        }
        if (filesToStage.length > 0) {
            console.log("staging files");
            stagedFiles = index.addAll(filesToStage);
        }
        else {
            throw new Error("No files selected to commit.");
        }
    });
    if (stagedFiles == null || stagedFiles.length !== 0) {
        if (document.getElementById("staged-files-message") !== null) {
            var filePanelMessage = document.getElementById("staged-files-message");
            filePanelMessage.parentNode.removeChild(filePanelMessage);
        }
    }
}
function addAndCommit() {
    commitMessage = document.getElementById('commit-message-input').value;
    if (commitMessage == null || commitMessage == "") {
        window.alert("Cannot commit without a commit message. Please add a commit message before committing");
        return;
    }
    var repository;
    Git.Repository.open(repoFullPath)
        .then(function (repoResult) {
        repository = repoResult;
        console.log("found a repository");
        return repository.refreshIndex();
    })
        .then(function (indexResult) {
        console.log("found a file to stage");
        index = indexResult;
        var filesToStage = [];
        filesToAdd = [];
        var fileElements = document.getElementsByClassName('file');
        for (var i = 0; i < fileElements.length; i++) {
            var fileElementChildren = fileElements[i].childNodes;
            if (fileElementChildren[1].checked === true) {
                filesToStage.push(fileElementChildren[0].innerHTML);
                filesToAdd.push(fileElementChildren[0].innerHTML);
            }
        }
        if (filesToStage.length > 0) {
            console.log("staging files");
            return index.addAll(filesToStage);
        }
        else {
            throw new Error("No files selected to commit.");
        }
    })
        .then(function () {
        console.log("found an index to write result to");
        return index.write();
    })
        .then(function () {
        console.log("creating a tree object using current index");
        return index.writeTree();
    })
        .then(function (oidResult) {
        console.log("changing " + oid + " to " + oidResult);
        oid = oidResult;
        return Git.Reference.nameToId(repository, "HEAD");
    })
        .then(function (head) {
        console.log("found the current commit");
        return repository.getCommit(head);
    })
        .then(function (parent) {
        console.log("Verifying account");
        var sign;
        sign = repository.defaultSignature();
        commitMessage = document.getElementById('commit-message-input').value;
        console.log("Signature to be put on commit: " + sign.toString());
        if (readFile.exists(repoFullPath + "/.git/MERGE_HEAD")) {
            var tid = readFile.read(repoFullPath + "/.git/MERGE_HEAD", null);
            console.log("head commit on remote: " + tid);
            console.log("head commit on local repository: " + parent.id.toString());
            return repository.createCommit("HEAD", sign, sign, commitMessage, oid, [parent.id().toString(), tid.trim()]);
        }
        else {
            console.log('no other commits');
            return repository.createCommit("HEAD", sign, sign, commitMessage, oid, [parent]);
        }
    })
        .then(function (oid) {
        theirCommit = null;
        console.log("Committing");
        changes = 0;
        CommitButNoPush = 1;
        console.log("Commit successful: " + oid.tostrS());
        stagedFiles = null;
        hideDiffPanel();
        clearStagedFilesList();
        clearCommitMessage();
        for (var i = 0; i < filesToAdd.length; i++) {
            addCommand("git add " + filesToAdd[i]);
        }
        addCommand('git commit -m "' + commitMessage + '"');
        refreshAll(repository);
    }, function (err) {
        console.log("git.ts, line 112, could not commit, " + err);
        if (err.message == "No files selected to commit.") {
            displayModal(err.message);
        }
        else {
            updateModalText("You have not logged in. Please login to commit a change");
        }
    });
}
function clearStagedFilesList() {
    var filePanel = document.getElementById("files-staged");
    while (filePanel.firstChild) {
        filePanel.removeChild(filePanel.firstChild);
    }
    var filesChangedMessage = document.createElement("p");
    filesChangedMessage.className = "modified-files-message";
    filesChangedMessage.id = "staged-files-message";
    filesChangedMessage.innerHTML = "Your staged files will appear here";
    filePanel.appendChild(filesChangedMessage);
    changeColor();
}
function clearModifiedFilesList() {
    var filePanel = document.getElementById("files-changed");
    while (filePanel.firstChild) {
        filePanel.removeChild(filePanel.firstChild);
    }
    var filesChangedMessage = document.createElement("p");
    filesChangedMessage.className = "modified-files-message";
    filesChangedMessage.id = "modified-files-message";
    filesChangedMessage.innerHTML = "Your modified files will appear here";
    filePanel.appendChild(filesChangedMessage);
    var userColorFilePath = ".settings/user_color.txt";
    refreshColor();
}
function clearCommitMessage() {
    document.getElementById('commit-message-input').value = "";
}
function getAllCommits(callback) {
    clearModifiedFilesList();
    var repos;
    var allCommits = [];
    var aclist = [];
    console.log("Finding all commits");
    Git.Repository.open(repoFullPath)
        .then(function (repo) {
        repos = repo;
        console.log("fetching all remote repositories");
        return repo.getReferences(Git.Reference.TYPE.LISTALL);
    })
        .then(function (refs) {
        var count = 0;
        console.log("getting " + refs.length + " remote repositories");
        async.whilst(function () {
            return count < refs.length;
        }, function (cb) {
            if (!refs[count].isRemote()) {
                console.log("referenced branch exists on remote repository");
                repos.getReferenceCommit(refs[count])
                    .then(function (commit) {
                    var history = commit.history(Git.Revwalk.SORT.Time);
                    history.on("end", function (commits) {
                        for (var i = 0; i < commits.length; i++) {
                            if (aclist.indexOf(commits[i].toString()) < 0) {
                                allCommits.push(commits[i]);
                                aclist.push(commits[i].toString());
                            }
                        }
                        count++;
                        console.log(count + " out of " + allCommits.length + " commits");
                        cb();
                    });
                    history.start();
                });
            }
            else {
                console.log('current branch does not exist on remote');
                count++;
                cb();
            }
        }, function (err) {
            console.log("git.ts, line 203, cannot load all commits" + err);
            callback(allCommits);
        });
    });
}
function PullBuffer() {
    if ((changes == 1) || (CommitButNoPush == 1)) {
        $("#modalW3").modal();
    }
    else {
        pullFromRemote();
    }
}
function pullFromRemote() {
    var repository;
    var branch = document.getElementById("branch-name").innerText;
    if (modifiedFiles.length > 0) {
        updateModalText("Please commit before pulling from remote!");
    }
    Git.Repository.open(repoFullPath)
        .then(function (repo) {
        repository = repo;
        console.log("Pulling new changes from the remote repository");
        addCommand("git pull");
        displayModal("Pulling new changes from the remote repository");
        return repository.fetchAll({
            callbacks: {
                credentials: function () {
                    return cred;
                },
                certificateCheck: function () {
                    return 1;
                }
            }
        });
    })
        .then(function () {
        return Git.Reference.nameToId(repository, "refs/remotes/origin/" + branch);
    })
        .then(function (oid) {
        console.log("Looking up commit with id " + oid + " in all repositories");
        return Git.AnnotatedCommit.lookup(repository, oid);
    }, function (err) {
        console.log("fetching all remgit.ts, line 251, cannot find repository with old id" + err);
    })
        .then(function (annotated) {
        console.log("merging " + annotated + "with local forcefully");
        Git.Merge.merge(repository, annotated, null, {
            checkoutStrategy: Git.Checkout.STRATEGY.FORCE,
        });
        theirCommit = annotated;
    })
        .then(function () {
        var conflicsExist = false;
        var tid = "";
        if (readFile.exists(repoFullPath + "/.git/MERGE_MSG")) {
            tid = readFile.read(repoFullPath + "/.git/MERGE_MSG", null);
            conflicsExist = tid.indexOf("Conflicts") !== -1;
        }
        if (conflicsExist) {
            var conflictedFiles = tid.split("Conflicts:")[1];
            refreshAll(repository);
            window.alert("Conflicts exists! Please check the following files:" + conflictedFiles +
                "\n Solve conflicts before you commit again!");
        }
        else {
            updateModalText("Successfully pulled from remote branch " + branch + ", and your repo is up to date now!");
            refreshAll(repository);
        }
    });
}
function pushToRemote() {
    if (CommitButNoPush === 0) {
        window.alert("Cannot push without a commit.");
        return;
    }
    var branch = document.getElementById("branch-name").innerText;
    Git.Repository.open(repoFullPath)
        .then(function (repo) {
        console.log("Pushing changes to remote");
        displayModal("Pushing changes to remote...");
        addCommand("git push -u origin " + branch);
        repo.getRemotes()
            .then(function (remotes) {
            repo.getRemote(remotes[0])
                .then(function (remote) {
                return remote.push(["refs/heads/" + branch + ":refs/heads/" + branch], {
                    callbacks: {
                        credentials: function () {
                            return cred;
                        }
                    }
                });
            })
                .then(function () {
                CommitButNoPush = 0;
                window.onbeforeunload = Confirmed;
                console.log("Push successful");
                updateModalText("Push successful");
                refreshAll(repo);
            });
        });
    });
}
function commitModal() {
    displayModal("Commit inside a modal yet to be implemented");
}
function openBranchModal() {
    $('#branch-modal').modal('show');
    var currentBranch = document.getElementById("branch-name").innerText;
    if (currentBranch === undefined || currentBranch == 'branch') {
        document.getElementById("currentBranchText").innerText = "Current Branch: ";
    }
    else {
        document.getElementById("currentBranchText").innerText = "Current Branch: " + currentBranch;
    }
}
function createBranch() {
    var branchName = document.getElementById("branch-name-input").value;
    if (typeof repoFullPath === "undefined") {
        document.getElementById("branchErrorText").innerText = "Warning: You are not within a Git repository. " +
            "Open a repository to create a new branch. ";
    }
    else if (branchName == '' || branchName == null) {
        document.getElementById("branchErrorText").innerText = "Warning: Please enter a branch name";
    }
    else if (isIllegalBranchName(branchName)) {
        document.getElementById("branchErrorText").innerText = "Warning: Illegal branch name. ";
    }
    else {
        var currentRepository_1;
        console.log(branchName + " is being created");
        Git.Repository.open(repoFullPath)
            .then(function (repo) {
            currentRepository_1 = repo;
            addCommand("git branch " + branchName);
            return repo.getHeadCommit()
                .then(function (commit) {
                return repo.createBranch(branchName, commit, 0, repo.defaultSignature(), "Created new-branch on HEAD");
            }, function (err) {
                console.log("git.ts, line 337, error occurred while trying to create a new branch " + err);
            });
        }).done(function () {
            $('#branch-modal').modal('hide');
            refreshAll(currentRepository_1);
            checkoutLocalBranch(branchName);
        });
        clearBranchErrorText();
    }
}
function clearBranchErrorText() {
    document.getElementById("branchErrorText").innerText = "";
    document.getElementById("branch-name-input").value = "";
}
function isIllegalBranchName(branchName) {
    var illegalPattern = new RegExp(/^[\./]|\.\.|@{|[\/\.]$|^@$|[~^:\x00-\x20\x7F\s?*[\\]/);
    if (illegalPattern.exec(branchName)) {
        return true;
    }
    else {
        return false;
    }
}
function deleteLocalBranch() {
    $('#delete-branch-modal').modal('toggle');
    var branchName = document.getElementById("branch-to-delete").value;
    console.log("deleting branch: " + branchName);
    var repos;
    console.log(branchName + " is being deleted...");
    Git.Repository.open(repoFullPath)
        .then(function (repo) {
        repos = repo;
        addCommand("git branch --delete " + branchName);
        repo.getBranch(branchName).then(function (reference) {
            Git.Branch.delete(reference);
        });
    }).then(function () {
        console.log("deleted the local branch");
        refreshAll(repos);
    });
}
function deleteRemoteBranch() {
    $('#delete-branch-modal').modal('toggle');
    var branchName = document.getElementById("branch-to-delete").value;
    var repos;
    console.log(branchName + " is being deleted...");
    Git.Repository.open(repoFullPath)
        .then(function (repo) {
        Git.Reference.list(repo).then(function (array) {
            if (array.includes("refs/remotes/origin/" + branchName)) {
                console.log("this is a remote branch");
                repo.getRemote('origin').then(function (remote) {
                    remote.push((':refs/heads/' + branchName), {
                        callbacks: {
                            credentials: function () {
                                return cred;
                            }
                        }
                    }).then(function () {
                        console.log("deleted the remote branch");
                        updateModalText("The remote branch: " + branchName + " has been deleted");
                    });
                });
            }
            else {
                console.log("this is a local branch");
                updateModalText("A remote branch called: " + branchName + " does not exist.");
                return;
            }
        });
    });
}
function mergeLocalBranches(element) {
    var bn = element.innerHTML;
    var fromBranch;
    var repos;
    Git.Repository.open(repoFullPath)
        .then(function (repo) {
        repos = repo;
    })
        .then(function () {
        addCommand("git merge " + bn);
        return repos.getBranch("refs/heads/" + bn);
    })
        .then(function (branch) {
        console.log("branch to merge from: " + branch.name());
        fromBranch = branch;
        return repos.getCurrentBranch();
    })
        .then(function (toBranch) {
        console.log("branch to merge to: " + toBranch.name());
        return repos.mergeBranches(toBranch, fromBranch, repos.defaultSignature(), Git.Merge.PREFERENCE.NONE, null);
    })
        .then(function (index) {
        var text;
        console.log("Checking for conflicts in merge at " + index);
        if (index instanceof Git.Index) {
            text = "Conflicts Exist";
        }
        else {
            text = "Merge Successfully";
        }
        console.log(text);
        updateModalText(text);
        refreshAll(repos);
    });
}
function mergeCommits(from) {
    var repos;
    var index;
    Git.Repository.open(repoFullPath)
        .then(function (repo) {
        repos = repo;
        addCommand("git merge " + from);
        return Git.Reference.nameToId(repos, 'refs/heads/' + from);
    })
        .then(function (oid) {
        console.log("Looking for commit with id " + oid + " in repositories");
        return Git.AnnotatedCommit.lookup(repos, oid);
    })
        .then(function (annotated) {
        console.log("Force merge commit " + annotates + " into HEAD");
        Git.Merge.merge(repos, annotated, null, {
            checkoutStrategy: Git.Checkout.STRATEGY.FORCE,
        });
        theirCommit = annotated;
    })
        .then(function () {
        if (fs.existsSync(repoFullPath + "/.git/MERGE_MSG")) {
            updateModalText("Conflicts exists! Please check files list on right side and solve conflicts before you commit again!");
            refreshAll(repos);
        }
        else {
            updateModalText("Successfully Merged!");
            refreshAll(repos);
        }
    });
}
function rebaseCommits(from, to) {
    var repos;
    var index;
    var branch;
    Git.Repository.open(repoFullPath)
        .then(function (repo) {
        repos = repo;
        addCommand("git rebase " + to);
        return Git.Reference.nameToId(repos, 'refs/heads/' + from);
    })
        .then(function (oid) {
        console.log("Looking for commit id: " + oid + " in repositories");
        return Git.AnnotatedCommit.lookup(repos, oid);
    })
        .then(function (annotated) {
        console.log("finding the id of " + annotated);
        branch = annotated;
        return Git.Reference.nameToId(repos, 'refs/heads/' + to);
    })
        .then(function (oid) {
        console.log("" + oid);
        return Git.AnnotatedCommit.lookup(repos, oid);
    })
        .then(function (annotated) {
        console.log("Changing commit message");
        return Git.Rebase.init(repos, branch, annotated, null, null);
    })
        .then(function (rebase) {
        console.log("Rebasing");
        return rebase.next();
    })
        .then(function (operation) {
        refreshAll(repos);
    });
}
function rebaseInMenu(from, to) {
    var p1 = document.getElementById("fromRebase");
    var p2 = document.getElementById("toRebase");
    var p3 = document.getElementById("rebaseModalBody");
    p1.innerHTML = from;
    p2.innerHTML = to;
    p3.innerHTML = "Do you want to rebase branch " + from + " to " + to + " ?";
    $("#rebaseModal").modal('show');
}
function mergeInMenu(from) {
    var p1 = document.getElementById("fromMerge");
    var p3 = document.getElementById("mergeModalBody");
    p1.innerHTML = from;
    p3.innerHTML = "Do you want to merge branch " + from + " to HEAD ?";
    $("#mergeModal").modal('show');
}
function resetCommit(name) {
    var repos;
    Git.Repository.open(repoFullPath)
        .then(function (repo) {
        repos = repo;
        addCommand("git reset --hard");
        return Git.Reference.nameToId(repo, name);
    })
        .then(function (id) {
        console.log("looking for: " + id);
        return Git.AnnotatedCommit.lookup(repos, id);
    })
        .then(function (commit) {
        var checkoutOptions = new Git.CheckoutOptions();
        return Git.Reset.fromAnnotated(repos, commit, Git.Reset.TYPE.HARD, checkoutOptions);
    })
        .then(function (number) {
        console.log("resetting " + number);
        if (number !== 0) {
            updateModalText("Reset failed, please check if you have pushed the commit.");
        }
        else {
            updateModalText("Reset successfully.");
        }
        refreshAll(repos);
    }, function (err) {
        updateModalText(err);
    });
}
function revertCommit() {
    var repos;
    Git.Repository.open(repoFullPath)
        .then(function (Commits) {
        sortedListOfCommits(Commits);
        console.log("Commits; " + commitHistory[0]);
    });
    Git.Repository.open(repoFullPath)
        .then(function (repo) {
        repos = repo;
        return repos;
        console.log("This is repos " + repos);
    })
        .then(function (Commits) {
        var index = returnSelectedNodeValue() - 1;
        var commitToRevert = commitHistory[index].sha().substr(0, 7);
        addCommand("git revert " + commitToRevert);
        var revertOptions = new Git.RevertOptions();
        revertOptions.mainline = 0;
        if (commitHistory[index].parents().length > 1) {
            revertOptions.mainline = 1;
        }
        revertOptions.mergeInMenu = 1;
        return Git.Revert.revert(repos, commitHistory[index], revertOptions)
            .then(function (number) {
            console.log("Reverting to " + number);
            if (number === -1) {
                updateModalText("Revert failed, please check if you have pushed the commit.");
            }
            else {
                updateModalText("Revert successfully.");
            }
            refreshAll(repos);
        })
            .catch(function (err) {
            console.log(err);
            updateModalText("Error reverting commit, please commit changes as they will be overwritten, then try again");
        });
    });
}
function ExitBeforePush() {
    $("#modalW").modal();
}
function Confirmed() {
}
function Close() {
    window.onbeforeunload = Confirmed;
    window.close();
}
function Reload() {
    window.onbeforeunload = Confirmed;
    location.reload();
}
function displayModifiedFiles() {
    modifiedFiles = [];
    var selectedFile = "";
    Git.Repository.open(repoFullPath)
        .then(function (repo) {
        repo.getStatus().then(function (statuses) {
            statuses.forEach(addModifiedFile);
            if (modifiedFiles.length !== 0) {
                if (document.getElementById("modified-files-message") !== null) {
                    var filePanelMessage = document.getElementById("modified-files-message");
                    filePanelMessage.parentNode.removeChild(filePanelMessage);
                }
            }
            modifiedFiles.forEach(displayModifiedFile);
            removeNonExistingFiles();
            refreshColor();
            function removeNonExistingFiles() {
                var filePaths = document.getElementsByClassName('file-path');
                for (var i = 0; i < filePaths.length; i++) {
                    if (filePaths[i].parentElement.className !== "file file-deleted") {
                        var filePath = repoFullPath + "\\" + filePaths[i].innerHTML;
                        if (!fs.existsSync(filePath)) {
                            filePaths[i].parentElement.remove();
                        }
                    }
                }
            }
            function addModifiedFile(file) {
                var filePaths = document.getElementsByClassName('file-path');
                for (var i = 0; i < filePaths.length; i++) {
                    if (filePaths[i].innerHTML === file.path()) {
                        return;
                    }
                }
                var path = file.path();
                var modification = calculateModification(file);
                modifiedFiles.push({
                    filePath: path,
                    fileModification: modification
                });
            }
            function calculateModification(status) {
                if (status.isNew()) {
                    return "NEW";
                }
                else if (status.isModified()) {
                    return "MODIFIED";
                }
                else if (status.isDeleted()) {
                    return "DELETED";
                }
                else if (status.isTypechange()) {
                    return "TYPECHANGE";
                }
                else if (status.isRenamed()) {
                    return "RENAMED";
                }
                else if (status.isIgnored()) {
                    return "IGNORED";
                }
            }
            function Confirmation() {
                $("#modalW").modal();
                return 'Hi';
            }
            function unstage(file, fileId) {
                document.getElementById(fileId).remove();
                var modFilesMessage = document.getElementById("modified-files-message");
                if (modFilesMessage != null) {
                    modFilesMessage.remove();
                }
                stagedFiles = index.remove(file);
                if (document.getElementById("files-staged").children.length == 0) {
                    clearStagedFilesList();
                    stagedFiles = null;
                }
                displayModifiedFile(file);
                refreshColor();
            }
            document.getElementById("stage-all").onclick = function () {
                var unstagedFileElements = document.getElementById('files-changed').children;
                while (unstagedFileElements.length > 0) {
                    var checkbox = unstagedFileElements[0].getElementsByTagName("input")[0];
                    try {
                        checkbox.click();
                    }
                    catch (err) {
                        break;
                    }
                }
            };
            document.getElementById("unstage-all").onclick = function () {
                var stagedFileElements = document.getElementById('files-staged').children;
                while (stagedFileElements.length > 0) {
                    var checkbox = stagedFileElements[0].getElementsByTagName("input")[0];
                    try {
                        checkbox.click();
                    }
                    catch (err) {
                        break;
                    }
                }
            };
            function displayModifiedFile(file) {
                var filePath = document.createElement("p");
                filePath.className = "file-path";
                filePath.innerHTML = file.filePath;
                var fileElement = document.createElement("div");
                window.onbeforeunload = Confirmation;
                changes = 1;
                if (file.fileModification === "NEW") {
                    fileElement.className = "file file-created";
                }
                else if (file.fileModification === "MODIFIED") {
                    fileElement.className = "file file-modified";
                }
                else if (file.fileModification === "DELETED") {
                    fileElement.className = "file file-deleted";
                }
                else {
                    fileElement.className = "file";
                }
                fileElement.appendChild(filePath);
                fileElement.id = file.filePath;
                var checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.className = "checkbox";
                checkbox.onclick = function (event) {
                    if (checkbox.checked) {
                        stage();
                        displayStagedFile(file, fileElement.id);
                        refreshColor();
                    }
                    event.stopPropagation();
                };
                fileElement.appendChild(checkbox);
                document.getElementById("files-changed").appendChild(fileElement);
                fileElement.onclick = function () {
                    var doc = document.getElementById("diff-panel");
                    console.log("width of document: " + doc.style.width);
                    var fileName = document.createElement("p");
                    fileName.innerHTML = file.filePath;
                    if (doc.style.width === '0px' || doc.style.width === '') {
                        displayDiffPanel();
                        document.getElementById("diff-panel-body").innerHTML = "";
                        document.getElementById("diff-panel-body").appendChild(fileName);
                        if (fileElement.className === "file file-created") {
                            selectedFile = file.filePath;
                            printNewFile(file.filePath);
                        }
                        else {
                            var diffCols = document.createElement("div");
                            diffCols.innerText = "Old" + "\t" + "New" + "\t" + "+/-" + "\t" + "Content";
                            document.getElementById("diff-panel-body").appendChild(diffCols);
                            selectedFile = file.filePath;
                            printFileDiff(file.filePath);
                        }
                    }
                    else if (doc.style.width === '40%') {
                        document.getElementById("diff-panel-body").innerHTML = "";
                        document.getElementById("diff-panel-body").appendChild(fileName);
                        if (selectedFile === file.filePath) {
                            selectedFile = "";
                            hideDiffPanel();
                        }
                        else {
                            if (fileElement.className === "file file-created") {
                                selectedFile = file.filePath;
                                printNewFile(file.filePath);
                            }
                            else {
                                selectedFile = file.filePath;
                                printFileDiff(file.filePath);
                            }
                        }
                    }
                    else {
                        selectedFile = "";
                        hideDiffPanel();
                    }
                };
            }
            function displayStagedFile(file, fileId) {
                var filePath = document.createElement("p");
                filePath.className = "file-path";
                filePath.innerHTML = file.filePath;
                var fileElement = document.createElement("div");
                window.onbeforeunload = Confirmation;
                changes = 1;
                if (file.fileModification === "NEW") {
                    fileElement.className = "file file-created";
                }
                else if (file.fileModification === "MODIFIED") {
                    fileElement.className = "file file-modified";
                }
                else if (file.fileModification === "DELETED") {
                    fileElement.className = "file file-deleted";
                }
                else if (file.fileModification === "RENAMED") {
                    fileElement.className = "file file-renamed";
                }
                else {
                    fileElement.className = "file";
                }
                fileElement.id = fileId;
                fileElement.appendChild(filePath);
                var checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.className = "checkbox";
                checkbox.checked = true;
                checkbox.onclick = function (event) {
                    unstage(file, fileId);
                    event.stopPropagation();
                };
                fileElement.appendChild(checkbox);
                document.getElementById("files-staged").appendChild(fileElement);
                document.getElementById(fileId).remove();
                if (document.getElementById("files-changed").children.length == 0) {
                    clearModifiedFilesList();
                }
                fileElement.onclick = function () {
                    var doc = document.getElementById("diff-panel");
                    console.log("width of document: " + doc.style.width);
                    var fileName = document.createElement("p");
                    fileName.innerHTML = file.filePath;
                    if (doc.style.width === '0px' || doc.style.width === '') {
                        displayDiffPanel();
                        document.getElementById("diff-panel-body").innerHTML = "";
                        document.getElementById("diff-panel-body").appendChild(fileName);
                        if (fileElement.className === "file file-created") {
                            selectedFile = file.filePath;
                            printNewFile(file.filePath);
                        }
                        else {
                            var diffCols = document.createElement("div");
                            diffCols.innerText = "Old" + "\t" + "New" + "\t" + "+/-" + "\t" + "Content";
                            document.getElementById("diff-panel-body").appendChild(diffCols);
                            selectedFile = file.filePath;
                            printFileDiff(file.filePath);
                        }
                    }
                    else if (doc.style.width === '40%') {
                        document.getElementById("diff-panel-body").innerHTML = "";
                        document.getElementById("diff-panel-body").appendChild(fileName);
                        if (selectedFile === file.filePath) {
                            selectedFile = "";
                            hideDiffPanel();
                        }
                        else {
                            if (fileElement.className === "file file-created") {
                                selectedFile = file.filePath;
                                printNewFile(file.filePath);
                            }
                            else {
                                selectedFile = file.filePath;
                                printFileDiff(file.filePath);
                            }
                        }
                    }
                    else {
                        selectedFile = "";
                        hideDiffPanel();
                    }
                };
            }
            function printNewFile(filePath) {
                var fileLocation = require("path").join(repoFullPath, filePath);
                var lineReader = require("readline").createInterface({
                    input: fs.createReadStream(fileLocation)
                });
                var lineNumber = 0;
                lineReader.on("line", function (line) {
                    lineNumber++;
                    formatNewFileLine(lineNumber + "\t" + "+" + "\t" + line);
                });
            }
            function printFileDiff(filePath) {
                repo.getHeadCommit().then(function (commit) {
                    getCurrentDiff(commit, filePath, function (line) {
                        formatLine(line);
                    });
                });
            }
            function getCurrentDiff(commit, filePath, callback) {
                commit.getTree().then(function (tree) {
                    Git.Diff.treeToWorkdir(repo, tree, null).then(function (diff) {
                        diff.patches().then(function (patches) {
                            patches.forEach(function (patch) {
                                patch.hunks().then(function (hunks) {
                                    hunks.forEach(function (hunk) {
                                        hunk.lines().then(function (lines) {
                                            var oldFilePath = patch.oldFile().path();
                                            var newFilePath = patch.newFile().path();
                                            if (newFilePath === filePath) {
                                                lines.forEach(function (line) {
                                                    if (line.origin() != 62) {
                                                        callback(String.fromCharCode(line.origin())
                                                            + (line.oldLineno() != -1 ? line.oldLineno() : "")
                                                            + "\t" + (line.newLineno() != -1 ? line.newLineno() : "")
                                                            + "\t" + String.fromCharCode(line.origin())
                                                            + "\t" + line.content());
                                                    }
                                                });
                                            }
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            }
            function formatLine(line) {
                var element = document.createElement("div");
                if (line.charAt(0) === "+") {
                    element.style.backgroundColor = "#84db00";
                }
                else if (line.charAt(0) === "-") {
                    element.style.backgroundColor = "#ff2448";
                }
                line = line.slice(1, line.length);
                element.innerText = line;
                var spacer = document.createElement("spacer");
                spacer.style.width = document.getElementById("diff-panel-body").scrollWidth + "px";
                element.appendChild(spacer);
                document.getElementById("diff-panel-body").appendChild(element);
            }
            function formatNewFileLine(text) {
                var element = document.createElement("div");
                element.style.backgroundColor = green;
                element.innerHTML = text;
                var spacer = document.createElement("spacer");
                spacer.style.width = document.getElementById("diff-panel-body").scrollWidth + "px";
                element.appendChild(spacer);
                document.getElementById("diff-panel-body").appendChild(element);
            }
        });
    }, function (err) {
        console.log("waiting for repo to be initialised");
    });
}
function calculateModification(status) {
    if (status.isNew()) {
        return "NEW";
    }
    else if (status.isModified()) {
        return "MODIFIED";
    }
    else if (status.isDeleted()) {
        return "DELETED";
    }
    else if (status.isTypechange()) {
        return "TYPECHANGE";
    }
    else if (status.isRenamed()) {
        return "RENAMED";
    }
    else if (status.isIgnored()) {
        return "IGNORED";
    }
}
function deleteFile(filePath) {
    var newFilePath = filePath.replace(/\\/gi, "/");
    if (fs.existsSync(newFilePath)) {
        fs.unlink(newFilePath, function (err) {
            if (err) {
                alert("An error occurred updating the file" + err.message);
                console.log("git.ts, line 759, an error occurred updating the file " + err);
                return;
            }
            console.log("File successfully deleted");
        });
    }
    else {
        alert("This file doesn't exist, cannot delete");
    }
}
function cleanRepo() {
    var fileCount = 0;
    Git.Repository.open(repoFullPath)
        .then(function (repo) {
        console.log("Removing untracked files");
        displayModal("Removing untracked files...");
        addCommand("git clean -f");
        repo.getStatus().then(function (arrayStatusFiles) {
            arrayStatusFiles.forEach(deleteUntrackedFiles);
            function deleteUntrackedFiles(file) {
                var filePath = repoFullPath + "\\" + file.path();
                var modification = calculateModification(file);
                if (modification === "NEW") {
                    console.log("DELETING FILE " + filePath);
                    deleteFile(filePath);
                    console.log("DELETION SUCCESSFUL");
                    fileCount++;
                }
            }
        })
            .then(function () {
            console.log("Cleanup successful");
            if (fileCount !== 0) {
                updateModalText("Cleanup successful. Removed " + fileCount + " files.");
            }
            else {
                updateModalText("Nothing to remove.");
            }
            refreshAll(repo);
        });
    }, function (err) {
        console.log("Waiting for repo to be initialised");
        displayModal("Please select a valid repository");
    });
}
function requestLinkModal() {
    $("#fetch-modal").modal();
}
function fetchFromOrigin() {
    console.log("begin fetching");
    var upstreamRepoPath = document.getElementById("origin-path").value;
    if (upstreamRepoPath != null) {
        Git.Repository.open(repoFullPath)
            .then(function (repo) {
            console.log("fetch path valid");
            displayModal("Beginning Synchronisation...");
            addCommand("git remote add upstream " + upstreamRepoPath);
            addCommand("git fetch upstream");
            addCommand("git merge upstrean/master");
            console.log("fetch successful");
            updateModalText("Synchronisation Successful");
            refreshAll(repo);
        }, function (err) {
            console.log("Waiting for repo to be initialised");
            displayModal("Please select a valid repository");
        });
    }
    else {
        displayModal("No Path Found.");
    }
}
