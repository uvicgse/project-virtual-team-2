let fileLocation;

function readFromFile(filePath) {
    fileLocation = require("path").join(repoFullPath, filePath);

    let lineReader = require("readline").createInterface({
      input: fs.createReadStream(fileLocation)
    });

    let doc = document.getElementById("diff-panel-body");
    lineReader.on("line", function (line) {
      appendLineToDoc(doc,line);
    });
  }

  function appendLineToDoc(doc,line){
    let element = document.createElement("div");
    element.textContent = line;
    doc.appendChild(element);
  }

  function saveFile() {
    let fileContent = generateFileContent();
    fs.writeFile(fileLocation, fileContent, 'utf8', function(err) {
        if (err) throw err;
        saveSuccess();
    });
}

function generateFileContent(){
    let doc = document.getElementById("diff-panel-body");
    let children = doc.childNodes;
    
    let content = "";
    children.forEach(function (child) {
        content += child.textContent + "\n";
    });
    return content;
}

function saveSuccess(){
    displayModal("File saved!");
}

function cancelEdit(){
    hideDiffPanel();
}

function saveEditedFile(filePath: string, content: string, callback: any): void {
    fs.writeFile(filePath, content, callback);
}

