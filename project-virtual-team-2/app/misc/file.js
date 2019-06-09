var fileLocation;
function readFromFile(filePath) {
    fileLocation = require("path").join(repoFullPath, filePath);
    var lineReader = require("readline").createInterface({
        input: fs.createReadStream(fileLocation)
    });
    var doc = document.getElementById("diff-panel-body");
    lineReader.on("line", function (line) {
        appendLineToDoc(doc, line);
    });
}
function appendLineToDoc(doc, line) {
    var element = document.createElement("div");
    element.textContent = line;
    doc.appendChild(element);
}
function saveFile() {
    var fileContent = generateFileContent();
    fs.writeFile(fileLocation, fileContent, 'utf8', function (err) {
        if (err)
            throw err;
        saveSuccess();
    });
}
function generateFileContent() {
    var doc = document.getElementById("diff-panel-body");
    var children = doc.childNodes;
    var content = "";
    children.forEach(function (child) {
        content += child.textContent + "\n";
    });
    return content;
}
function saveSuccess() {
    displayModal("File saved!");
}
function cancelEdit() {
    hideDiffPanel();
}
function saveEditedFile(filePath, content, callback) {
    fs.writeFile(filePath, content, callback);
}
