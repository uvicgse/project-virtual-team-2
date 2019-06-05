import * as nodegit from "git";

let vis = require("vis");
let $ = require("jquery");
let options, bsNodes, bsEdges, abNodes, abEdges, nodes, edges, network;
let secP = null, fromNode = null, toNode;

let GraphNodeID = 0;


 
 function returnSelectedNodeValue():number{
    let returnValue = GraphNodeID;
    GraphNodeID = 0;
    return returnValue;
  }
function drawGraph() {
    document.getElementById('spinner').style.display = 'block';
    $('#modal').modal('show');
    bsNodes = new vis.DataSet([]);
    bsEdges = new vis.DataSet([]);

    abNodes = new vis.DataSet([]);
    abEdges = new vis.DataSet([]);

    nodes = new vis.DataSet([]);
    edges = new vis.DataSet([]);

    // create a network
    let container = document.getElementById("my-network");
    container.innerHTML = '';

    let bsData = {
        nodes: bsNodes,
        edges: bsEdges
    }

    let abData = {
        nodes: abNodes,
        edges: abEdges
    }

    let data = {
        nodes: nodes,
        edges: edges
    };

    options = {

        configure: {
            enabled: false,
        },

        edges: {
            arrows: {
                to: {
                    enabled: true,
                    scaleFactor: 0.6
                },
                middle: false,
                from: false,
            },
            color: "#39c0ba",
            hoverWidth: 0,
            physics: false,
            selectionWidth: 0,
            shadow: true,
            smooth: {
                enabled: true,
                type: "cubicBezier",
                // forceDirection: "horizontal",
                roundness: 0.5
            },
            width: 3,
        },

        groups: {},

        interaction: {
            dragNodes: true,
            dragView: true,
            hideEdgesOnDrag: false,
            hideNodesOnDrag: false,
            hover: true,
            hoverConnectedEdges: false,
            keyboard: {
                enabled: false,
                speed: {x: 10, y: 10, zoom: 0.02},
                bindToWindow: true
            },
            multiselect: false,
            navigationButtons: false,
            selectable: true,
            selectConnectedEdges: false,
            tooltipDelay: 300,
            zoomView: true,
        },

        layout: {
            randomSeed: 1,
            improvedLayout: true,
        },

        manipulation: {
            enabled: false,
            initiallyActive: false,
            addNode: true,
            addEdge: true,
            editEdge: true,
            deleteNode: true,
            deleteEdge: true,
            controlNodeStyle: {
                shape: "dot",
                size: 6,
                color: {
                    background: "#39c0ba",
                    border: "#39c0ba",
                    highlight: {
                        background: "#07f968",
                        border: "#3c3c3c"
                    }
                },
                borderWidth: 2,
                borderWidthSelected: 2,
            }
        },

        nodes: {
            borderWidth: 8,
            borderWidthSelected: 8,
            color: {
                border: "#39c0ba",
                background: "#FFF",
                highlight: {
                    border: "#FF0",
                    background: "#FFF"
                },
                hover: {
                    border: "#F00",
                    background: "#FFF"
                },
            },
            shadow: true,
        },

        physics: {
            enabled: false,
        },
    };
    network = new vis.Network(container, bsData, options);
    getAllCommits(function(commits) {
        processGraph(commits);

        network.on("stabilizationIterationsDone", function () {
            network.setOptions({physics: false});
        });

        network.on("doubleClick", function (callback) {
            if (callback.nodes[0] === undefined) {
                return;
            } else {
                let nodeId: number = callback.nodes[0];
            }

            let moveOptions = {
                offset: {x: 0, y: 0},
                scale: 1,
                animation: {
                    duration: 1000,
                    easingFunction: "easeInOutQuad",
                }
            };

            network.focus(callback.nodes[0], moveOptions);
        }, false);

        let flag = "basic";

        network.on("zoom", function (callback) {
            let moveOptions = {
                scale: 1,
                animation: {
                    duration: 1000,
                    easingFunction: "easeInOutQuad",
                }
            };

            if (network.getScale() > 1.5 && callback.direction === '+' && flag === 'abstract') {
                network.setData(data);
                flag = 'node';
                network.fit(moveOptions);
                //network.redraw();
            } else if (network.getScale() < 0.4 && callback.direction === '-' && flag === 'node') {
                network.setData(abData);
                flag = 'abstract';
                network.fit(moveOptions);
                //network.redraw();
            } else if (network.getScale() > 1.5 && callback.direction === '+' && flag === 'basic') {
                network.setData(abData);
                flag = 'abstract';
                network.fit(moveOptions);
            } else if (network.getScale() < 0.4 && callback.direction === '-' && flag === 'abstract') {
                network.setData(bsData);
                flag = 'basic';
                network.fit(moveOptions);
            }
        }, false);

        network.on("animationFinished", function () {
            if (fromNode !== null && secP !== null) {
                let toNode = network.getNodeAt(secP);

                if (fromNode !== toNode && (nodes.get(fromNode)['shape'] === 'box') && (nodes.get(toNode)['shape'] === 'box')) {
                    mergeCommits(nodes.get(fromNode)['title']);
                }
            }
            fromNode = null;
            secP = null;
        });

        network.on('oncontext', function (callback) {
            toNode = network.getNodeAt(callback.pointer.DOM);
            if (flag === 'node' && nodes.get(toNode)['shape'] === 'box') {
                toNode = nodes.get(toNode);
            } else if (flag === 'abstract' && abNodes.get(toNode)['shape'] === 'box') {
                toNode = abNodes.get(toNode);
            } else if (flag === 'basic' && bsNodes.get(toNode)['shape'] === 'box') {
                toNode = bsNodes.get(toNode);
            } else {
                toNode = undefined;
            }
            console.log("toNode:  " + toNode);
        });

        network.on('click', function (properties) {
            if (properties.nodes.length > 0) {
                let clicknode = properties.nodes[0];
                console.log('CLICKNODE');
                
                if (flag === 'node') {
                    clicknode = nodes.get(clicknode);
					displaySelectedCommitDiffPanel(properties.nodes[0]);
                } else if (flag === 'abstract') {
                    clicknode = abNodes.get(clicknode);
                    console.log(clicknode);
                } else if (flag === 'basic') {
                    clicknode = bsNodes.get(clicknode);
                } else {
                    clicknode = undefined;
                }

                if (clicknode != undefined) {
                    // add class to modal for display
                    $("#graphNodeClickModal").addClass('loadTags')
                    let name = clicknode.author.name().toString();
                    let email = clicknode.author.email().toString();
                    // Cache first and last (if exists) commit hash from node to check for tags later
                    document.getElementById("commitHash")!.innerHTML = clicknode.beginningSha;
                    if (clicknode.endingSha) {
                        document.getElementById("commitHashEnd")!.innerHTML = clicknode.endingSha;
                    }
                    document.getElementById("authorModalDetails")!.innerHTML = "Author Name: " + clicknode.author.toString() + "<br>" + "Email: " + email;
                    document.getElementById("authorModalProfileButton")!.onclick = function () {
                        window.open("https://github.com/" + name, "Author Profile");
                    }

                    imageForUser(name, email, function (pic) {
                        document.getElementById("authorModalImage")!.src = pic;
                        $("#graphNodeClickModal").modal('show');
                    })
                }
            }
        })

        network.on("oncontext", function(params) {
    
            if(GraphNodeID != 0){
              GraphNodeID = 0;
            }else{
              //console.log("Please right click and select the appropriate ID");
            }
          });
        
    
        
          network.on("click", function (params) {
              GraphNodeID = parseInt(params.nodes.toString());
              console.log("Graph Node ID is: " + GraphNodeID);
          });
    })
}

function showDiff(commitId): void {
    let commitPanelBody = document.getElementById("commit-diff-panel-body");
    if (commitPanelBody != null) {
      commitPanelBody.innerHTML = "";
      Git.Repository.open(repoFullPath).then(function(repository){
        return repository.getCommit(commitList[commitId-1].sha);
      }).then(function(commit){
        return commit.getDiff()
      }).then(function (arrayDiff) {
        return arrayDiff[0].patches();
      }).then(function (patches) {
        patches.forEach(function (patch) {
          patch.hunks().then(function (hunks) {
            hunks.forEach(function(hunk){
              hunk.lines().then(function(lines){
                let oldFilePath = patch.oldFile().path();
                let newFilePath = patch.newFile().path();
                lines.forEach(function(line){
                  if(line.origin()!=62){
                    line = String.fromCharCode(line.origin())
                      + (line.oldLineno() != -1 ? line.oldLineno() : "")
                      + "\t" + (line.newLineno() != -1 ? line.newLineno() : "")
                      + "\t" + String.fromCharCode(line.origin())
                      + "\t" + line.content();

                    let element = document.createElement("div");
                    element.classList.add("diffChangeText");

                    if (line.charAt(0) === "+") {
                      element.style.backgroundColor = "rgba(132,219,0,0.7)"
                    } else if (line.charAt(0) === "-") {
                      element.style.backgroundColor = "rgba(255,36,72,0.6)";
                    }

                    // If not a changed line, origin will be a space character, so still need to slice
                    line = line.slice(1, line.length);
                    element.textContent = line;

                    // The spacer is needed to pad out the line to highlight the whole row
                    let spacer = document.createElement("spacer");
                    spacer.style.width = commitPanelBody!.scrollWidth+"px";
                    element.appendChild(spacer);
                    commitPanelBody.appendChild(element);
                  }
                })
              })
            })
          })
        })
      });
    }
  }

  function displaySelectedCommitDiffPanel(commitId): void {
    let closeButton = document.getElementById("commit-close");
    if (closeButton != null) {
      closeButton.style.display = "inline";
    }
    let commitPanel = document.getElementById("selected-commit-diff-panel");
    console.log("inside display selected commit");
    if (commitPanel != null) {
      commitPanel.style.height = "100vh";
      commitPanel.style.width = "100vw";
      commitPanel.style.zIndex = "10";
    }

    let bodyPanel = document.getElementById("commit-diff-panel-body");
    if (bodyPanel != null) {
      bodyPanel.style.display = "block";
    }
    showDiff(commitId);

    let footer = document.getElementById("footer");
    if (footer != null) {
      footer.hidden = true;
    }

    let editorPanel = document.getElementById("editor-panel");
    if (editorPanel != null){
      editorPanel.hidden = true;
    }
  }
