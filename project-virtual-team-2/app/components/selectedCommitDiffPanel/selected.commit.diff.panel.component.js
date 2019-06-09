"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var selectedCommitDiffPanelComponent = (function () {
    function selectedCommitDiffPanelComponent() {
    }
    selectedCommitDiffPanelComponent.prototype.closeSelectedCommitDiffPanel = function () {
        var commitPanel = document.getElementById("selected-commit-diff-panel");
        var myNode = document.getElementById("commit-diff-panel-body");
        if (myNode != null) {
            while (myNode.firstChild) {
                myNode.removeChild(myNode.firstChild);
            }
        }
        commitPanel.style.height = "0vh";
        commitPanel.style.width = "0vw";
        commitPanel.style.zIndex = "-10";
        var footer = document.getElementById("footer");
        if (footer != null) {
            footer.hidden = false;
        }
        var editorPanel = document.getElementById("editor-panel");
        if (editorPanel != null) {
            editorPanel.hidden = false;
        }
    };
    selectedCommitDiffPanelComponent = __decorate([
        core_1.Component({
            selector: "selected-commit-diff-panel",
            templateUrl: "app/components/selectedCommitDiffPanel/selected.commit.diff.panel.component.html"
        })
    ], selectedCommitDiffPanelComponent);
    return selectedCommitDiffPanelComponent;
}());
exports.selectedCommitDiffPanelComponent = selectedCommitDiffPanelComponent;
