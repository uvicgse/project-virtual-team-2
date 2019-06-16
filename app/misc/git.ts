import * as nodegit from "git";
import NodeGit, {Graph, Status} from "nodegit";
import { resolve } from "path";





let opn = require('opn');
let $ = require("jquery");
let Git = require("nodegit");
let fs = require("fs");
let async = require("async");
let readFile = require("fs-sync");
let green = "#84db00";

let path = require('path');
let repo, index, oid, remote, commitMessage, stashMessage;
let filesToAdd = [];
let theirCommit = null;
let modifiedFiles;
let warnbool;
let CommitButNoPush = 0;
let stagedFiles: any;
let vis = require("vis");
let commitHistory = [];
let commitList: [any];
let stashHistory = [""];
let stashIds = [""];
let commitToRevert = 0;
let commitHead = 0;
let commitID = 0;

export class TagItem {
  public tagName: string;
  public commitMsg: string;
  public tagMsg: string;
  public commitSha: string

  constructor(tagName:string, commitMsg:string, tagMsg:string, commitSha:string){
    this.tagName = tagName;
    this.commitMsg = commitMsg;
    this.tagMsg = tagMsg;
    this.commitSha = commitSha;
  }
}


//
// Abstract from issue 40
//
export async function getTags(beginningHash, numCommit){
  let commitList
  let tags;

  let sharedRepo, sharedRefs;
  // get repo and refs in order
  await Git.Repository.open(repoFullPath).then(function(repo){
    sharedRepo = repo;
  })
  await sharedRepo.getReferences(Git.Reference.TYPE.OID).then(function(refs){
    sharedRefs = refs;
  })

  commitList = await getCommitShaFromNode(sharedRepo, beginningHash, numCommit);
  commitList = await getCommitFromShaList(commitList, sharedRepo);
  tags = await aggregateCommits(commitList, sharedRepo, sharedRefs);
  //tags = await processArray(sharedRepo, sharedRefs, beginningHash, numCommit);

  return await new Promise(resolve=> {
    resolve(tags);
  })

}

// Return an array of commit objects from array of commit shas
async function getCommitFromShaList(commitList, repo) {
  return await Promise.all(commitList.map(async (sha) => {
    const commit = await repo.getCommit(sha);
    return commit;
  }));
}

// Returns an array of tagItems based on size of commitList
const aggregateCommits = async (commitList, repo, sharedRefs) => {
  let tag;
  let commit;
  let tItems;
  let found = false;
  let tags;
  // Create array of tags
  tItems = await Promise.all(sharedRefs.map(async (ref) => {
    if (ref.isTag()) {
      tag = await getRefObject(repo, ref);
      commit = await getCommit(repo, ref);
      return new TagItem(tag.name(), commit.message(), tag.message(), commit.sha());
    }
  }));

  // Check to see if commits match with any tags, if so, include tag name and message in TagItem.
  // If unable to match a tag with a commit, return TagItem without tag name and message
  tags = await Promise.all(commitList.map(async (commit) => {
    for (let j=0; j < tItems.length; j++) {
      if (tItems[j]) {
        if (tItems[j].commitSha === commit.sha()) {
          return tItems[j];
        }
      }
    }
    return new TagItem('Enter Tag Name', commit.message(), 'Enter Tag Message', commit.sha());
  }));

  return tags;
}

// get each commit's sha for a graph node
async function getCommitShaFromNode(repo, beginningHash, numCommit) {
  let commitList = [];
  let commitListRet = [];
  return new Promise(function(resolve){
    repo.getReferences(Git.Reference.TYPE.LISTALL)
    .then(function (refs) {
    // Check to see that reference is not to tag or remote
      for (let i =0; i<refs.length; i++) {
        if (!refs[i].isTag() && !refs[i].isRemote()) {
          repo.getReferenceCommit(refs[i])
          // Find all commits from branch
          .then(function (commit) {
            let history = commit.history(Git.Revwalk.SORT.Time);
            history.on("end", function (commits) {

              // Store commit hash for every commit in branch
              for (let i = 0; i < commits.length; i++) {
                if (commitList.indexOf(commits[i].toString()) < 0) {
                  commitList.push(commits[i].toString());
                }
              }
              // Prune early commits that do not belong to node
              if (commitList.indexOf(beginningHash) >= 0) {
                let stop = commitList.length - commitList.indexOf(beginningHash) -1;
                commitList.splice(commitList.indexOf(beginningHash)+1, stop);
              }


              // Prune later commits that do not belong to node. If no numCommit exist, prune list of commits down to 1
              commitList.reverse();
              if (numCommit > 0) {
                let deleteNum = commitList.length - numCommit;
                if (deleteNum > 0) {
                  commitList.splice(numCommit, deleteNum);
                }
              }

              resolve(commitList);
            });

            history.start();
          }).catch ((err) => {
            console.log(err);
          });
        }
      }

    })
    .catch((err) => {
      console.log(err);
    });
  });
}

// get commit from tag reference
async function getCommit(repo, ref) {
  let c = await ref.peel(Git.Object.TYPE.COMMIT);
  let commit = await repo.getCommit(c);
  return commit;
}

// Get tag object based on tag name
async function getRefObject(repo, ref){
  let oid = await Git.Reference.nameToId(repo, ref.name())
  let tag = await Git.Tag.lookup(repo, oid);
  return tag;
}


/*
  - Gathers the current stashes kept in refs/stash and places their names in an array for git stash list
  - Function entered onclick from the Stash button on the NavBar
  - Updates the stash modal with the current stash history list
  - Contructs a DOM elements that gives users stash options for each stash
*/
function refreshStashHistory(){
    stashHistory = [""];
    stashIds = [""];
    let stashId;
    console.log("initializing stash history...");
    if(readFile.exists(repoFullPath + "/.git/logs/refs/stash")){
      let txt = readFile.read(repoFullPath + "/.git/logs/refs/stash").split("\n");
      txt.pop();
      txt.forEach(function(line) {
        stashId = line.split(" ")[1];
        line = line.split(" ").slice(6, line.length).join(" ");
        console.log("Adding " + stashId +": "+ line + " to Stash history");
        stashHistory.unshift(line);
        stashIds.unshift(stashId);

      });
    }
    stashHistory.pop();
    let stashListHTML = '';

    // For each stash create a unique element with unique pop, drop, and apply functionality.
    stashHistory.forEach((stash, i) => {
      stashListHTML +=
        '<div id="stash-item">' +
          '<div id="stash-id">' +
              'Stash{' + i + '}: ' + stash +
          '</div>' +
          '<div class="stash-actions">' +
              '<ul class="dropbtn icons" onclick="showDropdown(' + i + ')">' +
                  '<li></li>' +
                  '<li></li>' +
                  '<li></li>' +
              '</ul>' +

              '<div id="stash-item-' + i + '-dropdown" class="dropdown-content">' +
                  '<a onclick="popStash(' + i + ')">Pop</a>' +
                  '<a onclick="applyStash(' + i + ')">Apply</a>' +
                  '<a onclick="dropStash(' + i + ')">Drop</a>' +
                  '<a onclick="showStash(' + i + ')">Show</a>' +
                  '<a onclick="openBranchModal('+i+')">Branch<\a>' +
              '</div>' +
          '</div>' +
        '</div>';
    });
    document.getElementById('stash-list').innerHTML = stashListHTML;
  }

function protoShowStash(){
  displayModal("test.txt | 5 ++++-\n1 file changed, 4 insertions(+), 1 deletions(-)");
}
/* Issue 84: further implement stashing
    - git stash show stash{index} shows the deltas of the files
    - function entered onclick from stash dropdown menu
*/
async function showStash(index){

  let repository;
  let stashOid = stashIds[index];
  let diff;
  await Git.Repository.open(repoFullPath).then(function(repoResult){
    repository = repoResult;
    console.log("found a repository");
  })
  .then(function (){
    return repository.getCommit(stashOid);
  })
  .then(function(stash){
    console.log("found id of stash");
    return stash.getDiff();
  })
  .then(function(diffArray){
    console.log(diffArray);
    diffArray.forEach((diff, i) => {
      //console.log(diff.getStats());
      //console.log(diff.getDelta(0));
    });
    protoShowStash();
  }, function (err) {
    console.log("git.ts, func showStash(): getCommit, " + err);
  });

}

function showMoveModal(){
  listDirectoryItems(repoFullPath);
  $('#move-modal').modal('show');
}

function getDirectories(directoryPath) {
  return fs.readdirSync(directoryPath).filter(function (file) {
    return fs.statSync(path.join(directoryPath,file)).isDirectory() || fs.statSync(path.join(directoryPath,file)).isFile();
  });
}

function listDirectoryItems(directoryPath) {
	let directories = getDirectories(directoryPath);
	console.log("Getting repo directory...");
	console.log("Displaying the files and directories at: " + directoryPath);
	let repoDirectoryHTML = '';

	// For each stash create a unique element with unique pop, drop, and apply functionality.
	directories.forEach((directoryItem, i) => {
		let parsedPath = (path.join(directoryPath,directories[i])).replace(/\\/g, '\\\\');
		repoDirectoryHTML +=
			'<div id="directory-item-' + i + '" class="directory-item" ondrop="drop(event,\'' + parsedPath + '\')" draggable="true" ondragstart="drag(event)" ondragover="allowDrop(event)" ondblclick="listDirectoryItems(\'' + parsedPath + '\')">' +
			  '<input id="directory-id-' + i +'" style="outline:none; background-color:#efefef; border:none;" type="text" value="' + directoryItem + '" onkeypress="renameDirectoryItem(event,\'' + parsedPath + '\',' + i + ')"></input>' +
			'</div>';
	});
	document.getElementById('move-list').innerHTML = repoDirectoryHTML;

  // Get last directory name in path
  var newPath = "";
  var prevPath = "";
  let breakStringFrom;

  // Used to get second last slash
  let slashPosArr = [];
  for (var i = 0; i < directoryPath.length; i++) {
    if (directoryPath[i] == "/" || directoryPath[i] == "\\") {
      slashPosArr.push(i);
      breakStringFrom = i;
    }
  }

  newPath = directoryPath.slice(breakStringFrom, directoryPath.length);
  prevPath = directoryPath.slice(0, breakStringFrom);

  // If the previous path is equal to a path outside of the repo directory, don't
  // display the previous path button (...)
  if(prevPath == repoFullPath.slice(0,slashPosArr[slashPosArr.length - 2]) || directoryPath == repoFullPath){
    document.getElementById('move-current-directory').innerHTML = newPath;
  } else {
    let parsedPrevPath = (prevPath).replace(/\\/g, '\\\\');
    document.getElementById('move-current-directory').innerHTML = 
    '<div>' + 
      '<a id="move-last-directory" ondragover="allowDrop(event)" ondrop="dropInPreviousDir(event,\'' + directoryPath.replace(/\\/g, '\\\\') + '\')" onclick="listDirectoryItems(\'' + parsedPrevPath + '\')">...</a>' + newPath + 
    '</div>';
  }
}

// Used to handle file or directory name changes
function renameDirectoryItem(event,directoryPath,pos){
  // TODO: Figure out how to disable new line but not enter
  // Get last directory name in path
  var prevPath = "";
  let breakStringFrom;

  var isFolder = false;
  var isFile = false;

  if(fs.statSync(directoryPath).isDirectory()){
    isFolder = true;
  } else if (fs.statSync(directoryPath).isFile()) {
    isFile = true;
  }

  // Used to get second last slash
  for (var i = 0; i < directoryPath.length; i++) {
    if (directoryPath[i] == "/" || directoryPath[i] == "\\") {
      breakStringFrom = i;
    }
  }

  prevPath = directoryPath.slice(0, breakStringFrom);
  var id = "directory-id-" + pos;
  var element = document.getElementById(id);
  var newName = element.value;
  
  if (event.keyCode == 13) {
    // Check to see if the original directory item was a file or folder.
    if(fs.statSync(directoryPath).isDirectory()){
      // Check to see if the new name is a valid folder name.
      if(isValidFolderName(newName)){
        hideDirNameError();
        fs.rename(directoryPath, path.join(prevPath, newName), function(err) {
            if (err) console.log('Renaming Error: ' + err);
        });
      } else {
        showDirNameError("Name Error: " + newName + " is not a valid folder name.\nNo special characters allowed. (< > : \" / \\ | ? * & % ^)");
      }
    } else if (fs.statSync(directoryPath).isFile()) {
      // Check to see if the new name is a valid file name.
      if(isValidFileName(newName)){
        hideDirNameError();
        fs.rename(directoryPath, path.join(prevPath, newName), function(err) {
            if (err) console.log('Renaming Error: ' + err);
        });
      } else {
        showDirNameError("Name Error: " + newName + " is not a valid file name.\n\nPlease make sure you have a valid extension.\nNo special characters allowed. (< > : \" / \\ | ? * & % ^)");
      }
    }
    // Wait for files to appear in unstaged
    setTimeout(function(){stageFile(newName)},1200);
  }
}

function showDirNameError(message){
  let dirNameErrorElement = document.getElementById("dir-item-name-error");
  dirNameErrorElement.innerHTML = message;
  dirNameErrorElement.style.display = "inline-flex";
}

function hideDirNameError(){
  let dirNameErrorElement = document.getElementById("dir-item-name-error");
  dirNameErrorElement.style.display = "none";
}

function isValidFileName(fileName){
  return /^[a-z0-9_.@()-]+\.[^.]+$/i.test(fileName);
}

function isValidFolderName(folderName){
  return /^[a-zA-Z].*/.test(folderName);
}

function stageFile(filename){
  let unstagedFileElements = document.getElementById('files-changed').children;
  for (var i = 0; i < unstagedFileElements.length; i++) {
    if(unstagedFileElements[i].id == filename){
      let checkbox = unstagedFileElements[i].getElementsByTagName("input")[0];
      try {
        checkbox.click();
      } catch (err) {
        break;
      }
    }
  }
}

function allowDrop(event) {
  event.preventDefault();
}

function drag(event) {
  event.dataTransfer.setData("directory-item-id", event.target.id);
  console.log("Dragging: " + event.target.id);
}

function drop(event, directoryPath) {
  event.preventDefault();
  var data = event.dataTransfer.getData("directory-item-id");
  var directoryItemName = document.getElementById(data).childNodes[0].value;

  // Get last directory name in path
  var newDropItemPath = "";
  var dropItemPath = "";
  let breakStringFrom;

  for (var i = 0; i < directoryPath.length; i++) {
    if (directoryPath[i] == "/" || directoryPath[i] == "\\") {
      breakStringFrom = i;
    }
  }

  var prevDirectoryPath = directoryPath.slice(0, breakStringFrom);
  newDropItemPath = path.join(prevDirectoryPath,event.target.value);
  dropItemPath = path.join(prevDirectoryPath,directoryItemName);

  console.log("Dropped: " + data + " at " + event.target.id);
  fs.rename(dropItemPath, path.join(newDropItemPath, directoryItemName), function(err) {
      if (err) console.log('Renaming Error: ' + err);
      listDirectoryItems(prevDirectoryPath);
  });
  // Wait for files to appear in unstaged
  setTimeout(function(){stageFile(directoryItemName)},1750);
}

function dropInPreviousDir(event, directoryPath) {
  event.preventDefault();
  var data = event.dataTransfer.getData("directory-item-id");
  var directoryItemName = document.getElementById(data).childNodes[0].value;

  // Get last directory name in path
  let breakStringFrom;

  for (var i = 0; i < directoryPath.length; i++) {
    if (directoryPath[i] == "/" || directoryPath[i] == "\\") {
      breakStringFrom = i;
    }
  }

  var prevDirectoryPath = directoryPath.slice(0, breakStringFrom);

  console.log("Dropped: " + data + " at " + event.target.id);
  fs.rename(path.join(directoryPath, directoryItemName), path.join(prevDirectoryPath, directoryItemName), function(err) {
      if (err){
        console.log('Renaming Error: ' + err);
      }
      listDirectoryItems(directoryPath);

  });
  // Wait for files to appear in unstaged
  setTimeout(function(){stageFile(directoryItemName)},1750);
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
  let tagMessage = document.getElementById('tag-message-input').value;
  let tagName = document.getElementById('tag-name-input').value;

  if (commitMessage == null || commitMessage == "") {
    window.alert("Cannot commit without a commit message. Please add a commit message before committing");
    return;
  }
  updateModalText("Committing changes...");
  // A new tag must include a tag name and tag message or tag cannot be created
  if (tagName == "" && tagMessage != "") {
    window.alert("Cannot create tag without a tag name. Please add a tag name before committing");
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

    .then(async function (parent) {
      console.log("Verifying account");
      let sign;

      sign = repository.defaultSignature();

      commitMessage = document.getElementById('commit-message-input').value;
      console.log("Signature to be put on commit: " + sign.toString());

      if (readFile.exists(repoFullPath + "/.git/MERGE_HEAD")) {
        let tid = readFile.read(repoFullPath + "/.git/MERGE_HEAD", null);
        console.log("head commit on remote: " + tid);
        console.log("head commit on local repository: " + parent.id.toString());
        return await repository.createCommit("HEAD", sign, sign, commitMessage, oid, [parent.id().toString(), tid.trim()]);
      } else {
        console.log('no other commits');
        return await repository.createCommit("HEAD", sign, sign, commitMessage, oid, [parent]);
      }
    })
    .then(async function (oid) {
      theirCommit = null;
      console.log("Committing");
      changes = 0;
      CommitButNoPush = 1;
      console.log("Commit successful: " + oid.tostrS());
      stagedFiles = null;

      console.log(oid.tostrS());
      return await repository.createTag(oid.tostrS(), tagName, tagMessage);
    })
    // will update user interface after new commit and tag has been handled
    .then(function (tag: any) {
      console.log(oid.tostrS());
      hideDiffPanel();
      clearStagedFilesList();
      clearCommitMessage();
      for (let i = 0; i < filesToAdd.length; i++) {
        addCommand("git add " + filesToAdd[i]);
      }
      addCommand('git commit -m "' + commitMessage + '"');

      // Check that tag was created and whether tag message exists or not
      if (tag && tagMessage != '') {
        addCommand('git tag -a '+ tagName + ' -m ' + '"' + tagMessage + '"');
      } else if (tag && tagMessage == '') {
        addCommand('git tag -a '+ tagName);
      } else{
        console.log('tag failed');
      }
      refreshAll(repository);
    }, function (err) {
      console.log("git.ts, func addAndCommit(), could not commit, " + err);
      // Added error thrown for if files not selected
      if (err.message == "No files selected to commit.") {
        updateModalText(err.message);
      } else {
        updateModalText("Unexpected Error: " + err.message + " Please restart and try again.");
      }
    });
}

/* Issue 35: Add stashing functionality
   Mostly copied from addAndCommit
    - Function entered from Stash button
    - stages files and stashes them
*/
function addAndStash(options) {

  if(options == null) options = 0;

  var command = "git stash "; //default command for console
  var stashName = ""; //default stash name for stashHistory

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
        //If no files checked, then throw error to stop empty commits unless untracked option used
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

    .then(async function (parent) {
      console.log("Verifying account");
      let sign;

      sign = repository.defaultSignature();

      console.log("Signature to be put on stash: " + sign.toString());

      let branch = document.getElementById("branch-name").innerText;
      console.log("Current branch: " + branch);

      stashMessage = document.getElementById("stash-message-input").value;

      /* Checks if there is a stashMessage. If not: imitates the WIP message with the commit-head and message */
      if(stashMessage == null || stashMessage == "") {

        var comMessage = "";

        await Git.Commit.lookup(repository, parent)
        .then(function(commit){
          comMessage = commit.message();
        }, (rej) => {
          console.log("Lookup commit message failed: " + rej);
        });

        stashMessage = oid.tostrS().substring(0,8) + " " + comMessage;
        stashName = "WIP ";
      } else {
        command += "push -m \"" + stashMessage + "\" ";
      }
      stashName += "On " + branch + ": " + stashMessage;

      console.log("Stashing: " + stashName );

      //checks if current status of the branch is merging
      if (readFile.exists(repoFullPath + "/.git/MERGE_HEAD")) {
        let tid = readFile.read(repoFullPath + "/.git/MERGE_HEAD", null);
        console.log("head commit on remote: " + tid);
        console.log("head commit on local repository: " + parent.id.toString());

        //perform git stash
        return await Git.Stash.save(repository, sign, stashMessage, options).then( (res) => {
          console.log("Stash resolved: " + res);
        }, (rej) => {
          console.log("Stash rejected: " + rej);
        });

      } else {
        console.log('no other commits');

        //perform git stash
        return await Git.Stash.save(repository, sign, stashMessage, options).then( (res) => {
          console.log("Stash resolved: " + res);
        }, (rej) => {
          console.log("Stash rejected: " + rej);
        });

      }
    })
    .then(function (stashOID) { //Cleanup file panel, update console with commands, refresh working tree
      theirCommit = null;
      changes = 0;

      stagedFiles = null;

      hideDiffPanel();
      clearStagedFilesList();
      clearCommitMessage();
      //if (options == 2) clearModifiedFilesList(); //reset unstaged files panel

      for (let i = 0; i < filesToAdd.length; i++) {
        addCommand("git add " + filesToAdd[i]);
      }
      /* options
         Stash.FLAGS.DEFAULT             0
         Stash.FLAGS.KEEP_INDEX          1
         Stash.FLAGS.INCLUDE_UNTRACKED   2
         Stash.FLAGS.INCLUDE_IGNORED     4
      */

      switch(options){
        case 0:
          addCommand(command);
          break;
        case 1:
          addCommand(command + ' --keep-index');
          break;
        case 2:
          addCommand(command + ' --untracked');
          break;
      }

     updateModalText("Stash successful!");
     stashHistory.unshift(stashName);
     stashIds.unshift(stashOID);
     refreshStashHistory();
     refreshAll(repository);

    }, function (err) { //catch any known or unknown errors that may have occured since beginning of function
      console.log("git.ts, func addAndStash(), could not stash, " + err);
      // Added error thrown for if files not selected
      if (err.message == "No files selected to stash.") {
        updateModalText(err.message);
      } else {
        updateModalText("Unexpected Error: " + err.message + " Please restart and try again.");
      }
    });
}

/* Issue 35: Add popping functionality
   Skeleton copied from pullFromRemote()
    - Function entered from onclick of the given stash in Stashing options window
    - pops stash from given index and merges into working directory. Fails if conflicts found.
    - If the file is tracked by the working tree, Merge will return conflict error but safely merge.
*/
function popStash(index) {
  if (index == null) index = 0; //default option pops most recent stash

  let repository;
  let branch = document.getElementById("branch-name").innerText;

  if (modifiedFiles.length > 0) {
    updateModalText("Please commit before popping stash!");
  }

   Git.Repository.open(repoFullPath)
    .then( async function (repo) {
      repository = repo;
      console.log("Popping stash at index " + index);
      addCommand("git stash pop stash@{" + index + "}");
      var stashName = stashHistory[index];
      updateModalText("Popping stash: "+ stashName);

      //perform git stash pop
      let ret = await Git.Stash.pop(repository, index, 0)
      .then((res) => {
        console.log("Pop resolved: " + res);
        return res;
      }, (rej) => {
        console.log("Pop rejected: " + rej);
        throw new Error("Conflicts found while merging. Solve conflicts before continuing.");
        return rej;
      });

      //Possible error codes returned from pop. Use try/catch if entered.
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
     .then(function (stashOid) {
      console.log("Looking up stash with id " + stashOid + " in all repositories");
      return Git.AnnotatedCommit.lookup(repository, stashOid);
    })
    .then(async function (annotated) { //try to merge popped stash with current working tree
      let ret2 = 0;
      if(annotated != null){
        console.log("merging " + annotated.id() + " with local safely");
        ret2 = await Git.Merge.merge(repository, annotated, {fileFlags: Git.Merge.FILE_FLAG.FILE_IGNORE_WHITESPACE_CHANGE,
         flags: Git.Merge.FLAG.FAIL_ON_CONFLICT}, {
          checkoutStrategy: Git.Checkout.STRATEGY.SAFE,
        });
       console.log("Merge returned: " + ret2);
      }
      theirCommit = annotated;
      return ret2;
    })
    .then(function (mergeCode) { //display result of merge and update/refresh app
      if(mergeCode == -13){
        window.alert("Conflicts may exist in the working tree! If safe to merge, stash will be applied.\nOtherwise, please stage and commit changes or\nresolve conflicts before you pop again!");
        updateModalText("Merged with possible conflicts. Please consider resolving conflicts in modified files or dropping stash.");
      } else {
        updateModalText("Success! No conflicts found with branch " + branch + ", and your repo is up to date now!");
      }
      stashHistory.splice(index, 1);
      stashIds.splice(index, 1);
      refreshStashHistory();
      refreshAll(repository);
     }, function(err) { //catch all errors thrown since beginning of function
         console.log("git.ts, func popStash(): update, could not pop stash, " + err);
         updateModalText("Unexpected Error: " + err.message + "Please restart and try again.");
     });

}

/* Issue 35: Add applying functionality
   copied from popStash()
    - Function entered from onclick of the given stash in Stashing options window
    - applies stash from given index and merges into working directory.
*/
function applyStash(index) {
  if (index == null) index = 0;

  let repository;
  let branch = document.getElementById("branch-name").innerText;

  if (modifiedFiles.length > 0) {
    updateModalText("Please commit before applying stash!");
  }

  Git.Repository.open(repoFullPath)
    .then(async function (repo) {
      repository = repo;
      console.log("applying stash at index " + index);
      addCommand("git stash apply stash@{" + index +"}");
      var stashName = stashHistory[index];
      updateModalText("Applying stash: "+ stashName);

      //perform git stash apply
      let ret = await Git.Stash.apply(repository, index, 0)
        .then( (res) => {
          console.log("Apply resolved: " + res);
          return res;
        }, (rej) => {
          console.log("Apply rejected: " + rej);
          throw new Error("Conflicts found while merging. Solve conflicts before continuing.");
          return rej;
        });

      //Possible error codes returned from apply. Use try/catch if entered
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
     .then(function (stashOid) {
      console.log("Looking up stash with id " + stashOid + " in all repositories");
      return Git.AnnotatedCommit.lookup(repository, stashOid);
    })
    .then(async function (annotated) { //try to merge applied stash and working tree
      let ret2 = 0;
      if(annotated != null){
        console.log("merging " + annotated.id() + " with local safely");
        ret2 = await Git.Merge.merge(repository, annotated, {fileFlags: Git.Merge.FILE_FLAG.FILE_IGNORE_WHITESPACE_CHANGE,
         flags: Git.Merge.FLAG.FAIL_ON_CONFLICT}, {
          checkoutStrategy: Git.Checkout.STRATEGY.SAFE,
        });
       console.log("Merge returned: " + ret2);
      }
      theirCommit = annotated;
      return ret2;
    })
    .then(function (mergeCode) { //display result of merge and refresh app
      if(mergeCode == -13){
        window.alert("Conflicts may exist in the working tree! If safe to merge, stash will be applied.\nOtherwise, please stage and commit changes or\nresolve conflicts before you pop again!");
        updateModalText("Merged with possible conflicts. Please consider resolving conflicts in modified files or dropping stash.");
      } else {
        updateModalText("Success! No conflicts found with branch " + branch + ", and your repo is up to date now!");
      }
      refreshStashHistory();
      refreshAll(repository);
     }, function(err) { //catch all errors thrown since beginning of function
         console.log("git.ts, func applyStash(): update, could not apply stash, " + err);
         updateModalText(err.message);
     });

}
/* Issue 35/84: Add dropping stash functionality
   copied from popStash()
    - Function entered from onclick of the given stash in Stashing options window
    - drops stash from given index.
*/
async function dropStash(index) {
  if (index == null) index = 0;

  let repository;
  let branch = document.getElementById("branch-name").innerText;

  await Git.Repository.open(repoFullPath)
    .then( async function (repo) {
      repository = repo;
      console.log("Dropping stash at index " + index);
      addCommand("git stash drop stash@{" + index +"}");
      var stashName = stashHistory[index];
      updateModalText("Dropping stash: "+ stashName);

        //perform git stash drop
        let ret = await Git.Stash.drop(repository, index)
          .then( (res) => {
            console.log("Drop resolved: " + res);
            //should return error code but isn't
              updateModalText("Success! Stash at index " + index + " dropped from list.");
            return res;
          }, (err) => {
            console.log("Drop rejected: " + err);
            throw new Error(err.message);
          }
        );
        stashHistory.splice(index, 1);
        stashIds.splice(index, 1);
        refreshStashHistory();
        refreshAll(repository);
    }, function(err) {
        console.log("git.ts, func dropStash(), could not drop stash, " + err);
        updateModalText("Unexpected Error: " + err.message + "Please restart and try again.");
      }
    );
}

/* Issue 84: further implement stashing
  Function copied from createBranch()
    - git stash branch <branchname> <stash> will create and checkout a new branch
      starting from the commit where the stash was pushed and then pop the stash onto the new branch
    - Onclick of _branch_ in the stash dropdown, the branch modal will open up to allow the user to create the branch
    - currently, only the most recent stash can be used to checkout a new branch
*/
function branchStash(index) {
  if (index == null) index = 0;

  let branchName = document.getElementById("branch-name-input").value;

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

  //check if local changes need to be stashed
  else if (modifiedFiles > 0){
    document.getElementById("branchErrorText").innerText = "Warning: Stash local changes before checking out a new branch. ";

  }

  // TODO: check for existing branch
  // Check for existing branch
  // else if ( <existing branch> ) {}

  else {
    let currentRepository;
    console.log(branchName + " is being created");
    Git.Repository.open(repoFullPath)
      .then(function (repo) {
        // Create a new branch on commit of stash
        console.log("found a repository");
        currentRepository = repo;
        addCommand("git stash branch " + branchName + " stash{" + index + "}");
        return repo.getCommit(stashIds[index])
          .then(function (stash) {
            console.log("Branching from stash: " + stash);
            return stash.parent(0)
              .then(function(commit){
                console.log("Parent commit: "+ commit);
                return repo.createBranch(
                branchName,
                commit,
                0,
                repo.defaultSignature(),
                "Created new-branch on "+ commit.id());
              });
          });
      }, function (err) {
            console.log("git.ts, func branchStash(), error occurred while trying to create a new branch " + err);
      })
      .done(function () {
        $('#branch-modal').modal('hide');
        //refreshAll(currentRepository);
        checkoutLocalBranch(branchName);
        popStash(index);
      });
    clearBranchErrorText();
  }
}

// Delete tag based on tag name and display corresponding git command to footer in VisualGit
function deleteTag(tagName) {
  let repository;
  console.log(repoFullPath);
  let name = tagName.split(path.sep);
  name = name[name.length-1];
  console.log(name);
  Git.Repository.open(repoFullPath)
    .then(function (repoResult) {
      repository = repoResult;
      repository.deleteTagByName(name)
        .then(function() {
          console.log(`${name} deleted`);
          addCommand('git tag -d '+ name);
          refreshAll(repository);
        })
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));

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
  let singleReference;
  let name;
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
          // Remove tag references or because getReferenceCommit does not recognize tag references
          if (!refs[count].isTag() && !refs[count].isRemote()) {
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
            }).catch ((err) => {
              console.log(err);
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
      updateModalText("Pulling new changes from the remote repository");

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
        if (aheadBehind.behind !== 0) {
          window.alert("your branch is behind remote by " + aheadBehind.behind);
          return;

        } else if (aheadBehind.ahead === 0) {
          window.alert("Your branch is already up to date");
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
              }, function(e){
                console.log(Error(e));
              }).then(function () {
                CommitButNoPush = 0;
                window.onbeforeunload = Confirmed;
                console.log("Push successful");
                updateModalText("Push successful");
                refreshAll(repo);
              });
            }, function(e){
              console.log(Error(e));
            });
          });
        }
      });
    }
  });
}

function commitModal() {
  // TODO: implement commit modal
  //updateModalText("Commit inside a modal yet to be implemented");
  addAndCommit();
}

function openBranchModal(stashIndex) {
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

  } else if (modifiedFiles > 0){
    document.getElementById("branchErrorText").innerText = "Warning: Stash local changes before checking out a new branch. ";

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
      updateModalText("Removing untracked files...");
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
        updateModalText("Please select a valid repository");
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
        updateModalText("Beginning Synchronisation...");
        addCommand("git remote add upstream " + upstreamRepoPath);
        addCommand("git fetch upstream");
        addCommand("git merge upstrean/master");
        console.log("fetch successful")
        updateModalText("Synchronisation Successful");
        refreshAll(repo);
      },
        function (err) {
          console.log("Waiting for repo to be initialised");
          updateModalText("Please select a valid repository");
        });
  } else {
    updateModalText("No Path Found.")
  }
}