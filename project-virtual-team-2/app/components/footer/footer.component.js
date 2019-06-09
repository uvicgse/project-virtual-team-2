"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var FooterComponent = (function () {
    function FooterComponent() {
    }
    FooterComponent.prototype.displayFileEditor = function () {
        var editor = document.getElementById("editor-panel");
        if (editor != null) {
            editor.style.height = "100vh";
            editor.style.width = "100vw";
            editor.style.zIndex = "10";
        }
    };
    FooterComponent.prototype.displayIssuePanel = function () {
        var issue = document.getElementById("issue-panel");
        displayIssues();
        if (issue != null) {
            issue.style.height = "100vh";
            issue.style.width = "100vw";
            issue.style.zIndex = "10";
        }
    };
    FooterComponent = __decorate([
        core_1.Component({
            selector: "app-footer",
            templateUrl: 'app/components/footer/footer.component.html'
        })
    ], FooterComponent);
    return FooterComponent;
}());
exports.FooterComponent = FooterComponent;
