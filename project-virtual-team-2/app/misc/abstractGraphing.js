var vis = require("vis");
function processAbstract(commits) {
    sortCommits(commits);
    populateAbstract();
}
function populateAbstract() {
    nodeId = 1;
    commitList = [];
    parentCount = {};
    columns = [];
    for (var i = 0; i < commitHistory.length; i++) {
        console.log("plotted" + i + " out of " + commitHistory.length + "commits");
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
    }
    for (var i = 0; i < commitHistory.length; i++) {
        addEdges(commitHistory[i]);
    }
    commitList = commitList.sort(timeCompare);
    reCenter();
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
function getEmail(c) {
    var stringer = c.author().toString().replace(/</, "%").replace(/>/, "%");
    var email = stringer.split("%")[1];
    return email;
}
function makeAbsNode(c, column, count) {
    var id = nodeId++;
    var name = getName(c.author().toString());
    var reference;
    var email = getEmail(c);
    var title = "Author: " + name + "<br>" + "Number of Commits: " + count;
    nodes.add({
        id: id,
        shape: "circularImage",
        title: title,
        image: imageForUser(email),
        physics: false,
        fixed: (id === 1),
        x: (column - 1) * spacingX,
        y: (id - 1) * spacingY,
    });
    commitList.push({
        sha: c.sha(),
        id: id,
        time: c.timeMs(),
        column: column,
        email: email,
        reference: reference,
    });
}
function makeEdge(sha, parentSha) {
    var fromNode = getNodeId(parentSha.toString());
    var toNode = getNodeId(sha);
    edges.add({
        from: fromNode,
        to: toNode
    });
}
