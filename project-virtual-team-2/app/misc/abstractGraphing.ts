let vis = require("vis");

function processAbstract(commits: nodegit.Commit[]) {
  sortCommits(commits);
  populateAbstract();
}

function populateAbstract() {
  // reset variables for idempotency, shouldn't be needed when a class is created instead
  nodeId = 1;
  commitList = [];
  parentCount = {};
  columns = [];
  // Sort
  // commitHistory = commits.sort(function(a, b) {
  //   return a.timeMs() - b.timeMs();
  // });

  // Plot the graph
  for (let i = 0; i < commitHistory.length; i++) {
    console.log("plotted" + i + " out of " + commitHistory.length + "commits");
    let parents: string[] = commitHistory[i].parents();
    let nodeColumn;
    for (let j = 0; j < parents.length; j++) {
      let parent = parents[j];
      if (!(parent in parentCount)) {
        parentCount[parent] = 1;
      } else {
        parentCount[parent]++;
      }
    }
    if (parents.length === 0) {
      // no parents means first commit so assign the first column
      columns[0] = true;
      nodeColumn = 0;
    } else if (parents.length === 1) {
      let parent = parents[0];
      let parentId = getNodeId(parent.toString());
      let parentColumn = commitList[parentId - 1]["column"];
      if (parentCount[parent] === 1) {
        // first child
        nodeColumn = parentColumn;
      } else {
        nodeColumn = nextFreeColumn(parentColumn);
      }
    } else {
      let desiredColumn: number = -1;
      let desiredParent: string = "";
      let freeableColumns: number[] = [];

      for (let j = 0; j < parents.length; j++) {
        let parent: string = parents[j];
        let parentId = getNodeId(parent.toString());
        let proposedColumn = commitList[parentId - 1]["column"];

        if (desiredColumn === -1 || desiredColumn > proposedColumn) {
          desiredColumn = proposedColumn;
          desiredParent = parent;
        } else {
          freeableColumns.push(proposedColumn);
        }

      }
      for (let k = 0; k < freeableColumns.length; k++) {
        let index = freeableColumns[k];
        columns[index] = false;
      }
      if (parentCount[desiredParent] === 1) {
        // first child
        nodeColumn = desiredColumn;
      } else {
        nodeColumn = nextFreeColumn(desiredColumn);
      }
    }

    makeNode(commitHistory[i], nodeColumn);
  }

  // Add edges
  for (let i = 0; i < commitHistory.length; i++) {
    addEdges(commitHistory[i]);
  }

  commitList = commitList.sort(timeCompare);
  reCenter();
}

function addEdges(c) {
  let parents = c.parents();
  if (parents.length !== 0) {
    parents.forEach(function(parent) {
      let sha: string = c.sha();
      let parentSha: string = parent.toString();
      makeEdge(sha, parentSha);
    });
  }
}

function getEmail(c) {
  let stringer = c.author().toString().replace(/</, "%").replace(/>/, "%");
  let email = stringer.split("%")[1];
  return email;
}

function makeAbsNode(c, column: number, count:number) {
  let id = nodeId++;
  let name = getName(c.author().toString());
  let reference;
  let email = getEmail(c);
  let title = "Author: " + name + "<br>" + "Number of Commits: " + count;
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

function makeEdge(sha: string, parentSha: string) {
  let fromNode = getNodeId(parentSha.toString());
  let toNode = getNodeId(sha);

  edges.add({
    from: fromNode,
    to: toNode
  });
}
