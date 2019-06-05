import * as nodegit from "git";
import NodeGit, {Graph, Status} from "nodegit";


let opn = require('opn');
let $ = require("jquery");
let Git = require("nodegit");
let fs = require("fs");
let async = require("async");
let readFile = require("fs-sync");
let green = "#84db00";
let repo, index, oid, remote, commitMessage, stashMessage;
let filesToAdd = [];
let theirCommit = null;
let modifiedFiles;
let warnbool;
var CommitButNoPush = 0;
let stagedFiles: any;
let vis = require("vis");
let commitHistory = [];
let stashHistory = [""];
let commitToRevert = 0;
let commitHead = 0;
let commitID = 0;

/*
  - Gathers the current stashes kept in refs/stash and places their names in an array for git stash list
  - Function entered onclick from the Stash button on the NavBar
  - Updates the stash modal with the current stash history list
  - Contructs a DOM elements that gives users stash options for each stash
*/
function refreshStashHistory(){
    stashHistory = [""];
    console.log("initializing stash history...");
    if(readFile.exists(repoFullPath + "/.git/logs/refs/stash")){
      let txt = readFile.read(repoFullPath + "/.git/logs/refs/stash").split("\n");
      txt.pop();
      console.log("/.git/logs/refs/stash/\n" + txt);
      txt.forEach(function(line) {
        line = line.split(" ").slice(6, line.length).join(" ");
        console.log("Adding " + line + " to Stash history");
        stashHistory.unshift(line);
      });
    }
    stashHistory.pop();
    let stashListHTML = '';
    stashHistory.forEach((stash, i) => {
      stashListHTML +=
        '<div id="stash-item">' +
        'Stash{' + i + '}: ' + stash +
        '<div id="stash-actions">' +
        '<button class="btn btn-primary" onclick="popStash(' + i + ')" data-dismiss="modal">Pop</button>' +
        '<button class="btn btn-primary" onclick="applyStash(' + i + ')" data-dismiss="modal">Apply</button>' +
        '<button class="btn btn-primary" onclick="dropStash(' + i + ')" data-dismiss="modal">Drop</button><div/>' +
        '</div>'
        ;
    });
    document.getElementById('stash-list').innerHTML = stashListHTML;
  }

function passReferenceCommits(){
  Git.Repository.open(repoFullPath)
  .then(function(commits){
    sortedListOfCommits(commits);
  })
}

function sortedListOfCommits(commits){

    while (commits.length > 0) {
      let commit = commits.shift();
      let parents = commit.parents();
      if (parents === null || parents.length === 0) {
        commitHistory.push(commit);
      } else {
        let count = 0;
        for (let i = 0; i < parents.length; i++) {
          let psha = parents[i].toString();
          for (let j = 0; j < commitHistory.length; j++) {
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
        } else {
          commits.push(commit);
      }
    }
  }

}

function cloneFromRemote() {
  switchToClonePanel();
}

function refreshColor() {
  const userColorFilePath = ".settings/user_color.txt";

  // If user has previously saved a color, then set the app to that color
  if (fs.existsSync(userColorFilePath)) {
    fs.readFile(userColorFilePath, function (err, buffer) {
      let color = buffer.toString();
      changeColor(color);
    });
  }
}

function stage() {
  let repository;

  Git.Repository.open(repoFullPath)
    .then(function (repoResult) {
      repository = repoResult;
      console.log("found a repository");
      return repository.refreshIndex();
    })

    .then(function (indexResult) {
      console.log("found a file to stage");
      index = indexResult;
      let filesToStage = [];
      filesToAdd = [];
      let fileElements = document.getElementsByClassName('file');
      for (let i = 0; i < fileElements.length; i++) {
        let fileElementChildren = fileElements[i].childNodes;
        if (fileElementChildren[1].checked === true) {
          filesToStage.push(fileElementChildren[0].innerHTML);
          filesToAdd.push(fileElementChildren[0].innerHTML);
        }
      }
      if (filesToStage.length > 0) {
        console.log("staging files");
        stagedFiles = index.addAll(filesToStage);
      } else {
        //If no files checked, then throw error to stop empty commits
        throw new Error("No files selected to commit.");
      }
    });

  if (stagedFiles == null || stagedFiles.length !== 0) {
    if (document.getElementById("staged-files-message") !== null) {
      let filePanelMessage = document.getElementById("staged-files-message");
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
  let repository;

  Git.Repository.open(repoFullPath)
    .then(function (repoResult) {
      repository = repoResult;
      console.log("found a repository");
      return repository.refreshIndex();
    })

    .then(function (indexResult) {
      console.log("found a file to stage");
      index = indexResult;
      let filesToStage = [];
      filesToAdd = [];
      let fileElements = document.getElementsByClassName('file');
      for (let i = 0; i < fileElements.length; i++) {
        let fileElementChildren = fileElements[i].childNodes;
        if (fileElementChildren[1].checked === true) {
          filesToStage.push(fileElementChildren[0].innerHTML);
          filesToAdd.push(fileElementChildren[0].innerHTML);
        }
      }
      if (filesToStage.length > 0) {
        console.log("staging files");
        return index.addAll(filesToStage);
      } else {
        //If no files checked, then throw error to stop empty commits
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
      let sign;

      sign = repository.defaultSignature();

      commitMessage = document.getElementById('commit-message-input').value;
      console.log("Signature to be put on commit: " + sign.toString());

      if (readFile.exists(repoFullPath + "/.git/MERGE_HEAD")) {
        let tid = readFile.read(repoFullPath + "/.git/MERGE_HEAD", null);
        console.log("head commit on remote: " + tid);
        console.log("head commit on local repository: " + parent.id.toString());
        return repository.createCommit("HEAD", sign, sign, commitMessage, oid, [parent.id().toString(), tid.trim()]);
      } else {
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
      for (let i = 0; i < filesToAdd.length; i++) {
        addCommand("git add " + filesToAdd[i]);
      }
      addCommand('git commit -m "' + commitMessage + '"');
      refreshAll(repository);
    }, function (err) {
      console.log("git.ts, func addAndCommit(), could not commit, " + err);
      // Added error thrown for if files not selected
      if (err.message == "No files selected to commit.") {
        displayModal(err.message);
      } else {
        updateModalText("Unexpected Error: " + err.message + " Please restart and try again.");
      }
    });
}

/* Issue 35: Add stashing functionality
   Mostly copied from addAndCommit
    - Function entered from Stash button
    - Must have a stash message where text is input in commit-message-input
*/
function addAndStash(options) {
  stashMessage = document.getElementById("commit-message-input").value;
  if(stashMessage == null || stashMessage == ""){
    window.alert("Cannot stash without a stash message. Please add a stash message before stashing");
  return;
  }
  if(options == null) options = 0;
  let repository;
  Git.Repository.open(repoFullPath)
    .then(function (repoResult) {
      repository = repoResult;
      console.log("found a repository");
      return repository.refreshIndex();
    })

    .then(function (indexResult) {
      console.log("found a file to stage");
      index = indexResult;
      let filesToStage = [];
      filesToAdd = [];
      let fileElements = document.getElementsByClassName('file');
      for (let i = 0; i < fileElements.length; i++) {
        let fileElementChildren = fileElements[i].childNodes;
        if (fileElementChildren[1].checked === true) {
          filesToStage.push(fileElementChildren[0].innerHTML);
          filesToAdd.push(fileElementChildren[0].innerHTML);
        }
      }
      if (filesToStage.length > 0) {
        console.log("staging files");
        return index.addAll(filesToStage);
      } else if(options != 2){
        //If no files checked, then throw error to stop empty commits
        throw new Error("No files selected to stash.");
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
      let sign;

      sign = repository.defaultSignature();

      console.log("Signature to be put on stash: " + sign.toString());


      // First branch of this If might be unecessary or replaceable by .git/refs/stash to check something else
      if (readFile.exists(repoFullPath + "/.git/MERGE_HEAD")) {
        let tid = readFile.read(repoFullPath + "/.git/MERGE_HEAD", null);
        console.log("head commit on remote: " + tid);
        console.log("head commit on local repository: " + parent.id.toString());
        return Git.Stash.save(repository, sign, stashMessage, options);
      } else {
        console.log('no other commits');
        return Git.Stash.save(repository, sign, stashMessage, options);
      }
    })
    .then(function (stashOID) {
      theirCommit = null;
      changes = 0;

      let branch = document.getElementById("branch-name").innerText;
      console.log("Current branch: " + branch);

      //The next 6 lines are somewhat unnecessary but useful for logging
      var comMessage = Git.Commit.lookup(repository, oid)
      .then(function(commit){
        return commit.message();
      });
      var stashName = ("WIP on " + branch + ": " + oid.tostrS().substring(0,8) + " " + comMessage);
      console.log("Stashing: "+ stashName);

      stagedFiles = null;

      hideDiffPanel();
      clearStagedFilesList();
      clearCommitMessage();

      for (let i = 0; i < filesToAdd.length; i++) {
        addCommand("git add " + filesToAdd[i]);
      }
      stashName = "On " + branch + ": " + stashMessage;
      console.log("Saved as: " + stashName);

      /* options
         Stash.FLAGS.DEFAULT             0
         Stash.FLAGS.KEEP_INDEX          1
         Stash.FLAGS.INCLUDE_UNTRACKED   2
         Stash.FLAGS.INCLUDE_IGNORED     4
      */
      switch(options){
        case "0":
          addCommand('git stash push -m "' + stashMessage + '"');
          break;
        case "1":
          addCommand('git stash push -k -m "' + stashMessage + '"');
          break;
        case "2":
          addCommand('git stash push -u -m "' + stashMessage + '"');
          break;
      }

     updateModalText("Stash successful!");
     stashHistory.unshift(stashName);
     refreshAll(repository);
    }, function (err) {
      console.log("git.ts, func addAndStash(), could not stash, " + err);
      // Added error thrown for if files not selected
      if (err.message == "No files selected to stash.") {
        displayModal(err.message);
      } else {
        updateModalText("Unexpected Error: " + err.message + " Please restart and try again.");
      }
    });
}



/* Issue 35: Add applying functionality
   Skeleton copied from pullFromRemote()
    - Function entered from onclick of the given stash in Stashing options window
    - pops stash from given index and merges into working directory. Fails if conflicts found.

    //TODO: Consider a revision in merging the pop/apply/drop functions. Easy to test with seperate functions for now.
*/
function popStash(index) {

  let repository;
  let branch = document.getElementById("branch-name").innerText;
  if (modifiedFiles.length > 0) {
    updateModalText("Please commit before popping stash!");
  }
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      if (index == null) index = 0;
      repository = repo;
      console.log("Popping stash at index " + index);
      addCommand("git stash pop stash@{" + index +"}");
      var stashName = stashHistory[index];
      displayModal("Popping stash: "+ stashName);

      let ret = Git.Stash.pop(repository, index, 0);
      console.log("Pop returned: " + ret);

      //ret returns an unknown object but API Doc says it should return ERROR.CODE
      if (ret == 0) {
        return;
      } else if (ret == Git.Error.CODE.ENOTFOUND){
        throw new Error("No stash found at given index.");
      } else if (ret == Git.Error.CODE.EMERGECONFLICT){
        throw new Error("Conflicts found while merging. Solve conflicts before continuing.");
      }

    })
    .then(function () {
      return Git.Reference.nameToId(repository, "refs/stash");
    })
     .then(function (oid) {
      console.log("Looking up stash with id " + oid + " in all repositories");
      return Git.AnnotatedCommit.lookup(repository, oid);
    })
    .then(function (annotated) {
      if(annotated != null){
        console.log("merging " + annotated.id() + " with local safely");
       var ret2 = Git.Merge.merge(repository, annotated, {fileFlags: Git.Merge.FILE_FLAG.FILE_IGNORE_WHITESPACE_CHANGE,
         flags: Git.Merge.FLAG.FAIL_ON_CONFLICT}, {
          checkoutStrategy: Git.Checkout.STRATEGY.SAFE,
        });
       console.log("Merge returned: " + ret2);
      }
      theirCommit = annotated;
      return ret2;
    })
    .then(function (mergeCode) {
      if(mergeCode == -13){
        window.alert("Conflicts exists! If safe to merge, stash will be applied.\nOtherwise, please stage and commit changes or\nresolve conflicts before you pop again!");
        updateModalText("Merged with conflicts. Please consider resolving conflicts in modified files or dropping stash.");
      } else {
        //TODO: refreshIndex with the stash node gone if not done automatically

        stashHistory.splice(index, 1);
        updateModalText("Success! No conflicts found with branch " + branch + ", and your repo is up to date now!");
      }
      refreshAll(repository);
      }, function(err) {
        console.log("git.ts, func popStash(), could not pop stash, " + err);
        displayModal(err.message);
        //TODO: If ambiguous errors thrown, use err.message shown to display more useful message if necessary
      });

}

/* Issue 35+: Add applying functionality
   copied from popStash()
    - Function entered from onclick of the given stash in Stashing options window
    - applies stash from given index and merges into working directory.
*/
function applyStash(index) {

  let repository;
  let branch = document.getElementById("branch-name").innerText;
  if (modifiedFiles.length > 0) {
    updateModalText("Please commit before applying stash!");
  }
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      if (index == null) index = 0;
      repository = repo;
      console.log("applying stash at index " + index);
      addCommand("git stash apply stash@{" + index +"}");
      var stashName = stashHistory[index];
      displayModal("Applying stash: "+ stashName);

      let ret = Git.Stash.apply(repository, index, 0);
      console.log("Apply returned: " + ret);

      //ret returns an unknown object but API Doc says it should return ERROR.CODE
      if (ret == 0) {
        return;
      } else if (ret == -3 /*id not found*/){
        throw new Error("No stash found at given index.");
      } else if (ret == -13 /*Merge Conflict*/){
        throw new Error("Conflicts found while merging. Solve conflicts before continuing.");
      }

    })
    .then(function () {
      return Git.Reference.nameToId(repository, "refs/stash");
    })
     .then(function (oid) {
      console.log("Looking up stash with id " + oid + " in all repositories");
      return Git.AnnotatedCommit.lookup(repository, oid);
    })
    .then(function (annotated) {
      if(annotated != null){
        console.log("merging " + annotated.id() + " with local safely");
       var ret2 = Git.Merge.merge(repository, annotated, {fileFlags: Git.Merge.FILE_FLAG.FILE_IGNORE_WHITESPACE_CHANGE,
         flags: Git.Merge.FLAG.FAIL_ON_CONFLICT}, {
          checkoutStrategy: Git.Checkout.STRATEGY.SAFE,
        });
       console.log("Merge returned: " + ret2);
      }
      theirCommit = annotated;
      return ret2;
    })
    .then(function (mergeCode) {
      if(mergeCode == -13){
        window.alert("Conflicts exists! If safe to merge, stash will be applied.\nOtherwise, please stage and commit changes or\nresolve conflicts before you apply again!");
        updateModalText("Merged with conflicts. Please consider resolving conflicts in modified files or dropping stash.");
      } else {
        //TODO: refreshIndex with the stash node gone if not done automatically

        updateModalText("Success! No conflicts found with branch " + branch + ", and your repo is up to date now!");
      }
      refreshAll(repository);
      }, function(err) {
        console.log("git.ts, func applyStash(), could not apply stash, " + err);
        displayModal(err.message);
        //TODO: If ambiguous errors thrown, use err.message shown to display more useful message if necessary
      });

}
/* Issue 35+: Add dropping stash functionality
   copied from popStash()
    - Function entered from onclick of the given stash in Stashing options window
    - drops stash from given index.

    //TODO: DROP IS NOT FUNCTIONAL ATM
*/
function dropStash(index) {

  let repository;
  let branch = document.getElementById("branch-name").innerText;

  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      if (index == null) index = 0;
      repository = repo;
      console.log("Dropping stash at index " + index);
      addCommand("git stash drop stash@{" + index +"}");
      var stashName = stashHistory.splice(index, 1);
      displayModal("Dropping stash: "+ stashName);

      let ret = Git.Stash.drop(repository, index, 0);
      console.log("Drop returned: " + ret);

      //ret returns an unknown object but API Doc says it should return ERROR.CODE
      if (ret === 0) {
        return;
      } else if (ret === -3 /*Git.Error.CODE.ENOTFOUND*/){
        throw new Error("No stash found at given index.");
      }
      //TODO: refreshIndex with the stash node gone if not done automatically

        updateModalText("Success! Stash at index " + index + " dropped from list.");
        refreshAll(repository);
      }, function(err) {
        console.log("git.ts, func dropStash(), could not drop stash, " + err);
        displayModal(err.message);
        //TODO: If ambiguous errors thrown, use err.message shown to display more useful message if necessary
      });

}

function clearStagedFilesList() {
  let filePanel = document.getElementById("files-staged");
  while (filePanel.firstChild) {
    filePanel.removeChild(filePanel.firstChild);
  }
  let filesChangedMessage = document.createElement("p");
  filesChangedMessage.className = "modified-files-message";
  filesChangedMessage.id = "staged-files-message";
  filesChangedMessage.innerHTML = "Your staged files will appear here";
  filePanel.appendChild(filesChangedMessage);

  changeColor();
}

// Clear all modified files from the left file panel
function clearModifiedFilesList() {
  let filePanel = document.getElementById("files-changed");
  while (filePanel.firstChild) {
    filePanel.removeChild(filePanel.firstChild);
  }
  let filesChangedMessage = document.createElement("p");
  filesChangedMessage.className = "modified-files-message";
  filesChangedMessage.id = "modified-files-message";
  filesChangedMessage.innerHTML = "Your modified files will appear here";
  filePanel.appendChild(filesChangedMessage);
  const userColorFilePath = ".settings/user_color.txt";

  refreshColor();
}

function clearCommitMessage() {
  document.getElementById('commit-message-input').value = "";
}



function getAllCommits(callback) {
  clearModifiedFilesList();
  let repos;
  let allCommits = [];
  let aclist = [];
  console.log("Finding all commits");
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repos = repo;
      console.log("fetching all remote repositories");
      return repo.getReferences(Git.Reference.TYPE.LISTALL);
    })
    .then(function (refs) {
      let count = 0;
      console.log("getting " + refs.length + " remote repositories");
      async.whilst(
        function () {
          return count < refs.length;
        },

        function (cb) {
          if (!refs[count].isRemote()) {
            console.log("referenced branch exists on remote repository");
            repos.getReferenceCommit(refs[count])
              .then(function (commit) {
                let history = commit.history(Git.Revwalk.SORT.Time);
                history.on("end", function (commits) {
                  for (let i = 0; i < commits.length; i++) {
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
          } else {
            console.log('current branch does not exist on remote');
            count++;
            cb();
          }
        },

        function (err) {
          console.log("git.ts, func getAllCommits(), cannot load all commits" + err);
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
  let repository;
  let branch = document.getElementById("branch-name").innerText;
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
            let user = new createCredentials(getUsernameTemp(), getPasswordTemp());
            cred = user.credentials;
            return cred;
          },
          certificateCheck: function () {
            return 1;
          }
        }
      });
    })
    // Now that we're finished fetching, go ahead and merge our local branch
    // with the new one
    .then(function () {
      return Git.Reference.nameToId(repository, "refs/remotes/origin/" + branch);
    })
    .then(function (oid) {
      console.log("Looking up commit with id " + oid + " in all repositories");
      return Git.AnnotatedCommit.lookup(repository, oid);
    }, function (err) {
      console.log("fetching all remgit.ts, func pullFromRemote(), cannot find repository with old id" + err);
    })
    .then(function (annotated) {
      console.log("merging " + annotated + "with local forcefully");
      Git.Merge.merge(repository, annotated, null, {
        checkoutStrategy: Git.Checkout.STRATEGY.FORCE,
      });
      theirCommit = annotated;
    })
    .then(function () {
      let conflicsExist = false;
      let tid = "";
      if (readFile.exists(repoFullPath + "/.git/MERGE_MSG")) {
        tid = readFile.read(repoFullPath + "/.git/MERGE_MSG", null);
        conflicsExist = tid.indexOf("Conflicts") !== -1;
      }

      if (conflicsExist) {
        let conflictedFiles = tid.split("Conflicts:")[1];
        refreshAll(repository);

        window.alert("Conflicts exists! Please check the following files:" + conflictedFiles +
         "\n Solve conflicts before you commit again!");
      } else {
        updateModalText("Successfully pulled from remote branch " + branch + ", and your repo is up to date now!");
        refreshAll(repository);
      }
    });
}

// function to determine the status of the remote repository compared to local repository
// functions takes the name of the branch
function getAheadBehindCommits(branchName) {
    let origin = "origin";
    origin = path.join(origin, branchName);
    return Git.Repository.open(repoFullPath).then(function (repo) {
        // returns commit that head is pointing too (most recent local commit)
        return repo.getHeadCommit().then(function (commit) {
            return repo.getReferenceCommit(origin).then(function (remoteCommit) {
                // return an object { ahead : <number of commits ahead>, behind: <number of commits behind>
                return Graph.aheadBehind(repo, commit.id(), remoteCommit.id()).then(function (aheadBehind) {
                    return aheadBehind;
                });
            }, function (e) {
                console.log(e.message)
            });
        });
    });
}

//checks if the remote version of your current branch exist
function checkIfExistOrigin(branchName) {
    let origin = "origin";
    origin = path.join(origin, branchName);
    return Git.Repository.open(repoFullPath).then(function (repo) {
        return repo.getReferenceCommit(origin).then(function (originCommit) {
            return true;
        }, function (e) {
            return false
        });
    });
}

function pushToRemote() {
    // checking status of remote repository and only push if you are ahead of remote
    // Todo use nodegit to get the name of branch
    let branch = document.getElementById("branch-name").innerText;
    //checks if the remote version of your current branch exist
    checkIfExistOrigin(branch).then(function(remoteBranchExist){
        if (!remoteBranchExist) {
            window.alert("fatal: The current branch test-branch has no upstream branch.\n" +
                "To push the current branch and set the remote as upstream, use\n" +
                "\n" +
                "    git push --set-upstream origin test-branch");
            return;
        } else {
            // tells the user if their branch is up to date or behind the remote branch
            getAheadBehindCommits(branch).then(function (aheadBehind) {
                if (aheadBehind.ahead === 0) {
                    window.alert("Your branch is already up to date");
                    return;
                } else if (aheadBehind.behind !== 0) {
                    window.alert("your branch is behind remote by " + aheadBehind.behind);
                    return;
                } else {
                    // Do the Push
                    Git.Repository.open(repoFullPath).then(function (repo) {
                        console.log("Pushing changes to remote");
                        displayModal("Pushing changes to remote...");
                        addCommand("git push -u origin " + branch);
                        repo.getRemotes().then(function (remotes) {
                            repo.getRemote(remotes[0]).then(function (remote) {
                                return remote.push(
                                    ["refs/heads/" + branch + ":refs/heads/" + branch],
                                    {
                                        callbacks: {
                                            // obtain a new copy of cred every time when user push.
                                            credentials: function () {
                                                let user = new createCredentials(getUsernameTemp(), getPasswordTemp());
                                                cred = user.credentials;
                                                return cred;
                                            }
                                        }
                                    }
                                );
                            }).then(function () {
                                CommitButNoPush = 0;
                                window.onbeforeunload = Confirmed;
                                console.log("Push successful");
                                updateModalText("Push successful");
                                refreshAll(repo);
                            });
                        });
                    });
                }
            });
        }
    });
}

function commitModal() {
  // TODO: implement commit modal
  displayModal("Commit inside a modal yet to be implemented");
}

function openBranchModal() {
  $('#branch-modal').modal('show');

  // Shows current branch inside the branch mdoal
  let currentBranch = document.getElementById("branch-name").innerText;
  if (currentBranch === undefined || currentBranch == 'branch') {
    document.getElementById("currentBranchText").innerText = "Current Branch: ";
  } else {
    document.getElementById("currentBranchText").innerText = "Current Branch: " + currentBranch;
  }
}

function createBranch() {
  let branchName = document.getElementById("branch-name-input").value;

  // console.log(repo.getBranch(branchName), 'this');

  if (typeof repoFullPath === "undefined") {
    // repository not selected
    document.getElementById("branchErrorText").innerText = "Warning: You are not within a Git repository. " +
        "Open a repository to create a new branch. ";
  }



  // Check for empty branch name
  // @ts-ignore
  else if (branchName == '' || branchName == null) {
    // repository not selected
    document.getElementById("branchErrorText").innerText = "Warning: Please enter a branch name";
  }

  // Check for invalid branch name
  // @ts-ignore
  else if (isIllegalBranchName(branchName)) {
    // repository not selected
    // @ts-ignore
    document.getElementById("branchErrorText").innerText = "Warning: Illegal branch name. ";
  }

  // TODO: check for existing branch
  // Check for existing branch
  // else if ( <existing branch> ) {}

  else {
    let currentRepository;

    console.log(branchName + " is being created");
    Git.Repository.open(repoFullPath)
      .then(function (repo) {
        // Create a new branch on head
        currentRepository = repo;
        addCommand("git branch " + branchName);
        return repo.getHeadCommit()
          .then(function (commit) {
            return repo.createBranch(
              branchName,
              commit,
              0,
              repo.defaultSignature(),
              "Created new-branch on HEAD");
          }, function (err) {
            console.log("git.ts, func createBranch(), error occurred while trying to create a new branch " + err);
          });
      }).done(function () {
        $('#branch-modal').modal('hide');
        refreshAll(currentRepository);
          checkoutLocalBranch(branchName);
        });
    clearBranchErrorText();
  }
}

function clearBranchErrorText() {
  // @ts-ignore
  document.getElementById("branchErrorText").innerText = "";
  // @ts-ignore
  document.getElementById("branch-name-input").value = "";
}

function isIllegalBranchName(branchName: string) : boolean {
  // Illegal pattern created by Tony Brix on StackOverflow
  // https://stackoverflow.com/questions/3651860/which-characters-are-illegal-within-a-branch-name
  let illegalPattern = new RegExp(/^[\./]|\.\.|@{|[\/\.]$|^@$|[~^:\x00-\x20\x7F\s?*[\\]/);

  if (illegalPattern.exec(branchName)){
    return true;
  } else {
    return false;
  }
}

// Deletes a local branch
function deleteLocalBranch() {
  $('#delete-branch-modal').modal('toggle') // open warning modal
  let branchName = document.getElementById("branch-to-delete").value; // selected branch name
  console.log("deleting branch: " + branchName)
  let repos;
  console.log(branchName + " is being deleted...")
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repos = repo;
      addCommand("git branch --delete " + branchName);

      //check if the selected branch is a local branch
      repo.getBranch(branchName).then(function (reference) {
        Git.Branch.delete(reference) // delete local branch
      })
    }).then(function () {
      // refresh graph
      console.log("deleted the local branch")
      refreshAll(repos);
    })
}

// Deletes a remote branch
function deleteRemoteBranch() {
  $('#delete-branch-modal').modal('toggle') // open warning modal
  let branchName = document.getElementById("branch-to-delete").value; // selected branch name
  let repos;
  console.log(branchName + " is being deleted...");

  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      Git.Reference.list(repo).then(function (array) {
        if (array.includes("refs/remotes/origin/" + branchName)) {  // check if the branch is remote
          console.log("this is a remote branch")

          // delete the remote branch
          repo.getRemote('origin').then(function (remote) {
            remote.push((':refs/heads/' + branchName),
              {
                callbacks: { // pass in user credentials as a parameter
                  credentials: function () {
                    let user = new createCredentials(getUsernameTemp(), getPasswordTemp());
                    cred = user.credentials;
                    return cred;
                  }
                }
              }).then(function () {
                console.log("deleted the remote branch")
                updateModalText("The remote branch: " + branchName + " has been deleted")
              });
          })
        }
        else {
          console.log("this is a local branch")
          updateModalText("A remote branch called: " + branchName + " does not exist.")
          return;
        }
      })
    })
}

function mergeLocalBranches(element) {
  let bn = element.innerHTML;
  let fromBranch;
  let repos;
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
      return repos.mergeBranches(toBranch,
        fromBranch,
        repos.defaultSignature(),
        Git.Merge.PREFERENCE.NONE,
        null);
    })
    .then(function (index) {
      let text;
      console.log("Checking for conflicts in merge at " + index);
      if (index instanceof Git.Index) {
        text = "Conflicts Exist";
      } else {
        text = "Merge Successfully";
      }
      console.log(text);
      updateModalText(text);
      refreshAll(repos);
    });
}

function mergeCommits(from) {
  let repos;
  let index;
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repos = repo;
      //return repos.getCommit(fromSha);
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
      } else {
        updateModalText("Successfully Merged!");
        refreshAll(repos);
      }
    });
}

function rebaseCommits(from: string, to: string) {
  let repos;
  let index;
  let branch;
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repos = repo;
      //return repos.getCommit(fromSha);
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

function rebaseInMenu(from: string, to: string) {
  let p1 = document.getElementById("fromRebase");
  let p2 = document.getElementById("toRebase");
  let p3 = document.getElementById("rebaseModalBody");
  p1.innerHTML = from;
  p2.innerHTML = to;
  p3.innerHTML = "Do you want to rebase branch " + from + " to " + to + " ?";
  $("#rebaseModal").modal('show');
}

function mergeInMenu(from: string) {
  let p1 = document.getElementById("fromMerge");
  let p3 = document.getElementById("mergeModalBody");
  p1.innerHTML = from;
  p3.innerHTML = "Do you want to merge branch " + from + " to HEAD ?";
  $("#mergeModal").modal('show');
}

function resetCommit(name: string) {
  let repos;
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
      let checkoutOptions = new Git.CheckoutOptions();
      return Git.Reset.fromAnnotated(repos, commit, Git.Reset.TYPE.HARD, checkoutOptions);
    })
    .then(function (number) {
      console.log("resetting " + number);
      if (number !== 0) {
        updateModalText("Reset failed, please check if you have pushed the commit.");
      } else {
        updateModalText("Reset successfully.");
      }
      refreshAll(repos);
    }, function (err) {
      updateModalText(err);
    });
}

function revertCommit() {

  let repos;
  Git.Repository.open(repoFullPath)
  .then(function(Commits){
    sortedListOfCommits(Commits);
     console.log("Commits; "+ commitHistory[0]);
  })

  Git.Repository.open(repoFullPath)
  .then(function(repo){
    repos = repo;
    return repos;
    console.log("This is repos "+ repos);
  })
  .then(function(Commits){
    let index = returnSelectedNodeValue()-1;
    let commitToRevert = commitHistory[index].sha().substr(0,7);
    addCommand("git revert "+ commitToRevert)});

  let revertOptions = new Git.RevertOptions();
  revertOptions.mainline = 0;
  if(commitHistory[index].parents().length > 1) {
    revertOptions.mainline = 1;
  }

  revertOptions.mergeInMenu = 1;
  return Git.Revert.revert(repos, commitHistory[index],revertOptions)
  .then(function(number) {
    console.log("Reverting to " + number);
    if (number === -1) {
      updateModalText("Revert failed, please check if you have pushed the commit.");
    } else {
      updateModalText("Revert successfully.");
    }
    refreshAll(repos);
  })
  .catch(function (err) {
    console.log(err);
    updateModalText("Error reverting commit, please commit changes as they will be overwritten, then try again");
  });
}



// Makes a modal for confirmation pop up instead of actually exiting application for confirmation.
function ExitBeforePush() {
  $("#modalW").modal();
}

function Confirmed() {

}

// makes the onbeforeunload function nothing so the window actually closes; then closes it.
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

  let selectedFile = "";

  Git.Repository.open(repoFullPath)
    .then(function (repo) {

      repo.getStatus().then(function (statuses) {

        statuses.forEach(addModifiedFile);
        if (modifiedFiles.length !== 0) {
          if (document.getElementById("modified-files-message") !== null) {
            let filePanelMessage = document.getElementById("modified-files-message");
            filePanelMessage.parentNode.removeChild(filePanelMessage);
          }
        }

        modifiedFiles.forEach(displayModifiedFile);

        removeNonExistingFiles();
        refreshColor();

        function removeNonExistingFiles() {
          // If files displayed does not exist, remove them
          let filePaths = document.getElementsByClassName('file-path');
          for (let i = 0; i < filePaths.length; i++) {
            if (filePaths[i].parentElement.className !== "file file-deleted") {
              let filePath = path.join(repoFullPath, filePaths[i].innerHTML); //modified for *NIX users
              if (!fs.existsSync(filePath)) {
                filePaths[i].parentElement.remove();
              }
            }
          }
        }

        // Add modified file to array of modified files 'modifiedFiles'
        function addModifiedFile(file) {

          // Check if modified file  is already being displayed
          let filePaths = document.getElementsByClassName('file-path');
          for (let i = 0; i < filePaths.length; i++) {
            if (filePaths[i].innerHTML === file.path()) {
              return;
            }
          }
          let path = file.path();
          let modification = calculateModification(file);
          modifiedFiles.push({
            filePath: path,
            fileModification: modification
          })
        }


        // Find HOW the file has been modified
        function calculateModification(status) {
          if (status.isNew()) {
            return "NEW";
          } else if (status.isModified()) {
            return "MODIFIED";
          } else if (status.isDeleted()) {
            return "DELETED";
          } else if (status.isTypechange()) {
            return "TYPECHANGE";
          } else if (status.isRenamed()) {
            return "RENAMED";
          } else if (status.isIgnored()) {
            return "IGNORED";
          }
        }

        function Confirmation() {
          $("#modalW").modal();
          return 'Hi';
        }

        function unstage(file, fileId) {
          // Get the fileId element and remove it
          document.getElementById(fileId).remove();
          let modFilesMessage = document.getElementById("modified-files-message");
          if (modFilesMessage != null) {
            modFilesMessage.remove();
          }
          // Check if there's no staged files, in case we need to print the "Your staged..."
          stagedFiles = index.remove(file);
          if (document.getElementById("files-staged").children.length == 0) {
            clearStagedFilesList();
            stagedFiles = null;
          }

          displayModifiedFile(file);
          refreshColor();
        }

        document.getElementById("stage-all").onclick = function () {
          let unstagedFileElements = document.getElementById('files-changed').children;
          while (unstagedFileElements.length > 0) {
            let checkbox = unstagedFileElements[0].getElementsByTagName("input")[0];
            try {
              checkbox.click();
            } catch (err) {
              break;
            }
          }
        };

        document.getElementById("unstage-all").onclick = function () {
          let stagedFileElements = document.getElementById('files-staged').children;
          while (stagedFileElements.length > 0) {
            let checkbox = stagedFileElements[0].getElementsByTagName("input")[0];
            try {
              checkbox.click()
            } catch (err) {
              break;
            }
          }
        };

        function displayModifiedFile(file) {
          let filePath = document.createElement("p");
          filePath.className = "file-path";
          filePath.innerHTML = file.filePath;
          let fileElement = document.createElement("div");
          window.onbeforeunload = Confirmation;
          changes = 1;
          // Set how the file has been modified
          if (file.fileModification === "NEW") {
            fileElement.className = "file file-created";
          } else if (file.fileModification === "MODIFIED") {
            fileElement.className = "file file-modified";
          } else if (file.fileModification === "DELETED") {
            fileElement.className = "file file-deleted";
          } else {
            fileElement.className = "file";
          }

          fileElement.appendChild(filePath);
          fileElement.id = file.filePath;

          let checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.className = "checkbox";
          checkbox.onclick = function (event) {
            if (checkbox.checked) {
              stage();
              displayStagedFile(file, fileElement.id);
              refreshColor();
            }
            // Stops a click from propagating to the other layers
            event.stopPropagation();
          }
          fileElement.appendChild(checkbox);

          document.getElementById("files-changed").appendChild(fileElement);


          fileElement.onclick = function () {
            let doc = document.getElementById("diff-panel");
            console.log("width of document: " + doc.style.width);
            let fileName = document.createElement("p");
            fileName.innerHTML = file.filePath
            // Get the filename being edited and displays on top of the window
            if (doc.style.width === '0px' || doc.style.width === '') {
              displayDiffPanel();

              document.getElementById("diff-panel-body")!.innerHTML = "";
              document.getElementById("diff-panel-body").appendChild(fileName);
              if (fileElement.className === "file file-created") {
                // set the selected file
                selectedFile = file.filePath;
                printNewFile(file.filePath);
              } else {

                let diffCols = document.createElement("div");
                diffCols.innerText = "Old" + "\t" + "New" + "\t" + "+/-" + "\t" + "Content";
                document.getElementById("diff-panel-body")!.appendChild(diffCols);
                selectedFile = file.filePath;
                printFileDiff(file.filePath);
              }
            }
            else if (doc.style.width === '40%') {
              document.getElementById("diff-panel-body").innerHTML = "";
              document.getElementById("diff-panel-body").appendChild(fileName);
              if (selectedFile === file.filePath) {
                // clear the selected file when diff panel is hidden
                selectedFile = "";
                hideDiffPanel()
              } else {
                if (fileElement.className === "file file-created") {
                  selectedFile = file.filePath;
                  printNewFile(file.filePath);
                } else {
                  selectedFile = file.filePath;
                  printFileDiff(file.filePath);
                }
              }
            }
            else {
              // clear the selected file when diff panel is hidden
              selectedFile = "";
              hideDiffPanel();
            }
          };
        }

        function displayStagedFile(file, fileId) {
          let filePath = document.createElement("p");
          filePath.className = "file-path";
          filePath.innerHTML = file.filePath;
          let fileElement = document.createElement("div");
          window.onbeforeunload = Confirmation;
          changes = 1;
          // Set how the file has been modified
          if (file.fileModification === "NEW") {
            fileElement.className = "file file-created";
          } else if (file.fileModification === "MODIFIED") {
            fileElement.className = "file file-modified";
          } else if (file.fileModification === "DELETED") {
            fileElement.className = "file file-deleted";
          } else if (file.fileModification === "RENAMED") {
            fileElement.className = "file file-renamed";
          } else {
            fileElement.className = "file";
          }

          fileElement.id = fileId;
          fileElement.appendChild(filePath);

          let checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.className = "checkbox";
          checkbox.checked = true;
          checkbox.onclick = function (event) {
            unstage(file, fileId);
            // Stops a click from propagating to the other layers
            event.stopPropagation();
          }
          fileElement.appendChild(checkbox);

          document.getElementById("files-staged").appendChild(fileElement);
          document.getElementById(fileId).remove();

          if (document.getElementById("files-changed").children.length == 0) {
            clearModifiedFilesList();
          }

          fileElement.onclick = function () {
            let doc = document.getElementById("diff-panel");
            console.log("width of document: " + doc.style.width);
            let fileName = document.createElement("p");
            fileName.innerHTML = file.filePath
            // Get the filename being edited and displays on top of the window
            if (doc.style.width === '0px' || doc.style.width === '') {
              displayDiffPanel();

              document.getElementById("diff-panel-body")!.innerHTML = "";
              document.getElementById("diff-panel-body").appendChild(fileName);
              if (fileElement.className === "file file-created") {
                // set the selected file
                selectedFile = file.filePath;
                printNewFile(file.filePath);
              } else {

                let diffCols = document.createElement("div");
                diffCols.innerText = "Old" + "\t" + "New" + "\t" + "+/-" + "\t" + "Content";
                document.getElementById("diff-panel-body")!.appendChild(diffCols);
                selectedFile = file.filePath;
                printFileDiff(file.filePath);
              }
            }
            else if (doc.style.width === '40%') {
              document.getElementById("diff-panel-body").innerHTML = "";
              document.getElementById("diff-panel-body").appendChild(fileName);
              if (selectedFile === file.filePath) {
                // clear the selected file when diff panel is hidden
                selectedFile = "";
                hideDiffPanel()
              } else {
                if (fileElement.className === "file file-created") {
                  selectedFile = file.filePath;
                  printNewFile(file.filePath);
                } else {
                  selectedFile = file.filePath;
                  printFileDiff(file.filePath);
                }
              }
            }
            else {
              // clear the selected file when diff panel is hidden
              selectedFile = "";
              hideDiffPanel();
            }
          };
        }

        function printNewFile(filePath) {
          let fileLocation = require("path").join(repoFullPath, filePath);
          let lineReader = require("readline").createInterface({
            input: fs.createReadStream(fileLocation)
          });

        let lineNumber = 0;
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
                        let oldFilePath = patch.oldFile().path();
                        let newFilePath = patch.newFile().path();
                        if (newFilePath === filePath) {
                          lines.forEach(function (line) {

                            // Catch the "no newline at end of file" lines created by git
                            if (line.origin() != 62) {

                              // include linenumbers and change type
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
          let element = document.createElement("div");

          if (line.charAt(0) === "+") {
            element.style.backgroundColor = "#84db00";
          } else if (line.charAt(0) === "-") {
            element.style.backgroundColor = "#ff2448";
          }

          // If not a changed line, origin will be a space character, so still need to slice
          line = line.slice(1, line.length);
          element.innerText = line;

          // The spacer is needed to pad out the line to highlight the whole row
          let spacer = document.createElement("spacer");
          spacer.style.width = document.getElementById("diff-panel-body")!.scrollWidth + "px";
          element.appendChild(spacer);

          document.getElementById("diff-panel-body")!.appendChild(element);
        }

        function formatNewFileLine(text) {
          let element = document.createElement("div");
          element.style.backgroundColor = green;
          element.innerHTML = text;

          // The spacer is needed to pad out the line to highlight the whole row
          let spacer = document.createElement("spacer");
          spacer.style.width = document.getElementById("diff-panel-body")!.scrollWidth + "px";
          element.appendChild(spacer);

          document.getElementById("diff-panel-body")!.appendChild(element);
        }
      });
    },
      function (err) {
        console.log("waiting for repo to be initialised");
      });
}

// Find HOW the file has been modified
function calculateModification(status) {
  if (status.isNew()) {
    return "NEW";
  } else if (status.isModified()) {
    return "MODIFIED";
  } else if (status.isDeleted()) {
    return "DELETED";
  } else if (status.isTypechange()) {
    return "TYPECHANGE";
  } else if (status.isRenamed()) {
    return "RENAMED";
  } else if (status.isIgnored()) {
    return "IGNORED";
  }
}

function deleteFile(filePath: string) {
  let newFilePath = filePath.replace(/\\/gi, "/");
  if (fs.existsSync(newFilePath)) {
    fs.unlink(newFilePath, (err) => {
      if (err) {
        alert("An error occurred updating the file" + err.message);
        console.log("git.ts, func deleteFile(), an error occurred updating the file " + err);
        return;
      }
      console.log("File successfully deleted");
    });
  } else {
    alert("This file doesn't exist, cannot delete");
  }
}

function cleanRepo() {
  let fileCount = 0;
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      console.log("Removing untracked files")
      displayModal("Removing untracked files...");
      addCommand("git clean -f");
      repo.getStatus().then(function (arrayStatusFiles) {
        arrayStatusFiles.forEach(deleteUntrackedFiles);

        //Gets NEW/untracked files and deletes them
        function deleteUntrackedFiles(file) {
          let filePath = path.join(repoFullpath, file.path()); //modified for *NIX users
          let modification = calculateModification(file);
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
          } else {
            updateModalText("Nothing to remove.")
          }
          refreshAll(repo);
        });
    },
      function (err) {
        console.log("Waiting for repo to be initialised");
        displayModal("Please select a valid repository");
      });
}

/**
 * This method is called when the sync button is pressed, and causes the fetch-modal
 * to appear on the screen.
 */
function requestLinkModal() {
  $("#fetch-modal").modal();
}

/**
 * This method is called when a valid URL is given via the fetch-modal, and runs the
 * series of git commands which fetch and merge from an upstream repository.
 */
function fetchFromOrigin() {
  console.log("begin fetching");
  let upstreamRepoPath = document.getElementById("origin-path").value;
  if (upstreamRepoPath != null) {
    Git.Repository.open(repoFullPath)
      .then(function (repo) {
        console.log("fetch path valid")
        displayModal("Beginning Synchronisation...");
        addCommand("git remote add upstream " + upstreamRepoPath);
        addCommand("git fetch upstream");
        addCommand("git merge upstrean/master");
        console.log("fetch successful")
        updateModalText("Synchronisation Successful");
        refreshAll(repo);
      },
        function (err) {
          console.log("Waiting for repo to be initialised");
          displayModal("Please select a valid repository");
        });
  } else {
    displayModal("No Path Found.")
  }
}
