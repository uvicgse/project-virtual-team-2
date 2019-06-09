"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var TextEditorComponent = (function () {
    function TextEditorComponent() {
        this.cutPastePressed = false;
        this.numberOfSpacesToIndent = 4;
        this.latestFileId = 0;
        this.currentFileId = 0;
        this.filePaths = [""];
    }
    TextEditorComponent.prototype.openFile = function () {
        var fileOpenInput = document.getElementById("file-upload");
        if (fileOpenInput != null) {
            fileOpenInput.click();
        }
    };
    TextEditorComponent.prototype.newFileUpload = function () {
        var _this = this;
        var reader = new FileReader();
        var fileOpenInput = document.getElementById("file-upload");
        if (fileOpenInput != null) {
            var files_1 = fileOpenInput.files;
            if (files_1 != null) {
                reader.onload = function (e) {
                    _this.latestFileId++;
                    _this.createFileEditor();
                    var fileTextArea = document.getElementById("file-text-area-" + _this.latestFileId);
                    if (fileTextArea != null && reader.result != null) {
                        fileTextArea.value = reader.result;
                        _this.createLineNumbers();
                        var file_1 = files_1[0];
                        _this.filePaths[_this.latestFileId] = file_1.path;
                        _this.createFileTab(file_1.name);
                        _this.currentFileId = _this.latestFileId;
                    }
                };
                reader.readAsText(files_1[0]);
            }
        }
    };
    TextEditorComponent.prototype.closeEditor = function () {
        var editor = document.getElementById("editor-panel");
        editor.style.height = "0vh";
        editor.style.width = "0vw";
        editor.style.zIndex = "-10";
        var inputFile = document.getElementById("file-upload");
        if (inputFile != null) {
            inputFile.value = "";
        }
        var fileTabs = document.getElementById("file-tab");
        fileTabs.innerHTML = "";
        var fileEditors = document.getElementById("file-editors");
        fileEditors.innerHTML = "";
        this.currentKey = "";
        this.cutPastePressed = false;
        this.changingLines = false;
        this.latestFileId = 0;
        this.currentFileId = 0;
        this.filePaths = [""];
    };
    TextEditorComponent.prototype.hideEditor = function () {
        var editor = document.getElementById("editor-panel");
        editor.style.height = "0vh";
        editor.style.width = "0vw";
        editor.style.zIndex = "-10";
    };
    TextEditorComponent.prototype.switchTab = function (fileTabId, fileId) {
        this.currentFileId = parseInt(fileId);
        var i = 0;
        var tabcontent;
        var tablinks;
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }
        var fileIdElement = document.getElementById(fileId);
        if (fileIdElement != null) {
            fileIdElement.style.display = "block";
            var selectedTab = document.getElementById(fileTabId);
            selectedTab.className += " active";
        }
        this.createLineNumbers();
    };
    TextEditorComponent.prototype.scrollSync = function () {
        var lineTextArea = document.getElementById("line-text-area-" + this.currentFileId);
        var fileTextArea = document.getElementById("file-text-area-" + this.currentFileId);
        if (lineTextArea != null && fileTextArea != null) {
            lineTextArea.scrollTop = fileTextArea.scrollTop;
        }
    };
    TextEditorComponent.prototype.createLineNumbers = function () {
        if (this.changingLines) {
            return;
        }
        this.changingLines = true;
        var i = 0;
        var lineNumberString = '';
        var lineTextArea = document.getElementById("line-text-area-" + this.currentFileId);
        var fileTextArea = document.getElementById("file-text-area-" + this.currentFileId);
        if (lineTextArea != null && fileTextArea != null) {
            var fileText = fileTextArea.value;
            var numberOfLineBreaks = (fileText.match(/\n/g) || []).length;
            for (i = 0; i < numberOfLineBreaks + 1; i++) {
                lineNumberString = lineNumberString + (i + '\r\n');
            }
            lineTextArea.value = lineNumberString;
        }
        this.changingLines = false;
    };
    TextEditorComponent.prototype.keyPressed = function (event) {
        this.currentKey = event.key;
        if (event.key == "Tab") {
            event.preventDefault();
            var fileTextArea = document.getElementById("file-text-area-" + this.currentFileId);
            var selectionStart = fileTextArea.selectionStart;
            var selectionEnd = fileTextArea.selectionEnd;
            if (selectionStart != null && selectionEnd != null) {
                fileTextArea.value = fileTextArea.value.substring(0, selectionStart) + " ".repeat(this.numberOfSpacesToIndent) + fileTextArea.value.substring(selectionEnd);
                fileTextArea.selectionStart = fileTextArea.selectionEnd = selectionStart + this.numberOfSpacesToIndent;
            }
        }
        else if (event.ctrlKey || event.metaKey) {
            if (event.key == "s") {
                event.preventDefault();
                this.saveFile();
            }
        }
    };
    TextEditorComponent.prototype.valueChanged = function () {
        if (this.currentKey == "Enter" || this.currentKey == "Backspace" || this.currentKey == "Delete" || this.cutPastePressed) {
            this.createLineNumbers();
            this.cutPastePressed = false;
        }
        var saveButton = document.getElementById("save-button");
        if (saveButton != null) {
            saveButton.innerHTML = "Save";
        }
        var fileTab = document.getElementById("tab-link-" + this.currentFileId);
        if (fileTab.innerHTML.slice(-1) != "*") {
            fileTab.innerHTML += " *";
        }
    };
    TextEditorComponent.prototype.updateIndentAmount = function () {
        var selector = document.getElementById("selected-indent");
        this.numberOfSpacesToIndent = parseInt(selector.value);
    };
    TextEditorComponent.prototype.saveFile = function () {
        var saveButton = document.getElementById("save-button");
        if (saveButton != null) {
            saveButton.innerHTML = "Saving...";
        }
        var fileTextArea = document.getElementById("file-text-area-" + this.currentFileId);
        if (fileTextArea != null) {
            saveEditedFile(this.filePaths[this.currentFileId], fileTextArea.value, this.saveSuccess);
            var fileTab = document.getElementById("tab-link-" + this.currentFileId);
            if (fileTab.innerHTML.slice(-1) == "*") {
                fileTab.innerHTML = fileTab.innerHTML.substr(0, fileTab.innerHTML.indexOf(" *"));
            }
        }
        else if (saveButton != null) {
            saveButton.innerHTML = "Save";
        }
    };
    TextEditorComponent.prototype.saveSuccess = function (err) {
        if (err) {
            displayModal("An error occured when saving, please try again.");
            console.log(err);
        }
        else {
            var saveButton = document.getElementById("save-button");
            if (saveButton != null) {
                saveButton.innerHTML = "Saved";
            }
        }
    };
    TextEditorComponent.prototype.createFileTab = function (fileName) {
        var _this = this;
        var tabs = document.getElementById("file-tab");
        var newTab = document.createElement("button");
        newTab.className = "tablinks";
        newTab.id = "tab-link-" + this.latestFileId;
        var closingTab = false;
        var id = "" + this.latestFileId;
        var closeIcon = document.createElement("i");
        closeIcon.className = "fa fa-times";
        closeIcon.onclick = function (e) {
            closingTab = true;
            var fileEditor = document.getElementById(id);
            fileEditor.remove();
            newTab.remove();
        };
        closeIcon.style.marginLeft = "5px";
        newTab.innerHTML = fileName;
        newTab.appendChild(closeIcon);
        var fileTabId = "tab-link-" + this.latestFileId;
        var fileId = "" + this.latestFileId;
        newTab.onclick = function (e) {
            if (!closingTab) {
                _this.switchTab(fileTabId, fileId);
            }
        };
        tabs.appendChild(newTab);
        this.switchTab("tab-link-" + this.latestFileId, "" + this.latestFileId);
    };
    TextEditorComponent.prototype.createFileEditor = function () {
        var _this = this;
        var editors = document.getElementById("file-editors");
        var newEditorDiv = document.createElement("div");
        newEditorDiv.id = "" + this.latestFileId;
        newEditorDiv.className = "tabcontent";
        var newEditorArea = document.createElement("div");
        newEditorArea.className = "editor-area";
        var lineTextArea = document.createElement("textarea");
        lineTextArea.className = "lines";
        lineTextArea.readOnly = true;
        lineTextArea.id = "line-text-area-" + this.latestFileId;
        var fileTextArea = document.createElement("textarea");
        fileTextArea.className = "file";
        fileTextArea.id = "file-text-area-" + this.latestFileId;
        fileTextArea.onclick = function (e) {
            _this.createLineNumbers();
        };
        fileTextArea.onscroll = function (e) {
            _this.scrollSync();
        };
        fileTextArea.onkeydown = function (e) {
            _this.keyPressed(e);
        };
        fileTextArea.oninput = function (e) {
            _this.valueChanged();
        };
        fileTextArea.oncut = function (e) {
            _this.cutPastePressed = true;
        };
        fileTextArea.oncut = function (e) {
            _this.cutPastePressed = true;
        };
        newEditorArea.appendChild(lineTextArea);
        newEditorArea.appendChild(fileTextArea);
        newEditorDiv.appendChild(newEditorArea);
        editors.appendChild(newEditorDiv);
    };
    TextEditorComponent.prototype.openDiffFile = function (fileName, filePath, fileContents) {
        this.latestFileId++;
        this.createFileEditor();
        var fileTextArea = document.getElementById("file-text-area-" + this.latestFileId);
        if (fileTextArea != null) {
            fileTextArea.value = fileContents;
            this.createLineNumbers();
            this.filePaths[this.latestFileId] = filePath;
            this.createFileTab(fileName);
            this.currentFileId = this.latestFileId;
        }
    };
    TextEditorComponent = __decorate([
        core_1.Component({
            selector: "editor-panel",
            templateUrl: "app/components/textEditor/text.editor.component.html"
        })
    ], TextEditorComponent);
    return TextEditorComponent;
}());
exports.TextEditorComponent = TextEditorComponent;
