"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var PullRequestPanelComponent = (function () {
    function PullRequestPanelComponent() {
        this.isShowingPRPanel = false;
        this.isShowingFileDiff = false;
        this.apiLink = "https://api.github.com/repos/";
        this.repoOwner = "";
        this.repoName = "";
    }
    PullRequestPanelComponent.prototype.togglePRPanel = function () {
        var prStatus1 = document.getElementById("pr-status-1");
        var prStatus2 = document.getElementById("pr-status-2");
        if (prStatus1 != null && prStatus2 != null) {
            if (prStatus1.style.display === "none" && prStatus2.style.display === "none") {
                prStatus1.style.display = "block";
                prStatus2.style.display = "block";
                this.isShowingPRPanel = false;
                this.showPRPanel();
            }
            else {
                this.isShowingPRPanel ? this.hidePRPanel() : this.showPRPanel();
            }
        }
    };
    PullRequestPanelComponent.prototype.showPRPanel = function () {
        this.halfExtendPRPanel();
        this.updatePRs();
    };
    PullRequestPanelComponent.prototype.hidePRPanel = function () {
        var prPanel = document.getElementById("pull-request-panel");
        var bodyPanel = document.getElementById("body-panel");
        var prListContainer = document.getElementById("pr-list-container");
        var prDisplayPanel = document.getElementById("pr-display-panel");
        if (prPanel != null && bodyPanel != null && prListContainer != null && prDisplayPanel != null) {
            prPanel.style.width = "60px";
            prListContainer.style.display = "none";
            bodyPanel.style.width = "calc(80% - 60px)";
            prDisplayPanel.style.display = "none";
            this.isShowingPRPanel = false;
        }
        this.resetFullPanel();
    };
    PullRequestPanelComponent.prototype.getRepoOwner = function (callback) {
        var _this = this;
        var gitConfigFileText = readFile.read(repoFullPath + "/.git/config", null);
        var searchString = "[remote \"origin\"]";
        gitConfigFileText = gitConfigFileText.substr(gitConfigFileText.indexOf(searchString) + searchString.length, gitConfigFileText.length);
        gitConfigFileText = gitConfigFileText.substr(0, gitConfigFileText.indexOf(".git"));
        var gitConfigFileSubstrings = gitConfigFileText.split('/');
        if (gitConfigFileSubstrings[0].indexOf("@") != -1) {
            gitConfigFileSubstrings[0] = gitConfigFileSubstrings[0].substring(gitConfigFileSubstrings[0].indexOf(":") + 1);
        }
        this.repoOwner = gitConfigFileSubstrings[gitConfigFileSubstrings.length - 2];
        this.repoName = gitConfigFileSubstrings[gitConfigFileSubstrings.length - 1];
        var url = this.apiLink + this.repoOwner + "/" + this.repoName;
        this.gitHubGetRequest(url, function (response) {
            if (response.fork) {
                _this.repoOwner = response.parent.owner.login;
            }
            else {
                _this.repoOwner = _this.repoOwner;
            }
            callback();
        });
    };
    PullRequestPanelComponent.prototype.getPRs = function (callback) {
        var _this = this;
        this.getRepoOwner(function () {
            var url = _this.apiLink + _this.repoOwner + "/" + _this.repoName + "/pulls";
            _this.gitHubGetRequest(url, function (response) {
                callback(response);
            });
        });
    };
    PullRequestPanelComponent.prototype.populatePRPanel = function (pullRequests) {
        var _this = this;
        var prList = document.getElementById("pr-list");
        if (prList != null) {
            prList.innerHTML = "";
            pullRequests.forEach(function (pr) {
                var listElement = document.createElement("li");
                var link = document.createElement("a");
                link.className = "list-group-item";
                listElement.setAttribute("role", "presentation");
                link.innerHTML = "PR #" + pr.number + ": " + pr.title;
                link.onclick = function (e) {
                    _this.resetFullPanel();
                    _this.getPRFileDiff(pr);
                    _this.fullExtendPRPanel();
                    _this.createInitialPRPost(pr, function () {
                        _this.gitHubGetRequest(pr.comments_url, function (response) {
                            response.forEach(function (comment) {
                                _this.createCommentPost(comment);
                            });
                            _this.createCommentInputArea(pr, function () {
                                link.click();
                            });
                        });
                    });
                };
                listElement.appendChild(link);
                prList.appendChild(listElement);
            });
        }
    };
    PullRequestPanelComponent.prototype.createInitialPRPost = function (pr, callback) {
        var outerRow = document.createElement("div");
        outerRow.className = "row";
        var column = document.createElement("div");
        column.className = "col-sm-8 col-sm-offset-2";
        var card = document.createElement("div");
        card.className = "pr-card";
        var prTitle = document.createElement("h1");
        var prTitleText = document.createTextNode("Pull Request #" + pr.number + ": " + pr.title);
        prTitle.appendChild(prTitleText);
        var prAuthor = document.createElement("h5");
        var prAuthorText = document.createTextNode(pr.user.login + " wants to merge " + pr.head.label + " into " + pr.base.label + ".");
        prAuthor.appendChild(prAuthorText);
        var prBody = document.createElement("p");
        var prBodyText = document.createTextNode(pr.body);
        prBody.appendChild(prBodyText);
        card.appendChild(prTitle);
        card.appendChild(prAuthor);
        card.appendChild(prBody);
        column.appendChild(card);
        outerRow.appendChild(column);
        var prDiv = document.getElementById("pr-div");
        if (prDiv != null) {
            prDiv.appendChild(outerRow);
        }
        callback();
    };
    PullRequestPanelComponent.prototype.createCommentPost = function (comment) {
        var outerRow = document.createElement("div");
        outerRow.className = "row";
        var column = document.createElement("div");
        column.className = "col-sm-8 col-sm-offset-2";
        var card = document.createElement("div");
        card.className = "pr-card";
        var commentAuthor = document.createElement("h5");
        var commentAuthorText = document.createTextNode(comment.user.login + " commented:");
        commentAuthor.appendChild(commentAuthorText);
        var commentBody = document.createElement("p");
        var commentBodyText = document.createTextNode(comment.body);
        commentBody.appendChild(commentBodyText);
        card.appendChild(commentAuthor);
        card.appendChild(commentBody);
        column.appendChild(card);
        outerRow.appendChild(column);
        var prDiv = document.getElementById("pr-div");
        if (prDiv != null) {
            prDiv.appendChild(outerRow);
        }
    };
    PullRequestPanelComponent.prototype.createCommentInputArea = function (pr, callback) {
        var _this = this;
        var outerRow = document.createElement("div");
        outerRow.className = "row";
        var column = document.createElement("div");
        column.className = "col-sm-8 col-sm-offset-2";
        var card = document.createElement("div");
        card.className = "pr-card";
        var createComment = document.createElement("h3");
        var createCommentText = document.createTextNode("Add a comment: ");
        createComment.appendChild(createCommentText);
        var commentInput = document.createElement("textarea");
        commentInput.className = "pr-comment-panel";
        var submitButton = document.createElement("button");
        submitButton.innerText = "Submit Comment";
        submitButton.className = "btn btn-success pr-comment-submit";
        submitButton.onclick = function (e) {
            if (commentInput.value === "" || commentInput.value == null) {
                createCommentText.textContent = "Please enter a comment: ";
            }
            else {
                var data = {
                    "body": commentInput.value,
                    "in_reply_to": pr.id
                };
                var jsonData = JSON.stringify(data);
                var url_1 = _this.apiLink + _this.repoOwner + "/" + _this.repoName + "/issues/" + pr.number + "/comments";
                _this.gitHubPostRequest(url_1, jsonData, function (response) {
                    callback();
                });
            }
        };
        card.appendChild(createComment);
        card.appendChild(commentInput);
        card.appendChild(submitButton);
        column.appendChild(card);
        outerRow.appendChild(column);
        var prDiv = document.getElementById("pr-div");
        if (prDiv != null) {
            prDiv.appendChild(outerRow);
        }
    };
    PullRequestPanelComponent.prototype.createNewPullRequest = function () {
        var _this = this;
        var prFrom = document.getElementById("pr-from");
        var prTo = document.getElementById("pr-to");
        var prTitle = document.getElementById("pr-title");
        var prBody = document.getElementById("pr-body");
        if (prFrom != null && prTo != null && prTitle != null) {
            if (this.isValidPR(prFrom, prTo, prTitle)) {
                if (prBody != null) {
                    var url_2 = this.apiLink + this.repoOwner + "/" + this.repoName + "/pulls";
                    var data = {
                        "title": prTitle.value,
                        "head": prFrom.value,
                        "base": prTo.value,
                        "body": prBody.value
                    };
                    var jsonData = JSON.stringify(data);
                    this.gitHubPostRequest(url_2, jsonData, function () {
                        _this.updatePRs();
                        prTitle.value = "";
                        prBody.value = "";
                    });
                }
            }
        }
    };
    PullRequestPanelComponent.prototype.isValidPR = function (prFrom, prTo, prTitle) {
        var createPRText = document.getElementById("create-pr-text");
        if (prFrom.value === prTo.value) {
            if (createPRText != null) {
                createPRText.innerText = "Pick two different branches!";
            }
            return false;
        }
        else {
            createPRText.innerText = "Create a pull request";
        }
        var prTitleLabel = document.getElementById("new-pr-title");
        if (prTitle.value === "" || prTitle.value == null) {
            if (prTitleLabel != null) {
                prTitleLabel.innerText = "Please enter a title";
            }
            return false;
        }
        else if (prTitleLabel != null) {
            prTitleLabel.innerText = "Title:";
        }
        return true;
    };
    PullRequestPanelComponent.prototype.updatePRs = function () {
        var _this = this;
        this.getPRs(function (prs) {
            _this.populatePRPanel(prs);
        });
        this.getBranches(function (branches) {
            var prTo = document.getElementById("pr-to");
            var prFrom = document.getElementById("pr-from");
            if (prTo != null && prFrom != null) {
                prTo.innerHTML = "";
                prFrom.innerHTML = "";
                branches.forEach(function (branch) {
                    var optionA = document.createElement("option");
                    var optionTextA = document.createTextNode(branch.name);
                    optionA.appendChild(optionTextA);
                    optionA.value = branch.name;
                    prTo.appendChild(optionA);
                    var optionB = document.createElement("option");
                    var optionTextB = document.createTextNode(branch.name);
                    optionB.appendChild(optionTextB);
                    optionB.value = branch.name;
                    prFrom.appendChild(optionB);
                });
            }
        });
    };
    PullRequestPanelComponent.prototype.getPRFileDiff = function (pr) {
        this.gitHubGetRequest(pr.diff_url, function (response) {
            var prDiff = document.getElementById("pr-diff");
            if (prDiff != null) {
                prDiff.innerHTML = Diff2Html.getPrettyHtml(response, { inputFormat: "diff", showFiles: true, matching: "lines" });
            }
        });
    };
    PullRequestPanelComponent.prototype.resetFullPanel = function () {
        var prDiv = document.getElementById("pr-div");
        var prDiff = document.getElementById("pr-diff");
        var prToggleButton = document.getElementById("pr-diff-button");
        if (prDiv != null && prDiff != null && prToggleButton != null) {
            prDiff.style.display = "none";
            prDiv.style.display = "block";
            prToggleButton.textContent = "Show file differences";
            this.isShowingFileDiff = false;
        }
    };
    PullRequestPanelComponent.prototype.togglePRDiff = function () {
        var prDiff = document.getElementById("pr-diff");
        var prContent = document.getElementById("pr-div");
        var prToggleButton = document.getElementById("pr-diff-button");
        if (prDiff != null && prContent != null && prToggleButton != null) {
            if (!this.isShowingFileDiff) {
                prContent.style.display = "none";
                prDiff.style.display = "block";
                prToggleButton.innerText = "Hide file differences";
                this.isShowingFileDiff = true;
            }
            else {
                prContent.style.display = "block";
                prDiff.style.display = "none";
                prToggleButton.textContent = "Show file differences";
                this.isShowingFileDiff = false;
            }
        }
    };
    PullRequestPanelComponent.prototype.halfExtendPRPanel = function () {
        var prPanel = document.getElementById("pull-request-panel");
        var bodyPanel = document.getElementById("body-panel");
        var prListContainer = document.getElementById("pr-list-container");
        var prDisplayPanel = document.getElementById("pr-display-panel");
        if (prPanel != null && bodyPanel != null && prListContainer != null && prDisplayPanel != null) {
            prPanel.style.width = "20%";
            bodyPanel.style.width = "60%";
            prListContainer.style.width = "calc(100% - 60px)";
            prListContainer.style.display = "block";
            prDisplayPanel.style.display = "none";
            this.isShowingPRPanel = true;
        }
        this.resetFullPanel();
    };
    PullRequestPanelComponent.prototype.fullExtendPRPanel = function () {
        var prPanel = document.getElementById("pull-request-panel");
        var bodyPanel = document.getElementById("body-panel");
        var prListContainer = document.getElementById("pr-list-container");
        var prDisplayPanel = document.getElementById("pr-display-panel");
        if (prPanel != null && bodyPanel != null && prListContainer != null && prDisplayPanel != null) {
            var prDiv = document.getElementById("pr-div");
            if (prDiv != null) {
                prDiv.innerHTML = "";
            }
            prPanel.style.width = "80%";
            bodyPanel.style.width = "0%";
            prListContainer.style.width = "25%";
            prDisplayPanel.style.width = "calc(75% - 60px)";
            prDisplayPanel.style.display = "block";
        }
    };
    PullRequestPanelComponent.prototype.getBranches = function (callback) {
        var _this = this;
        this.getRepoOwner(function () {
            var url = _this.apiLink + _this.repoOwner + "/" + _this.repoName + "/branches";
            _this.gitHubGetRequest(url, function (response) {
                callback(response);
            });
        });
    };
    PullRequestPanelComponent.prototype.gitHubGetRequest = function (url, callback) {
        $.ajax({
            url: url,
            type: "GET",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', make_base_auth(getUsername(), getPassword()));
            },
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            },
            success: function (response) {
                callback(response);
            },
            error: function (xhr, status, error) {
                console.log("The XML Http Request of the GitHub API call is: ", xhr);
                console.log("The status of the GitHub API call is: ", status);
                console.log("The error of the GitHub API call is: ", error);
            }
        });
    };
    PullRequestPanelComponent.prototype.gitHubPostRequest = function (url, data, callback) {
        $.ajax({
            url: url,
            type: "POST",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', make_base_auth(getUsername(), getPassword()));
            },
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            },
            contentType: "application/json",
            dataType: "json",
            data: data,
            success: function (response) {
                callback(response);
            },
            error: function (xhr, status, error) {
                console.log("The XML Http Request of the GitHub API call is: ", xhr);
                console.log("The status of the GitHub API call is: ", status);
                console.log("The error of the GitHub API call is: ", error);
            }
        });
    };
    PullRequestPanelComponent.prototype.resetComponent = function () {
        this.hidePRPanel();
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
    };
    PullRequestPanelComponent = __decorate([
        core_1.Component({
            selector: "pull-request-panel",
            templateUrl: "app/components/pullRequestPanel/pull.request.panel.component.html"
        })
    ], PullRequestPanelComponent);
    return PullRequestPanelComponent;
}());
exports.PullRequestPanelComponent = PullRequestPanelComponent;
