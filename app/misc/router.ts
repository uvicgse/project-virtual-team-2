let cred;
let blue = "#39c0ba";
let gray = "#5b6969";
let continuedWithoutSignIn = false;
let inTheApp = false;
let showUsername = true;
let previousWindow = "repoPanel";
var fs = require("fs");

function collapseSignPanel() {
  $("#nav-collapse1").collapse("hide");
}

// Function changes VisualGit's GUI to show clone panel
function switchToClonePanel() {
  console.log("switch to clone panel");
  hideAuthenticatePanel();
  hideFilePanel();
  hidePullRequestPanel();
  hideGraphPanel();
  displayClonePanel();
}

// Function changes VisualGit's GUI to show main screen
function switchToMainPanel() {
  hideAuthenticatePanel();
  hideAddRepositoryPanel();
  displayFilePanel();
  displayPullRequestPanel();
  displayGraphPanel();
  displayStatusPanel();

  openDisabled = false;

  $("#nav-collapse1").collapse("hide");
  if(previousWindow == "repoPanel"){
    if(showUsername){
      document.getElementById("Button_Sign_out").style.display = "block";
      document.getElementById("Button_Sign_in").style.display="none";
    }else{
      document.getElementById("Button_Sign_out").style.display = "none";
      document.getElementById("Button_Sign_in").style.display="block";
    }
  }
  previousWindow = "mainPanel";
}

// Function displays a modal telling user to sign in if user is not sign in 
function checkSignedIn() {
  if (continuedWithoutSignIn) {
    displayModal("You need to sign in");
    // Don't open the repo modal
    $('#repo-name').removeAttr("data-target");
} else {
    // Ensure repo modal is connected
    let butt = document.getElementById("cloneButton");
    butt.disabled = true;
    butt.innerHTML = 'Clone';
    butt.setAttribute('class', 'btn btn-primary');
    $('#repo-name').attr("data-target", "#repo-modal");

  }
}

function checkIfInTheApp(){
  return inTheApp;
}

// Function changes VisualGit's GUI to display component that allows user to open, add, or create a repository
function switchToAddRepositoryPanelWhenNotSignedIn() {
  previousWindow = "repoPanel";
  continuedWithoutSignIn = true;
  showUsername = false;
  switchToAddRepositoryPanel();

}

function switchToAddRepositoryPanel() {
  window.dispatchEvent(new Event('loadRecentRepos'));

  inTheApp = true
  console.log("Switching to add repo panel");
  hideAuthenticatePanel();
  hideFilePanel();
  hidePullRequestPanel();
  hideGraphPanel();
  hideStatusPanel();
  displayAddRepositoryPanel();

  if(showUsername){
    document.getElementById("Button_Sign_out").style.display = "block";
    document.getElementById("Button_Sign_in").style.display = "none";
    displayUsername();
  }else{
    $("#nav-collapse1").collapse("hide");
    document.getElementById("Button_Sign_out").style.display = "none";
    //document.getElementById("Button_Sign_in").style.display = "block";
  }
  let repoOpen = <HTMLInputElement>document.getElementById("repoOpen");
  if (repoOpen != null){
    repoOpen.value = "";
  }
}

// Function hides sign in button if Oauth token exists
function hideSignInButton():void{
  let file = "token.json";
  fs.access(file, fs.constants.F_OK, (err) => {
    displayModal("Token detected, please log out first if you want to continue without sign in! ");
    console.log(`${file} ${err ? 'does not exist' : 'exists'}`);
  });
  if (getOauthToken()) {
    document.getElementById("Button_Sign_in").style.display = "none";
  }

  if(previousWindow!="repoPanel"){
    switchToMainPanel();
  }
}

function wait(ms) {
  var start = new Date().getTime();
  var end = start;
  while (end < start + ms) {
    end = new Date().getTime();
  }
}

// Function displays current sign-in user's username
function displayUsername() {
  console.log("Display Username called");
  document.getElementById("Button_Sign_out").style.display = "block";
  showUsername = true;
  console.log(getUsername());
  let githubname = document.getElementById("githubname");
  if (githubname != null){
    let existing_username = githubname.innerHTML;
    if (getUsername() != null && existing_username == null) {
      githubname.innerHTML = getUsername();
    }
  }
}

// Function displays the panel for cloning a repository
function displayClonePanel() {
  let addRepositoryPanel = document.getElementById("add-repository-panel");
  if (addRepositoryPanel != null){
    addRepositoryPanel.style.zIndex = "10";
  }
  $("#open-local-repository").hide();
}

// Function displays panel that contains various command buttons in the bottom left corner of VisualGit's main component GUI
function displayFilePanel() {
  let filePanel = document.getElementById("file-panel");
  if (filePanel != null){
    filePanel.style.zIndex = "10";
  }

  let commitMessageInput = document.getElementById("commit-message-input");
  if (commitMessageInput != null){
    commitMessageInput.style.visibility = "visible";
  }

  let commitButton = document.getElementById("commit-button");
  if (commitButton != null){
    commitButton.style.visibility = "visible";
  }
  let stashButton = document.getElementById("stash-button");
  if (stashButton != null){
    stashButton.style.visibility = "visible";
  }

  let popButton = document.getElementById("pop-button");
  if (popButton != null){
    popButton.style.visibility = "visible";
  }

  let fileEditButton = document.getElementById("fileEdit-button");
  if (fileEditButton != null){
    fileEditButton.style.visibility = "visible";
  }
  checkAmendButton();
  // let amendCommitButton = document.getElementById("amend-commit-button");
  // let ahead;
  // console.log('test');

  // ahead = await checkIfExistLocalCommit();
  // console.log('AHEAD', ahead);
  // if (amendCommitButton != null){
  //   amendCommitButton.style.visibility = "visible";
  //   if (!ahead) {
  //     amendCommitButton.style.cursor = "not-allowed";
  //     amendCommitButton.style['pointer-events'] = "none";
  //   } else {
  //     amendCommitButton.style.cursor = "pointer";
  //     amendCommitButton.style['pointer-events'] = "auto";
  //   }
  // }



  document.getElementById("Issues-button").style="visiblity: visible";
}

// Function displays an unclickable amend commit button if no unpushed commits exist.
// If unpushed commits exist, function displays a clickable amend commit button
function checkAmendButton() {
  // Method checking whether to make amend button clickable. Button will be clickable if there is more than
  // one unpushed commit
  let amendCommitButton = document.getElementById("amend-commit-button");
  let ahead;
  checkIfExistLocalCommit().then((ahead) => {
    //console.log('AHEAD', ahead);
    if (amendCommitButton != null){
      amendCommitButton.style.visibility = "visible";
      if (!ahead) {
        amendCommitButton.style.cursor = "not-allowed";
        amendCommitButton.style['pointer-events'] = "none";
      } else {
        amendCommitButton.style.cursor = "pointer";
        amendCommitButton.style['pointer-events'] = "auto";
      }
    }
  });
}

// Function displays the pull request panel
function displayPullRequestPanel() {
  let prPanel = document.getElementById("pull-request-panel")
  if (prPanel != null) {
    prPanel.style.zIndex = "10";
  }
}

// Function hides the pull request panel
function hidePullRequestPanel() {
  let prPanel = document.getElementById("pull-request-panel")
  if (prPanel != null) {
    prPanel.style.zIndex = "-10";
  }
}

// Function displays the graph panel
function displayGraphPanel() {
  let graphPanel = document.getElementById("graph-panel");
  if (graphPanel != null){
    graphPanel.style.zIndex = "10";
  }
}

// Function displays the component that allows a user to open, add, or create a repository
function displayAddRepositoryPanel() {
  previousWindow = "repoPanel";
  let addRepositoryPanel = document.getElementById("add-repository-panel");
  if (addRepositoryPanel != null) {
    addRepositoryPanel.style.zIndex = "10";
  }
  $("#open-local-repository").show();
}

// Function hides the panel that contains basic command buttons
function hideFilePanel() {
  let filePanel = document.getElementById("file-panel");
  if (filePanel != null){
    filePanel.style.zIndex = "-10";
  }

  let commitMessageInput = document.getElementById("commit-message-input");
  if (commitMessageInput != null){
    commitMessageInput.style.visibility = "hidden";
  }

  let commitButton = document.getElementById("commit-button");
  if (commitButton != null){
    commitButton.style.visibility = "hidden";
  }
  let stashButton = document.getElementById("stash-button");
  if (stashButton != null){
    stashButton.style.visibility = "hidden";
  }

  let popButton = document.getElementById("pop-button");
  if (popButton != null){
    popButton.style.visibility = "hidden";
  }

  let fileEditButton = document.getElementById("fileEdit-button");
  if (fileEditButton != null){
    fileEditButton.style.visibility = "hidden";
  }

  let amendCommitButton = document.getElementById("amend-commit-button");
  if (amendCommitButton != null){
    amendCommitButton.style.visibility = "hidden";
  }

  document.getElementById("Issues-button").style="visibility: hidden";
}

// Function hides the graph panel
function hideGraphPanel() {
  let graphPanel = document.getElementById("graph-panel");
  if (graphPanel != null) {
    graphPanel.style.zIndex = "-10";
  }
}

// Function hides the component that allows a user to open, add, or create a repository
function hideAddRepositoryPanel() {
  let addRepositoryPanel = document.getElementById("add-repository-panel");
  if (addRepositoryPanel != null) {
    addRepositoryPanel.style.zIndex = "-10";
  }
}

// Function displays the current status of the branch (ahead, behind, or up to date with remote)
function displayStatusPanel() {
  let statusPanel = document.getElementById("status-panel");
  if(statusPanel != null){
    statusPanel.style.border = "solid";
  }

  let statusHeading = document.getElementById("status-heading");
  if(statusHeading != null){
    statusHeading.style.visibility = "visible";
  }

  let aheadBehindDisplay = document.getElementById("ahead-behind-display");
  if(aheadBehindDisplay != null){
    aheadBehindDisplay.style.visibility = "visible";
  }

  let fetchButton = document.getElementById("fetch-button");
  if(fetchButton != null){
    fetchButton.style.visibility = "visible";
  }
}

// Function hides the panel that displays the current status of the branch (ahead, behind, or up to date with remote)
function hideStatusPanel() {
  let statusPanel = document.getElementById("status-panel");
  if(statusPanel != null){
    statusPanel.style.border = "0";
  }

  let statusHeading = document.getElementById("status-heading");
  if(statusHeading != null){
    statusHeading.style.visibility = "hidden";
  }

  let aheadBehindDisplay = document.getElementById("ahead-behind-display");
  if(aheadBehindDisplay != null){
    aheadBehindDisplay.style.visibility = "hidden";
  }

  let fetchButton = document.getElementById("fetch-button");
  if(fetchButton != null){
    fetchButton.style.visibility = "hidden";
  }




}

// Function displays diff panel
function displayDiffPanel() {
  let graphPanel = document.getElementById("graph-panel");
  if (graphPanel != null) {
    graphPanel.style.width = "60%";
  }

  let diffPanel = document.getElementById("diff-panel");
  if (diffPanel != null) {
    diffPanel.style.width = "40%";
  }

  displayDiffPanelButtons();
}

// Function hides diff panel
function hideDiffPanel() {
  let diffPanel = document.getElementById("diff-panel");
  if (diffPanel != null) {
    diffPanel.style.width = "0";
  }

  let graphPanel = document.getElementById("graph-panel");
  if (graphPanel != null) {
    graphPanel.style.width = "100%";
  }

  disableDiffPanelEditOnHide();
  hideDiffPanelButtons();
}

// Function hides diff panel if no files have changed
function hideDiffPanelIfNoChange() {
  let filename = document.getElementById("diff-panel-file-name") == null ? null : document.getElementById("diff-panel-file-name")!.innerHTML;
  let filePaths = document.getElementsByClassName('file-path');
  let nochange = true;
  for (let i = 0; i < filePaths.length; i++) {
    if (filePaths[i].innerHTML === filename) {

      nochange = false;
    }
  }
  if (nochange == true){
    hideDiffPanel();
  }
  filename = null;
}

// Function hides the panel for authentication
function hideAuthenticatePanel() {
  let authenticate = document.getElementById("authenticate");
  if (authenticate != null) {
    authenticate.style.zIndex = "-20";
  }
}

// Function displays the panel for authentication
function displayAuthenticatePanel() {
  let authenticate = document.getElementById("authenticate");
  if (authenticate != null) {
    authenticate.style.zIndex = "20";
  }
}

// Function displays the visibility of save and cancel button
function displayDiffPanelButtons() {
  let saveButton = document.getElementById("save-button");
  if (saveButton != null) {
    saveButton.style.visibility = "visible";
  }

  let cancelButton = document.getElementById("cancel-button");
  if (cancelButton != null) {
    cancelButton.style.visibility = "visible";
  }
  document.getElementById("open-editor-button").style.visibility = "visible";
}

// Function hides the visibility of save and cancel button
function hideDiffPanelButtons() {
  let saveButton = document.getElementById("save-button");
  if (saveButton != null) {
    saveButton.style.visibility = "hidden";
  }

  let cancelButton = document.getElementById("cancel-button");
  if (cancelButton != null) {
    cancelButton.style.visibility = "hidden";
  }
  document.getElementById("open-editor-button").style.visibility = "hidden";
  disableSaveCancelButton();
  disableDiffPanelEditOnHide();
}

// Function disables Save and Cancel button
function disableSaveCancelButton() {
  let saveButton = <HTMLInputElement>document.getElementById("save-button");
  let cancelButton = <HTMLInputElement>document.getElementById("cancel-button");
  saveButton.disabled = true;
  saveButton.style.backgroundColor = gray;
  cancelButton.disabled = true;
  cancelButton.style.backgroundColor = gray;
}

// Function undisables Save and Cancel button 
function enableSaveCancelButton() {
  let saveButton = <HTMLInputElement>document.getElementById("save-button");
  let cancelButton = <HTMLInputElement>document.getElementById("cancel-button");
  saveButton.disabled = false;
  saveButton.style.backgroundColor = blue;
  cancelButton.disabled = false;
  cancelButton.style.backgroundColor = blue;
}

// Function prevents HTML element diff-panel-body from being modified.
function disableDiffPanelEditOnHide() {
  let doc = document.getElementById("diff-panel-body");
  if (doc != null) {
    doc.contentEditable = "false";
  }
}