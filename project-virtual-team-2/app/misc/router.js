var cred;
var blue = "#39c0ba";
var gray = "#5b6969";
var continuedWithoutSignIn = false;
var inTheApp = false;
var showUsername = true;
var previousWindow = "repoPanel";
function collapseSignPanel() {
    $("#nav-collapse1").collapse("hide");
}
function switchToClonePanel() {
    console.log("switch to clone panel");
    hideAuthenticatePanel();
    hideFilePanel();
    hidePullRequestPanel();
    hideGraphPanel();
    displayClonePanel();
}
function switchToMainPanel() {
    hideAuthenticatePanel();
    hideAddRepositoryPanel();
    displayFilePanel();
    displayPullRequestPanel();
    displayGraphPanel();
    openDisabled = false;
    $("#nav-collapse1").collapse("hide");
    if (previousWindow == "repoPanel") {
        if (showUsername) {
            document.getElementById("Button_Sign_out").style.display = "block";
            document.getElementById("Button_Sign_in").style.display = "none";
        }
        else {
            document.getElementById("Button_Sign_out").style.display = "none";
            document.getElementById("Button_Sign_in").style.display = "block";
        }
    }
    previousWindow = "mainPanel";
}
function checkSignedIn() {
    if (continuedWithoutSignIn) {
        displayModal("You need to sign in");
        $('#repo-name').removeAttr("data-target");
    }
    else {
        var butt = document.getElementById("cloneButton");
        butt.disabled = true;
        butt.innerHTML = 'Clone';
        butt.setAttribute('class', 'btn btn-primary');
        $('#repo-name').attr("data-target", "#repo-modal");
    }
}
function checkIfInTheApp() {
    return inTheApp;
}
function switchToAddRepositoryPanelWhenNotSignedIn() {
    previousWindow = "repoPanel";
    continuedWithoutSignIn = true;
    showUsername = false;
    switchToAddRepositoryPanel();
}
function switchToAddRepositoryPanel() {
    window.dispatchEvent(new Event('loadRecentRepos'));
    document.getElementById("Button_Sign_out").style.display = "block";
    inTheApp = true;
    console.log("Switching to add repo panel");
    hideAuthenticatePanel();
    hideFilePanel();
    hidePullRequestPanel();
    hideGraphPanel();
    displayAddRepositoryPanel();
    if (showUsername) {
        document.getElementById("Button_Sign_out").style.display = "block";
        document.getElementById("Button_Sign_in").style.display = "none";
        displayUsername();
    }
    else {
        $("#nav-collapse1").collapse("hide");
        document.getElementById("Button_Sign_out").style.display = "none";
        document.getElementById("Button_Sign_in").style.display = "block";
    }
    var repoOpen = document.getElementById("repoOpen");
    if (repoOpen != null) {
        repoOpen.value = "";
    }
}
function hideSignInButton() {
    document.getElementById("Button_Sign_in").style.display = "none";
    if (previousWindow != "repoPanel") {
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
function displayUsername() {
    console.log("Display Username called");
    document.getElementById("Button_Sign_out").style.display = "block";
    showUsername = true;
    console.log(getUsername());
    var githubname = document.getElementById("githubname");
    if (githubname != null) {
        var existing_username = githubname.innerHTML;
        if (getUsername() != null && existing_username == null) {
            githubname.innerHTML = getUsername();
        }
    }
}
function displayClonePanel() {
    var addRepositoryPanel = document.getElementById("add-repository-panel");
    if (addRepositoryPanel != null) {
        addRepositoryPanel.style.zIndex = "10";
    }
    $("#open-local-repository").hide();
}
function displayFilePanel() {
    var filePanel = document.getElementById("file-panel");
    if (filePanel != null) {
        filePanel.style.zIndex = "10";
    }
    var commitMessageInput = document.getElementById("commit-message-input");
    if (commitMessageInput != null) {
        commitMessageInput.style.visibility = "visible";
    }
    var commitButton = document.getElementById("commit-button");
    if (commitButton != null) {
        commitButton.style.visibility = "visible";
    }
    var fileEditButton = document.getElementById("fileEdit-button");
    if (fileEditButton != null) {
        fileEditButton.style.visibility = "visible";
    }
    document.getElementById("Issues-button").style = "visiblity: visible";
}
function displayPullRequestPanel() {
    var prPanel = document.getElementById("pull-request-panel");
    if (prPanel != null) {
        prPanel.style.zIndex = "10";
    }
}
function hidePullRequestPanel() {
    var prPanel = document.getElementById("pull-request-panel");
    if (prPanel != null) {
        prPanel.style.zIndex = "-10";
    }
}
function displayGraphPanel() {
    var graphPanel = document.getElementById("graph-panel");
    if (graphPanel != null) {
        graphPanel.style.zIndex = "10";
    }
}
function displayAddRepositoryPanel() {
    previousWindow = "repoPanel";
    var addRepositoryPanel = document.getElementById("add-repository-panel");
    if (addRepositoryPanel != null) {
        addRepositoryPanel.style.zIndex = "10";
    }
    $("#open-local-repository").show();
}
function hideFilePanel() {
    var filePanel = document.getElementById("file-panel");
    if (filePanel != null) {
        filePanel.style.zIndex = "-10";
    }
    var commitMessageInput = document.getElementById("commit-message-input");
    if (commitMessageInput != null) {
        commitMessageInput.style.visibility = "hidden";
    }
    var commitButton = document.getElementById("commit-button");
    if (commitButton != null) {
        commitButton.style.visibility = "hidden";
    }
    var fileEditButton = document.getElementById("fileEdit-button");
    if (fileEditButton != null) {
        fileEditButton.style.visibility = "hidden";
    }
    document.getElementById("Issues-button").style = "visibility: hidden";
}
function hideGraphPanel() {
    var graphPanel = document.getElementById("graph-panel");
    if (graphPanel != null) {
        graphPanel.style.zIndex = "-10";
    }
}
function hideAddRepositoryPanel() {
    var addRepositoryPanel = document.getElementById("add-repository-panel");
    if (addRepositoryPanel != null) {
        addRepositoryPanel.style.zIndex = "-10";
    }
}
function displayDiffPanel() {
    var graphPanel = document.getElementById("graph-panel");
    if (graphPanel != null) {
        graphPanel.style.width = "60%";
    }
    var diffPanel = document.getElementById("diff-panel");
    if (diffPanel != null) {
        diffPanel.style.width = "40%";
    }
    displayDiffPanelButtons();
}
function hideDiffPanel() {
    var diffPanel = document.getElementById("diff-panel");
    if (diffPanel != null) {
        diffPanel.style.width = "0";
    }
    var graphPanel = document.getElementById("graph-panel");
    if (graphPanel != null) {
        graphPanel.style.width = "100%";
    }
    disableDiffPanelEditOnHide();
    hideDiffPanelButtons();
}
function hideDiffPanelIfNoChange() {
    var filename = document.getElementById("diff-panel-file-name") == null ? null : document.getElementById("diff-panel-file-name").innerHTML;
    var filePaths = document.getElementsByClassName('file-path');
    var nochange = true;
    for (var i = 0; i < filePaths.length; i++) {
        if (filePaths[i].innerHTML === filename) {
            nochange = false;
        }
    }
    if (nochange == true) {
        hideDiffPanel();
    }
    filename = null;
}
function hideAuthenticatePanel() {
    var authenticate = document.getElementById("authenticate");
    if (authenticate != null) {
        authenticate.style.zIndex = "-20";
    }
}
function displayAuthenticatePanel() {
    var authenticate = document.getElementById("authenticate");
    if (authenticate != null) {
        authenticate.style.zIndex = "20";
    }
}
function displayDiffPanelButtons() {
    var saveButton = document.getElementById("save-button");
    if (saveButton != null) {
        saveButton.style.visibility = "visible";
    }
    var cancelButton = document.getElementById("cancel-button");
    if (cancelButton != null) {
        cancelButton.style.visibility = "visible";
    }
    document.getElementById("open-editor-button").style.visibility = "visible";
}
function hideDiffPanelButtons() {
    var saveButton = document.getElementById("save-button");
    if (saveButton != null) {
        saveButton.style.visibility = "hidden";
    }
    var cancelButton = document.getElementById("cancel-button");
    if (cancelButton != null) {
        cancelButton.style.visibility = "hidden";
    }
    document.getElementById("open-editor-button").style.visibility = "hidden";
    disableSaveCancelButton();
    disableDiffPanelEditOnHide();
}
function disableSaveCancelButton() {
    var saveButton = document.getElementById("save-button");
    var cancelButton = document.getElementById("cancel-button");
    saveButton.disabled = true;
    saveButton.style.backgroundColor = gray;
    cancelButton.disabled = true;
    cancelButton.style.backgroundColor = gray;
}
function enableSaveCancelButton() {
    var saveButton = document.getElementById("save-button");
    var cancelButton = document.getElementById("cancel-button");
    saveButton.disabled = false;
    saveButton.style.backgroundColor = blue;
    cancelButton.disabled = false;
    cancelButton.style.backgroundColor = blue;
}
function disableDiffPanelEditOnHide() {
    var doc = document.getElementById("diff-panel-body");
    if (doc != null) {
        doc.contentEditable = "false";
    }
}
function useSavedCredentials() {
    var file = 'data.json';
    if (fs.existsSync(file)) {
        console.log('button has been pressed: logging in with saved credentials');
        decrypt();
        loginWithSaved(switchToMainPanel);
        return true;
    }
    return false;
}
