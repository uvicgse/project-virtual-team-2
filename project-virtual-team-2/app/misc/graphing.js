"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var nodeId = 1;
var absNodeId = 1;
var basicNodeId = 1;
var abstractList = [];
var basicList = [];
var bDict = {};
var commitHistory = [];
var commitList = [];
var spacingY = 100;
var spacingX = 80;
var parentCount = {};
var columns = [];
var edgeDic = {};
var numOfCommits = 0;
var branchIds = {};
function processGraph(commits) {
    var promise = new Promise(function (resolve, reject) {
        commitHistory = [];
        numOfCommits = commits.length;
        sortCommits(commits)
            .then(makeBranchColor)
            .then(populateCommits)
            .then(function (data) {
            var textBox = document.getElementById("modal-text-box");
            if (textBox != null) {
                document.getElementById('spinner').style.display = 'none';
            }
            else {
                console.log("Modal-text-box is missing");
            }
        });
    });
    return promise;
}
function sortCommits(commits) {
    var promise = new Promise(function (resolve, reject) {
        var chunk = 100;
        function computeChunk() {
            var count = chunk;
            while (commits.length > 0 && count--) {
                var commit = commits.shift();
                var parents = commit.parents();
                if (parents === null || parents.length === 0) {
                    commitHistory.push(commit);
                }
                else {
                    var count_1 = 0;
                    for (var i = 0; i < parents.length; i++) {
                        var psha = parents[i].toString();
                        for (var j = 0; j < commitHistory.length; j++) {
                            if (commitHistory[j].toString() === psha) {
                                count_1++;
                                break;
                            }
                        }
                        if (count_1 < i + 1) {
                            break;
                        }
                    }
                    if (count_1 === parents.length) {
                        commitHistory.push(commit);
                    }
                    else {
                        commits.push(commit);
                    }
                }
            }
            if (commits.length > 0) {
                setTimeout(computeChunk, 1);
            }
            else {
                resolve();
            }
        }
        computeChunk();
    });
    return promise;
}
function populateCommits(oldResult) {
    var promise = new Promise(function (resolve, reject) {
        nodeId = 1;
        absNodeId = 1;
        basicNodeId = 1;
        commitList = [];
        parentCount = {};
        columns = [];
        for (var i = 0; i < commitHistory.length; i++) {
            var parents = commitHistory[i].parents();
            var nodeColumn = void 0;
            for (var j = 0; j < parents.length; j++) {
                var parent_1 = parents[j];
                if (!(parent_1 in parentCount)) {
                    parentCount[parent_1] = 1;
                }
                else {
                    parentCount[parent_1]++;
                }
            }
            if (parents.length === 0) {
                columns[0] = true;
                nodeColumn = 0;
            }
            else if (parents.length === 1) {
                var parent_2 = parents[0];
                var parentId = getNodeId(parent_2.toString());
                var parentColumn = commitList[parentId - 1]["column"];
                if (parentCount[parent_2] === 1) {
                    nodeColumn = parentColumn;
                }
                else {
                    nodeColumn = nextFreeColumn(parentColumn);
                }
            }
            else {
                var desiredColumn = -1;
                var desiredParent = "";
                var freeableColumns = [];
                for (var j = 0; j < parents.length; j++) {
                    var parent_3 = parents[j];
                    var parentId = getNodeId(parent_3.toString());
                    var proposedColumn = commitList[parentId - 1]["column"];
                    if (desiredColumn === -1 || desiredColumn > proposedColumn) {
                        desiredColumn = proposedColumn;
                        desiredParent = parent_3;
                    }
                    else {
                        freeableColumns.push(proposedColumn);
                    }
                }
                for (var k = 0; k < freeableColumns.length; k++) {
                    var index = freeableColumns[k];
                    columns[index] = false;
                }
                if (parentCount[desiredParent] === 1) {
                    nodeColumn = desiredColumn;
                }
                else {
                    nodeColumn = nextFreeColumn(desiredColumn);
                }
            }
            makeNode(commitHistory[i], nodeColumn);
            makeAbsNode(commitHistory[i], nodeColumn);
            makeBasicNode(commitHistory[i], nodeColumn);
        }
        for (var i = 0; i < commitHistory.length; i++) {
            addEdges(commitHistory[i]);
        }
        for (var i = 0; i < abstractList.length; i++) {
            addAbsEdge(abstractList[i]);
        }
        for (var i = 0; i < basicList.length; i++) {
            addBasicEdge(basicList[i]);
        }
        sortBasicGraph();
        commitList = commitList.sort(timeCompare);
        reCenter();
        resolve(oldResult);
    });
    return promise;
}
function timeCompare(a, b) {
    return a.time - b.time;
}
function nextFreeColumn(column) {
    while (columns[column] === true) {
        column++;
    }
    return column;
}
function addEdges(c) {
    var parents = c.parents();
    if (parents.length !== 0) {
        parents.forEach(function (parent) {
            var sha = c.sha();
            var parentSha = parent.toString();
            makeEdge(sha, parentSha);
        });
    }
}
function addAbsEdge(c) {
    var parents = c['parents'];
    for (var i = 0; i < parents.length; i++) {
        for (var j = 0; j < abstractList.length; j++) {
            if (abstractList[j]['sha'].indexOf(parents[i].toString()) > -1) {
                abEdges.add({
                    from: abstractList[j]['id'],
                    to: c['id']
                });
            }
        }
    }
}
function addBasicEdge(c) {
    var flag = true;
    var parents = c['parents'];
    edgeDic[c['id']] = [];
    for (var i = 0; i < parents.length; i++) {
        for (var j = 0; j < basicList.length; j++) {
            if (basicList[j]['sha'].indexOf(parents[i].toString()) > -1 && basicList[j] !== c) {
                flag = false;
                bsEdges.add({
                    from: basicList[j]['id'],
                    to: c['id']
                });
                edgeDic[c['id']].push(basicList[j]['id']);
            }
        }
    }
}
function sortBasicGraph() {
    var tmp = basicList;
    var idList = [];
    while (tmp.length > 0) {
        var n = tmp.shift();
        var ta = edgeDic[n.id];
        var count = 0;
        for (var i = 0; i < ta.length; i++) {
            for (var j = 0; j < idList.length; j++) {
                if (idList[j].toString() === ta[i].toString()) {
                    count++;
                }
            }
            if (count < i + 1) {
                break;
            }
        }
        if (count === ta.length) {
            idList.push(n.id);
        }
        else {
            tmp.push(n);
        }
    }
    for (var i = 0; i < idList.length; i++) {
        bsNodes.update({ id: idList[i], y: i * spacingY });
        if (idList[i] in branchIds) {
            bsNodes.update({ id: branchIds[idList[i]], y: (i + 0.7) * spacingY });
        }
    }
}
function makeBranchColor(oldResult) {
    var promise = new Promise(function (resolve, reject) {
        var bcList = [];
        for (var i = 0; i < commitHistory.length; i++) {
            if (commitHistory[i].toString() in bname) {
                bcList.push({
                    oid: commitHistory[i],
                    cid: i
                });
            }
        }
        var chunk = 10;
        function computeChunk() {
            var count = chunk;
            while (bcList.length > 0 && count--) {
                var commit = bcList.pop();
                var oid = commit.oid.toString();
                var cid = commit.cid;
                if (oid in bDict) {
                    bDict[oid].push(cid);
                }
                else {
                    bDict[oid] = [cid];
                }
                var parents = commit.oid.parents();
                for (var i = 0; i < parents.length; i++) {
                    for (var j = 0; j < commitHistory.length; j++) {
                        if (commitHistory[j].toString() === parents[i].toString()) {
                            bcList.push({
                                oid: commitHistory[j],
                                cid: cid
                            });
                        }
                    }
                }
            }
            if (bcList.length > 0) {
                setTimeout(computeChunk, 1);
            }
            else {
                resolve(oldResult);
            }
        }
        computeChunk();
    });
    return promise;
}
function makeBasicNode(c, column) {
    var reference;
    var name = getName(c.author().toString());
    var stringer = c.author().toString().replace(/</, "%").replace(/>/, "%");
    var flag = true;
    var count = 1;
    var id;
    var colors1 = JSON.stringify(bDict[c.toString()]);
    for (var i = 0; i < basicList.length; i++) {
        var colors2 = JSON.stringify(basicList[i]['colors']);
        if (colors1 === colors2) {
            flag = false;
            id = basicList[i]['id'];
            basicList[i]['count'] += 1;
            count = basicList[i]['count'];
            bsNodes.update({ id: i + 1, title: "Number of Commits: " + count });
            basicList[i]['sha'].push(c.toString());
            basicList[i]['parents'] = basicList[i]['parents'].concat(c.parents());
            break;
        }
    }
    if (flag) {
        id = basicNodeId++;
        var title = "Number of Commits: " + count;
        bsNodes.add({
            id: id,
            shape: "circularImage",
            title: title,
            image: img4User(name),
            physics: false,
            fixed: false,
            x: (column - 1) * spacingX,
            y: (id - 1) * spacingY,
            author: c.author()
        });
        var shaList = [];
        shaList.push(c.toString());
        basicList.push({
            sha: shaList,
            id: id,
            time: c.timeMs(),
            column: column,
            colors: bDict[c.toString()],
            reference: reference,
            parents: c.parents(),
            count: 1,
        });
    }
    if (c.toString() in bname) {
        for (var i = 0; i < bname[c.toString()].length; i++) {
            var branchName = bname[c.toString()][i];
            var bp = branchName.name().split("/");
            var shortName = bp[bp.length - 1];
            console.log(shortName + " sub-branch: " + branchName.isHead().toString());
            if (branchName.isHead()) {
                shortName = "*" + shortName;
            }
            bsNodes.add({
                id: id + numOfCommits * (i + 1),
                shape: "box",
                title: branchName,
                label: shortName,
                physics: false,
                fixed: false,
                x: (column - 0.6 * (i + 1)) * spacingX,
                y: (id - 0.3) * spacingY,
            });
            bsEdges.add({
                from: id + numOfCommits * (i + 1),
                to: id
            });
            branchIds[id] = id + numOfCommits * (i + 1);
        }
    }
}
function makeAbsNode(c, column) {
    var reference;
    var name = getName(c.author().toString());
    var stringer = c.author().toString().replace(/</, "%").replace(/>/, "%");
    var email = stringer.split("%")[1];
    var flag = true;
    var count = 1;
    if (c.parents().length === 1) {
        var cp = c.parents()[0].toString();
        for (var i = 0; i < abstractList.length; i++) {
            var index = abstractList[i]['sha'].indexOf(cp);
            if (index > -1 && abstractList[i]['email'] === email && abstractList[i]['column'] === column && !(c.toString() in bname)) {
                flag = false;
                abstractList[i]['count'] += 1;
                count = abstractList[i]['count'];
                abstractList[i]['sha'].push(c.toString());
                abNodes.update({ id: i + 1, title: "Author: " + name + "<br>" + "Number of Commits: " + count });
                break;
            }
        }
    }
    if (flag) {
        var id = absNodeId++;
        var title = "Author: " + name + "<br>" + "Number of Commits: " + count;
        abNodes.add({
            id: id,
            shape: "circularImage",
            title: title,
            image: img4User(name),
            physics: false,
            fixed: false,
            x: (column - 1) * spacingX,
            y: (id - 1) * spacingY,
            author: c.author()
        });
        if (c.toString() in bname) {
            for (var i = 0; i < bname[c.toString()].length; i++) {
                var branchName = bname[c.toString()][i];
                var bp = branchName.name().split("/");
                var shortName = bp[bp.length - 1];
                console.log(shortName + " sub-branch: " + branchName.isHead().toString());
                if (branchName.isHead()) {
                    shortName = "*" + shortName;
                }
                abNodes.add({
                    id: id + numOfCommits * (i + 1),
                    shape: "box",
                    title: branchName,
                    label: shortName,
                    physics: false,
                    fixed: false,
                    x: (column - 0.6 * (i + 1)) * spacingX,
                    y: (id - 0.3) * spacingY,
                });
                abEdges.add({
                    from: id + numOfCommits * (i + 1),
                    to: id
                });
            }
        }
        var shaList = [];
        shaList.push(c.toString());
        abstractList.push({
            sha: shaList,
            id: id,
            time: c.timeMs(),
            column: column,
            email: email,
            reference: reference,
            parents: c.parents(),
            count: 1,
        });
    }
}
function makeNode(c, column) {
    var id = nodeId++;
    var reference;
    var name = getName(c.author().toString());
    var stringer = c.author().toString().replace(/</, "%").replace(/>/, "%");
    var email = stringer.split("%")[1];
    var title = "Author: " + name + "<br>" + "Message: " + c.message();
    var flag = false;
    nodes.add({
        id: id,
        shape: "circularImage",
        title: title,
        image: img4User(name),
        physics: false,
        fixed: false,
        x: (column - 1) * spacingX,
        y: (id - 1) * spacingY,
        author: c.author()
    });
    if (c.toString() in bname) {
        for (var i = 0; i < bname[c.toString()].length; i++) {
            var branchName = bname[c.toString()][i];
            var bp = branchName.name().split("/");
            var shortName = bp[bp.length - 1];
            console.log(shortName + " sub-branch: " + branchName.isHead().toString());
            if (branchName.isHead()) {
                shortName = "*" + shortName;
            }
            nodes.add({
                id: id + numOfCommits * (i + 1),
                shape: "box",
                title: branchName,
                label: shortName,
                physics: false,
                fixed: false,
                x: (column - 0.6 * (i + 1)) * spacingX,
                y: (id - 0.3) * spacingY,
            });
            edges.add({
                from: id + numOfCommits * (i + 1),
                to: id
            });
        }
        flag = true;
    }
    commitList.push({
        sha: c.sha(),
        id: id,
        time: c.timeMs(),
        column: column,
        email: email,
        reference: reference,
        branch: flag,
    });
    console.log("commit: " + id + ", message: " + commitList[id - 1]['id']);
}
function makeEdge(sha, parentSha) {
    var fromNode = getNodeId(parentSha.toString());
    var toNode = getNodeId(sha);
    edges.add({
        from: fromNode,
        to: toNode
    });
}
function getNodeId(sha) {
    for (var i = 0; i < commitList.length; i++) {
        var c = commitList[i];
        if (c["sha"] === sha) {
            return c["id"];
        }
    }
}
function reCenter() {
    var moveOptions = {
        offset: { x: -150, y: 200 },
        scale: 1,
        animation: {
            duration: 1000,
            easingFunction: "easeInOutQuad",
        }
    };
    network.focus(commitList[commitList.length - 1]["id"], moveOptions);
}
