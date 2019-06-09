var pageTitles = {};
var path = require('path');
var wikiPath = "";
var wikiContent = [];
var openDisabled = true;
function openWiki() {
    if (openDisabled) {
        return;
    }
    var wikis = document.getElementById("wiki-panel");
    wikis.style.width = "100vw";
    wikis.style.height = "100vh";
    wikis.style.zIndex = "15";
    console.log(repoFullPath);
    if (!fs.existsSync(repoFullPath + "\\wiki")) {
        cloneWiki();
    }
    else {
        findPageNames(repoFullPath + "\\wiki", displayWiki);
    }
    var externalLinkButton = document.getElementById("wikiLinkButton");
    console.log(getWikiUrl());
    externalLinkButton.setAttribute("href", getWikiUrl() + "/wiki");
}
function cloneWiki() {
    options = {
        fetchOpts: {
            callbacks: {
                certificateCheck: function () {
                    return 1;
                },
                credentials: function () {
                    return cred;
                }
            }
        }
    };
    var cloneUrl = getWikiUrl() + ".wiki.git";
    var wikiPath = repoFullPath + "\\wiki";
    console.log("The wiki path is: ", wikiPath);
    var repository = Git.Clone.clone(cloneUrl, wikiPath, options)
        .then(function (repository) {
        console.log("Wiki successfully cloned");
        findPageNames(wikiPath, displayWiki);
    }, function (err) {
        updateModalText("Clone Failed. Wiki does not exist for this repository or you do not have permission to access the wiki. ");
        console.log("repo.ts, line 64, failed to clone repo: " + err);
        switchToAddRepositoryPanel();
    });
}
function findPageNames(wikiPath, callback) {
    var EXTENSION = '.md';
    wikiContent = [];
    fs.readdir(wikiPath, function (err, files) {
        console.log("The items are: ", files);
        var files = files.filter(function (file) {
            return path.extname(file).toLowerCase() === EXTENSION;
        });
        files.forEach(function (file) {
            var page = {
                pageName: file.replace(/-/g, ' ').replace('.md', ''),
                pageContent: readFileContents(wikiPath + "\\" + file)
            };
            wikiContent.push(page);
        });
        callback();
    });
}
function readFileContents(wikiDirectory) {
    var markdownFile = readFile.read(wikiDirectory, null);
    return markdownFile;
}
function displayWiki() {
    var marked = require('marked');
    var wiki_page_counter = 0;
    var wiki_content = document.getElementById("wiki-content");
    while (wiki_content.firstChild) {
        wiki_content.removeChild(wiki_content.firstChild);
    }
    console.log("The entire content is: ", wikiContent);
    wikiContent.forEach(function (page) {
        var wiki_title_template = document.createElement("div");
        wiki_title_template.className = "panel panel-default";
        var panel_heading = document.createElement("div");
        panel_heading.className = "panel-heading";
        panel_heading.setAttribute("data-toggle", "collapse");
        panel_heading.setAttribute("href", "#" + "wiki-" + wiki_page_counter);
        panel_heading.innerHTML = page.pageName;
        var panel_body = document.createElement("div");
        panel_body.className = "panel-body collapse";
        panel_body.id = "wiki-" + wiki_page_counter;
        panel_body.innerHTML = marked(page.pageContent);
        wiki_title_template.appendChild(panel_heading);
        wiki_title_template.appendChild(panel_body);
        wiki_content.appendChild(wiki_title_template);
        wiki_page_counter++;
    });
}
function updateWiki() {
    var localWikiPath = repoFullPath + "\\wiki";
    var repository;
    var theirCommit;
    Git.Repository.open(localWikiPath)
        .then(function (repo) {
        repository = repo;
        console.log("Pulling new changes from the remote repository");
        addCommand("git pull");
        displayModal("Pulling new changes from the remote repository");
        return repository.fetchAll({
            callbacks: {
                credentials: function () {
                    return Git.Cred.userpassPlaintextNew(getUsernameTemp(), getPasswordTemp());
                },
                certificateCheck: function () {
                    return 1;
                }
            }
        });
    })
        .then(function () {
        return Git.Reference.nameToId(repository, "refs/remotes/origin/master");
    })
        .then(function (oid) {
        console.log("Looking up commit with id " + oid + " in all wiki repositories");
        return Git.AnnotatedCommit.lookup(repository, oid);
    }, function (err) {
        console.log("Error is " + err);
    })
        .then(function (annotated) {
        console.log("merging " + annotated + "with local forcefully");
        Git.Merge.merge(repository, annotated, null, {
            checkoutStrategy: Git.Checkout.STRATEGY.FORCE,
        });
        theirCommit = annotated;
    });
}
function getWikiUrl() {
    if (readFile.exists(repoFullPath + "/.git/config")) {
        var gitConfigFileText = readFile.read(repoFullPath + "/.git/config", null);
        var searchString = "[remote \"origin\"]";
        gitConfigFileText = gitConfigFileText.substr(gitConfigFileText.indexOf(searchString) + searchString.length, gitConfigFileText.length);
        gitConfigFileText = gitConfigFileText.substr(gitConfigFileText.indexOf("url = "), gitConfigFileText.lastIndexOf("."));
        gitConfigFileText = gitConfigFileText.replace(/ /g, "")
            .replace("url", "")
            .replace("=", "");
        if (gitConfigFileText.includes(".g")) {
            gitConfigFileText = gitConfigFileText.replace(".g", "");
        }
        var gitConfigFileSubstrings = gitConfigFileText.split('/');
        if (gitConfigFileSubstrings[0].indexOf("@") != -1) {
            gitConfigFileSubstrings[0] = gitConfigFileSubstrings[0].substring(gitConfigFileSubstrings[0].indexOf(":") + 1);
        }
        var owner = gitConfigFileSubstrings[gitConfigFileSubstrings.length - 2];
        var nameOfRepository = gitConfigFileSubstrings[gitConfigFileSubstrings.length - 1];
        var wikiUrl = "https://github.com/" + owner + "/" + nameOfRepository;
        return wikiUrl;
    }
}
