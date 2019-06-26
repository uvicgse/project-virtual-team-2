import { _ } from "core-js";

let Git = require("nodegit");
let repoFullPath;
let repoLocalPath;
let bname = {};
let branchCommit = [];
let remoteName = {};
let localBranches = [];
let readFile = require("fs-sync");
let checkFile = require("fs");
let repoCurrentBranch = "master";
let modal;
let span;
let contributors: [any] = [0];
let previousOpen;
let repoName: string = "";
let fs = require('fs').promises;
let jsonfile = require('jsonfile');
let path = require('path');
let settingsPath = path.join(__dirname, ".settings");
const recentFiles = path.join(settingsPath, 'recent_repos.json');
let quickBranchTagReload: any = [];


// Function clones repository from HTML element repoSave using downloadFunc()
function downloadRepository() {
  let fullLocalPath;
  // Full path is determined by either handwritten directory or selected by file browser
  if (document.getElementById("repoSave").value != null || document.getElementById("repoSave").value != "") {
    // if the user entered a file location to save to
    // set that as the path
    fullLocalPath = document.getElementById("repoSave").value;

  } else {

    fullLocalPath = document.getElementById("dirPickerSaveNew").files[0].path;
    console.log(repoFullPath)

  }

  let cloneURL = document.getElementById("repoClone").value;

  if (!cloneURL || cloneURL.length === 0) {
    updateModalText("Clone Failed - Empty URL Given");
    switchToAddRepositoryPanel();
  } else {
    downloadFunc(cloneURL, fullLocalPath);
  }
}

// On app load, create .settings directory if does not exist
function createSettingsDir() {
  try {
    fs.mkdirSync(settingsPath)
  } catch (err) {
    if (err.code != 'EEXIST') throw err
  }
}
// If record of recently opened repos exist, return list of recently opened repos
function loadMostRecentRepos() {
  try {
    let fd = fs.readFileSync(recentFiles, 'utf8');
    let recentRepos = JSON.parse(fd);
    return recentRepos.last5Repos.map(function (item) { return item.filePath });
  } catch {
    return [];
  }
}

// Append opened repo path into recent_repos.json. If recent_repos.json does not exist, create it before appending repo path.
// Note: only the 5 most recently opened and distinct repos will be stored.
function saveMostRecentRepos(fullLocalPath) {

  let now = new Date();
  let date = JSON.stringify(now);
  let recentRepos;
  let index = -1;

  try {
    let fd = fs.readFileSync(recentFiles, 'utf8');
    recentRepos = JSON.parse(fd);
  } catch (e) {
    console.log(e);
  }

  let obj = {
    filePath: fullLocalPath,
    date: date
  }
  // Find if current repo is among 5 most recently opened repos. If true, then replace current repo's previous timestamp with
  // current timestamp and push current repo to end of array.
  if (recentRepos === undefined) {
    recentRepos = {
      last5Repos: [obj]
    }
  } else {
    index = recentRepos.last5Repos.map(function (item) { return item.filePath }).indexOf(fullLocalPath);

    if (index >= 0) {
      recentRepos.last5Repos.splice(index, 1);
      recentRepos.last5Repos.push(obj);
    } else {
      if (recentRepos.last5Repos.length > 4) {
        recentRepos.last5Repos.splice(0, 1);
      }
      recentRepos.last5Repos.push(obj);

    }
  }

  try {
    jsonfile.writeFileSync(recentFiles, recentRepos, { flag: 'w' });
  } catch (err) {
    console.log(err);
  }
}

// Function clones repository from cloneURL.
function downloadFunc(cloneURL, fullLocalPath) {
  console.log("Path of cloning repo: " + fullLocalPath);

  let progressDiv = document.getElementById("cloneProgressDiv");
  progressDiv.style.visibility = "visible";

  let options = {};

  options = {
    fetchOpts: {
      callbacks: {
        certificateCheck: function () {
          return 1;
        },
        credentials: function () {
          return createCredentials();
        },
        transferProgress: function (data) {
          let bytesRatio = data.receivedObjects() / data.totalObjects();
          updateProgressBar(bytesRatio);
        }
      }
    }
  };

  console.log("cloning into " + fullLocalPath);
  let repository = Git.Clone.clone(cloneURL, fullLocalPath, options)
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
    },
      function (err) {
        updateModalText("Clone Failed - " + err);
        console.log("repo.ts, line 64, failed to clone repo: " + err); // TODO show error on screen
        switchToAddRepositoryPanel();
      });
}

function updateProgressBar(ratio) {
  let progressBar = document.getElementById("cloneProgressBar");
  let percentage = Math.floor(ratio * 100) + "%";
  progressBar.style.width = percentage;
  progressBar.innerHTML = percentage;
}

// Function loads repository based on HTML element repoOpen. After repository has loaded, the function refreshes
// VisualGit's GUI
function openRepository() {
  console.log("Open Repository")
  if (document.getElementById("dirPickerOpenLocal").value === previousOpen && previousOpen != undefined) {
    return;
  }

  hidePRPanel();

  // Full path is determined by either handwritten directory or selected by file browser
  if (document.getElementById("repoOpen").value == null || document.getElementById("repoOpen").value == "") {
    let localPath = document.getElementById("dirPickerOpenLocal").files[0].webkitRelativePath;
    let fullLocalPath = document.getElementById("dirPickerOpenLocal").files[0].path;
    previousOpen = document.getElementById("dirPickerOpenLocal").value;
    document.getElementById("repoOpen").value = fullLocalPath;
    document.getElementById("repoOpen").text = fullLocalPath;
  } else {
    let localPath = document.getElementById("repoOpen").value;
    let fullLocalPath;
    if (checkFile.existsSync(localPath)) {
      fullLocalPath = localPath;
    } else {
      fullLocalPath = require("path").join(__dirname, localPath);
    }
  }

  console.log("Trying to open repository at " + fullLocalPath);
  displayModal("Opening Local Repository...");

  Git.Repository.open(fullLocalPath).then(function (repository) {
    repoFullPath = fullLocalPath;
    repoLocalPath = localPath;
    if (readFile.exists(repoFullPath + "/.git/MERGE_HEAD")) {
      let tid = readFile.read(repoFullPath + "/.git/MERGE_HEAD", null);
      console.log("current HEAD commit: " + tid);
    }
    //Reads the git config file and extracts info about the remote "origin" branch on GitHub
    if (readFile.exists(repoFullPath + "/.git/config")) {
      let gitConfigFileText = readFile.read(repoFullPath + "/.git/config", null);
      let searchString = "[remote \"origin\"]";

      gitConfigFileText = gitConfigFileText.substr(gitConfigFileText.indexOf(searchString) + searchString.length, gitConfigFileText.length);
      gitConfigFileText = gitConfigFileText.substr(0, gitConfigFileText.indexOf(".git"));

      let gitConfigFileSubstrings = gitConfigFileText.split('/');

      //If the remote branch was set up using ssh, separate the elements between colons"
      if (gitConfigFileSubstrings[0].indexOf("@") != -1) {
        gitConfigFileSubstrings[0] = gitConfigFileSubstrings[0].substring(gitConfigFileSubstrings[0].indexOf(":") + 1);
      }

        let repoOwner = gitConfigFileSubstrings[gitConfigFileSubstrings.length - 2]
        repoName = gitConfigFileSubstrings[gitConfigFileSubstrings.length - 1]
        //If the user is signed in, an API call can performed
        if (!continuedWithoutSignIn) {
          //Call to get all usernames
          $.ajax({
            url: "https://api.github.com/repos/" + repoOwner + "/" + repoName + "/contributors",
            type: "GET",
            beforeSend: function (xhr) {
              xhr.setRequestHeader('Authorization','token' + getOauthToken());
            },
            headers: {
              'Accept': 'application/vnd.github.v3+json'
            },
            success: function (response) {

              for (var i = 0; i < response.length; i++) {
                //Store list of logins here.
                contributors[i] = {
                  "username": response[i].login,
                  "name": "",
                  "email": ""
                }
              }
            }
          },
          )
      }

  // function creates local repository based on value in HTML element repoCreate
  function createLocalRepository() {
    //console.log("createLocalRepo")
    if (document.getElementById("repoCreate").value == null || document.getElementById("repoCreate").value == "") {
      document.getElementById("dirPickerCreateLocal").click();
      let localPath = document.getElementById("dirPickerCreateLocal").files[0].webkitRelativePath;
      let fullLocalPath = document.getElementById("dirPickerCreateLocal").files[0].path;
      document.getElementById("repoCreate").value = fullLocalPath;
      document.getElementById("repoCreate").text = fullLocalPath;
      saveMostRecentRepos(fullLocalPath);


    } else {
      if (checkFile.existsSync(localPath)) {
        fullLocalPath = localPath;
      } else {
        checkFile.mkdirSync(localPath);
        fullLocalPath = localPath;
      }
    }
  }

  //console.log("pre-git check")
  //console.log("fullLocalPath is " + fullLocalPath)
  //console.log(require("path").join(fullLocalPath,".git"));
  if (checkFile.existsSync(require("path").join(fullLocalPath, ".git"))) {
    //console.log("Is git repository already")
    updateModalText("This folder is already a git repository. Please try to open it instead.");
  } else {
    displayModal("creating repository at " + require("path").join(fullLocalPath, ".git"));
    Git.Repository.init(fullLocalPath, 0).then(function (repository) {
      repoFullPath = fullLocalPath;
      repoLocalPath = localPath;
      refreshAll(repository);
      //console.log("Repo successfully created");
      updateModalText("Repository successfully created");
      document.getElementById("repoCreate").value = "";
      document.getElementById("dirPickerCreateLocal").value = null;
      switchToMainPanel();
    },
      function (err) {
        updateModalText("Creating Failed - " + err);
        //console.log("repo.ts, line 131, cannot open repository: "+err); // TODO show error on screen
      });
  }
}

function addBranchestoNode(thisB: string) {
  let elem = document.getElementById("otherBranches");
  elem.innerHTML = '';
  for (let i = 0; i < localBranches.length; i++) {
    if (localBranches[i] !== thisB) {
      console.log("local branch: " + localBranches[i]);
      let li = document.createElement("li");
      let a = document.createElement("a");
      a.appendChild(document.createTextNode(localBranches[i]));
      a.setAttribute("tabindex", "0");
      a.setAttribute("href", "#");
      li.appendChild(a);
      elem.appendChild(li);
    }
  }
}

    // Function is called to refresh VisualGit's GUI by reloading current branch and re-drawing the commit graph
  function refreshAll(repository) {
    console.log("Refreshing repository: ");
    console.log(repository.getNamespace());
    document.getElementById('spinner').style.display = 'block';
    let branch;
    bname = [];
    checkAmendButton();
    //Get the current branch from the repo
    repository.getCurrentBranch()
      .then(function (reference) {
        //Get the simplified name from the branch
        let branchParts = reference.name().split("/");
        console.log("branch parts: " + branchParts);
        branch = branchParts[branchParts.length - 1];
      })
      .then(function () {
        //Get the list of branches from the repo
        return repository.getReferences(Git.Reference.TYPE.LISTALL);
      })
      .then(function (branchList) {
        let count = 0;
        clearBranchElement();
        //for each branch
        for (let i = 0; i < branchList.length; i++) {
          console.log("branch name: " + branchList[i].name());
          //get simplified name
          let bp = branchList[i].name().split("/")[branchList[i].name().split("/").length - 1];

          Git.Reference.nameToId(repository, branchList[i].name()).then(function (oid) {
            // Use oid
            console.log("old id " + oid);
            if (branchList[i].isRemote()) {
              // for remote branches add oid and branch name to remote branches map
              remoteName[bp] = oid;
            } else {
              //add branch name to the branch list
              branchCommit.push(branchList[i]);
              console.log(bp + " adding to end of " + oid.tostrS());
              if (oid.tostrS() in bname) {
                bname[oid.tostrS()].push(branchList[i]);
              } else {
                bname[oid.tostrS()] = [branchList[i]];
              }
            }
          }, function (err) {
            console.log("repo.ts, refreshAll(), could not find referenced branch" + err);
          });

        if (branchList[i].isRemote()) {
          if (localBranches.indexOf(bp) < 0) {
            displayBranch(bp, "branch-dropdown", "checkoutRemoteBranch(this)");
          }
        } else {
          localBranches.push(bp);
          displayBranch(bp, "branch-dropdown", "checkoutLocalBranch(this)");
        }


          }
        }
        newRepoLocalPath = "..." + repoLocalPath.slice(breakStringFrom, repoLocalPath.length);
        document.getElementById("repo-name").innerHTML = newRepoLocalPath;
      }else{
        document.getElementById("repo-name").innerHTML = repoLocalPath;
      }
      document.getElementById("branch-name").innerHTML = branch + '<span class="caret"></span>';
    }, function (err) {
      //If the repository has no commits, getCurrentBranch will throw an error.
      //Default values will be set for the branch labels
      window.alert("Warning:\n" +
        "No branches have been found in this repository.\n" +
        "This is likely because there have been no commits made.");
      console.log("No branches found. Setting default label values to master");
      console.log("Updating the labels and graph");
      drawGraph();
      document.getElementById("repo-name").innerHTML = repoLocalPath;
      //default label set to master
      document.getElementById("branch-name").innerHTML = "master" + '<span class="caret"></span>';
    });
}

function getAllBranches() {
  let repos;
  Git.Repository.open(repoFullPath)
    .then(function (repo) {
      repos = repo;
      return repo.getReferenceNames(Git.Reference.TYPE.LISTALL);
    })
    .then(function (branchList) {
      clearBranchElement();
      for (let i = 0; i < branchList.length; i++) {
        console.log("branch discovered: " + branchList[i]);
        let bp = branchList[i].split("/");
        if (bp[1] !== "remotes") {
          displayBranch(bp[bp.length - 1], "branch-dropdown", "checkoutLocalBranch(this)");
        }
        Git.Reference.nameToId(repos, branchList[i]).then(function (oid) {
          // Use oid
          console.log("old id " + oid);
        });
      }
    });
}

function getOtherBranches() {
  let list;
  let repos;
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
      return repos.getCurrentBranch()
    })
    .then(function (ref) {
      let name = ref.name().split("/");
      console.log("merging remote branch with tracked local branch");
      clearBranchElement();
      for (let i = 0; i < list.length; i++) {
        let bp = list[i].split("/");
        if (bp[1] !== "remotes" && bp[bp.length - 1] !== name[name.length - 1]) {
          displayBranch(bp[bp.length - 1], "merge-dropdown", "mergeLocalBranches(this)");
        }
      }
    })

}

function clearMergeElement() {
  let ul = document.getElementById("merge-dropdown");
  ul.innerHTML = '';
}

  function deleteBranchFromDropDown(name){
    $('#branch-to-delete').val(name);
    document.getElementById("displayedBranchName").innerHTML = name;
    $('#delete-branch-modal').modal(); // Display delete branch warning modal
  }

  //
  // Used to Initialize list of branches and list of tags
  //
  function displayBranch(name, id, onclick) {
    quickBranchTagReload = [];
    // Stop click exit
    $(document).on('click', '.dropdown-menu', function (e) {
      e.stopPropagation();
    });
    // list elements set-up
    let tr = document.createElement("tr");
    let listTD = document.createElement("td");
    let a = document.createElement("a");
    a.setAttribute("href", "#");
    a.setAttribute("class", "list-group-item");
    a.setAttribute("onclick", onclick + ";event.stopPropagation()");
    a.appendChild(document.createTextNode(name));
    //a.innerHTML = name;
    // existing check -> Not sure why??
    if (id == "branch-dropdown") {
      // Loop through references
      Git.Repository.open(repoFullPath)
        .then(function (repo) {
          Git.Reference.list(repo).then(function (array) {
            // Remote
            if (array.includes("refs/remotes/origin/" + name)) {
              // already local -> make both
              if(quickBranchTagReload.some(b => b.name == name)) {
                const thisIndex = quickBranchTagReload.findIndex(b => b.name == name);
                a.innerHTML = `${name}<img src='./assets/remote-branch.png' width='20' height='20' align='right' title='Remote'><img src='./assets/local-branch.png' width='20' height='20' align='right' title='Local'>`;
                listTD.innerHTML = a.outerHTML
                tr.innerHTML = listTD.outerHTML
                quickBranchTagReload[thisIndex].type = "both"
                quickBranchTagReload[thisIndex].html = tr.innerHTML

              // just remote so far
              } else {
                listTD.innerHTML = a.outerHTML
                tr.innerHTML = listTD.outerHTML
                a.innerHTML = `${name}<img src='./assets/remote-branch.png' width='20' height='20' align='right' title='Remote'>`;
                let remoteObj = {html: tr.innerHTML, type: "remote", name: name, onclick:onclick}
                this.quickBranchTagReload.push(remoteObj)
              }
            }
          })
          repo.getBranch(name).then(function (branch) {
            // Tag
            if(branch.isTag()){
              a.innerHTML = `${name}<img src='./assets/tag-icon.png' width='20' height='20' align='right' title='Tag'>`;
              listTD.innerHTML = a.outerHTML
              tr.innerHTML = listTD.outerHTML
              let tagObj = {html: tr.outerHTML, type: "tag", name: name, onclick:onclick}
              quickBranchTagReload.push(tagObj)

            // Local Branch
            } else {
              // already remote -> make both
              if(quickBranchTagReload.some(b => b.name == name)) {
                const thisIndex = quickBranchTagReload.findIndex(b => b.name == name);
                a.innerHTML = `${name}<img src='./assets/remote-branch.png' width='20' height='20' align='right' title='Remote'><img src='./assets/local-branch.png' width='20' height='20' align='right' title='Local'>`;
                listTD.innerHTML = a.outerHTML
                tr.innerHTML = listTD.outerHTML
                quickBranchTagReload[thisIndex].type = "both"
                quickBranchTagReload[thisIndex].html = tr.innerHTML

              // just local so far
              } else {
                a.innerHTML = `${name}<img src='./assets/local-branch.png' width='20' height='20' align='right' title='Local'>`;
                listTD.innerHTML = a.outerHTML
                tr.innerHTML = listTD.outerHTML
                let localObj = {html: tr.innerHTML,type: "local", name: name, onclick:onclick}
                quickBranchTagReload.push(localObj)
              }
            }
          })
        })
    }
  }

  //
  // Used to populate branches and tags based on search input
  //
  function displayBranchesTags(){
    // get input vlaue
    let searchVal = document.getElementById('branchName').value;
    // clear lists
    let branchesTab = document.getElementById('branchesTab')
    let tagsTab = document.getElementById('tagsTab')
    branchesTab.innerHTML = ""
    tagsTab.innerHTML = ""
    // populate braches/tags
    quickBranchTagReload.forEach(function(BT){
      //add if contains search input
      if(BT.name.indexOf(searchVal) >= 0){
        // Delete Button
        var button = document.createElement("Button");
        let buttonTD = document.createElement("td");
        button.innerHTML = "Delete";
        button.classList.add('btn-danger')
        $(button).css("position", "absolute")
        $(button).css("right", "5px")
        $(button).css("margin", "5px")
        // row item
        let tr = document.createElement("tr");
          // add to remote and/or local list
          if(BT.type == "remote" || BT.type == "local" || BT.type == "both"){
            tr.innerHTML += BT.html;
            //no delete button if master
            if(BT.name.lowercase!="master"){
              button.setAttribute("onclick", `deleteBranchFromDropDown("${BT.name}")`);
              buttonTD.innerHTML += button.outerHTML
              tr.innerHTML += buttonTD.outerHTML
            }
            branchesTab.appendChild(tr)
          }
          // add to tag list
          if(BT.type == "tag"){
            tr.innerHTML += BT.html;
            button.setAttribute("onclick", `deleteTag("${BT.name}");removeBranchOrTagFromQuick("${BT.name}");event.stopPropagation()`);
            buttonTD.innerHTML += button.outerHTML
            tr.innerHTML += buttonTD.outerHTML
            tagsTab.appendChild(tr)
          }
      }
    })
  }

  function removeBranchOrTagFromQuick(name){
    let i = 0;
    for(let i = 0; i < quickBranchTagReload.length; i++){
      if(quickBranchTagReload[i].name == name){
        quickBranchTagReload.splice(i, 1);
        break;
      }
    }
    displayBranchesTags();

  }

function createDropDownFork(name, id) {
  let ul = document.getElementById(id);
  let button = document.createElement("div");
  let div = document.createElement("ul");
  let innerText = document.createTextNode(name + " (Forked List)");
  button.className = name;
  button.appendChild(innerText);

  let icon = document.createElement("i");
  icon.style.cssFloat = "right";
  icon.style.marginRight = "20px";
  icon.className = "fa fa-window-minimize"

  button.appendChild(icon);

  div.setAttribute("id", name);
  div.setAttribute("role", "menu");
  div.setAttribute("class", "list-group")
  button.onclick = (e) => {
    showDropDown(button);
    icon.className === "fa fa-window-minimize" ? icon.className = "fa fa-plus" : icon.className = "fa fa-window-minimize";
  }
  button.appendChild(div);
  ul.appendChild(button);
}

function showDropDown(ele) {
  //If the forked Repo is clicked collapse or uncollapse the forked repo list
  let div = document.getElementById(ele.className)
  if (div.style.display === 'none') {
    div.style.display = 'block';
  }
  else {
    div.style.display = 'none';
  }

}

function checkoutLocalBranch(element) {
  let bn;
  let img = "<img"
  if (typeof element === "string") {
    bn = element;
  } else {
    bn = element.innerHTML;
  }

  if (bn.includes(img)) {
    bn = bn.substr(0, bn.lastIndexOf(img)) // remove local branch <img> tag from branch name string
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
            repo.checkoutBranch("refs/tags/" + bn)
              .then(function () {
                refreshAll(repo);
              }, function (err) {
                console.log("repo.tx, line 271, cannot checkout local branch: " + err);
              });

          });
      })
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
          console.log("repo.ts, checkoutLocalBranch(), cannot checkout local branch: " + err);
          updateModalText("Cannot checkout local branch: " + err + " Please restart VisualGit");
        });
    })
}


function checkoutRemoteBranch(element) {
  let bn;
  let img = "<img"
  if (typeof element === "string") {
    bn = element;
  } else {
    bn = element.innerHTML;
  }
  if (bn.includes(img)) {
    bn = bn.substr(0, bn.lastIndexOf(img)) // remove remote branch <img> tag from branch name string
    if (bn.includes(img)) {
      bn = bn.substr(0, bn.lastIndexOf(img))  // remove local branch <img> tag from branch name string
    }
    console.log("current branch name: " + bn);
    let repos;
    Git.Repository.open(repoFullPath)
      .then(function (repo) {
        repos = repo;
        addCommand("git fetch");
        addCommand("git checkout -b " + bn);
        let cid = remoteName[bn];
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
      })
  }
}


function updateLocalPath() {
  let fullLocalPath;
  // get the name of the repo from the usere entered URL
  let text = document.getElementById("repoClone").value;
  let splitText = text.split(/\.|:|\//);


  if (splitText[splitText.length - 1] == "git") {
    // Get the path location for this local folder, and join it with the repo name (from the URL)
    fullLocalPath = require("path").join(__dirname, splitText[splitText.length - 2]);
    updateRepoSaveText(fullLocalPath);
  } else {
    // Get the path location for this local folder, and join it with the repo name (from the URL)
    fullLocalPath = require("path").join(__dirname, splitText[splitText.length - 1]);
    updateRepoSaveText(fullLocalPath);
  }
}

// This function updates the repoSave text field
function updateRepoSaveText(fullLocalPath) {
  document.getElementById("repoSave").value = fullLocalPath;
  document.getElementById("repoSave").text = fullLocalPath;
}

// This function helps display the users chosen folder location on repoSave
function chooseLocalPath() {
  if (document.getElementById("repoClone").value == null || document.getElementById("repoClone").value == "") {
    window.alert("Please enter the URL of the repository you wish to clone");
  } else {
    // get the name of the repo from the usere entered URL
    let text = document.getElementById("repoClone").value;
    let splitText = text.split(/\.|:|\//);
    let fullLocalPath;

    // get the users selected folder
    localPath = document.getElementById("dirPickerSaveNew").files[0].webkitRelativePath;
    fullLocalPath = document.getElementById("dirPickerSaveNew").files[0].path;

    // display the new folder location on repoSave text field
    updateRepoSaveText(fullLocalPath);
  }
}

// function initModal() {
//   modal = document.getElementById("modal");
//   btn = document.getElementById("new-repo-button");
//   confirmBtn = document.getElementById("confirm-button");
//   span = document.getElementsByClassName("close")[0];
// }

// function handleModal() {
//   // When the user clicks on <span> (x), close the modal
//   span.onclick = function() {
//     modal.style.display = "none";
//   };
//
//   // When the user clicks anywhere outside of the modal, close it
//   window.onclick = function(event) {
//
//     if (event.target === modal) {
//       modal.style.display = "none";
//     }
//   };
// }

function displayModal(text) {
  //  initModal();
  //  handleModal();
  document.getElementById("modal-text-box").innerHTML = text;
  $('#modal').modal('show');
}

//Updating stash show modal text and adding classes for highlighting
function updateModalText(text) {
  let newText = "";
  newText += '<div>'
  text.forEach((item) => {
    newText += '<div>'
    for (var i = 0; i < item.length; i++) {
      let character = item.charAt(i);
      if (character === '-') {
        newText += '<span class="minus">' + character + '</span>';
      } else if (character === '+') {
        newText += '<span class="plus">' + character + '</span>';
      } else {
        newText += '<span>' + character + '</span>';
      }
    }
    newText += '</div>'
  });
  newText += '</div>'

  $('#stash-show-modal').modal('show');
  document.getElementById("stash-show-modal-body").innerHTML = newText;
}

  function displayPushToRemoteModal() { //modal displayed when push attempted to remote branch that doesnt exist

    $('#modalW4').modal('show');
  }

function hidePRPanel(): void {
  // Hide PR Panel
  let prStatus1 = document.getElementById("pr-status-1");
  let prStatus2 = document.getElementById("pr-status-2");
  if (prStatus1 != null && prStatus2 != null) {
    prStatus1.style.display = "none";
    prStatus2.style.display = "none";
  }

  // Function is called to the pull request panel
  function hidePRPanel(): void{
    // Hide PR Panel
    let prStatus1 = document.getElementById("pr-status-1");
    let prStatus2 = document.getElementById("pr-status-2");
    if (prStatus1 != null && prStatus2 != null) {
        prStatus1.style.display = "none";
        prStatus2.style.display = "none";
    }

    let prPanel = document.getElementById("pull-request-panel");
    let bodyPanel = document.getElementById("body-panel");
    let prListContainer = document.getElementById("pr-list-container");
    let prDisplayPanel = document.getElementById("pr-display-panel");


  if (prPanel != null && bodyPanel != null && prListContainer != null && prDisplayPanel != null) {
    prPanel.style.width = "60px";
    prListContainer.style.display = "none";

    /*
      Calulates space leftover for the body panel after
      accounting for the space taken up by the side panel.
    */
    bodyPanel.style.width = "calc(80% - 60px)";

    prDisplayPanel.style.display = "none";
  }

  let prDiv = document.getElementById("pr-div");
  if (prDiv != null) {
    prDiv.innerHTML = "";
  }

  let prDiff = document.getElementById("pr-diff");
  if (prDiff != null) {
    prDiff.innerHTML = "";
  }

  let prList = document.getElementById("pr-list");
  if (prList != null) {
    prList.innerHTML = "";
  }

  let prFrom = document.getElementById("pr-from");
  if (prFrom != null) {
    prFrom.innerHTML = "";
  }

  let prTo = document.getElementById("pr-to");
  if (prTo != null) {
    prTo.innerHTML = "";
  }
}