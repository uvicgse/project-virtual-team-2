let fileLocation;

// Function is called to store filePath into fileLocation and open and load fileLocation
// into HTML element diff-panel-body
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

  // Store each line in fileLocation into a new div element in HTML element diff-panel-body
  function appendLineToDoc(doc,line){
    let element = document.createElement("div");
    element.textContent = line;
    doc.appendChild(element);
  }

  // Function is called to save the modified file into the current fileLocation
// The file content that is stored is generated by calling generateFileContent
  function saveFile() {
    let fileContent = generateFileContent();
    fs.writeFile(fileLocation, fileContent, 'utf8', function(err) {
        if (err) throw err;
        saveSuccess();
    });
}

// Function is called to generate a string that contains the contents that will be stored in fileLocation
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

