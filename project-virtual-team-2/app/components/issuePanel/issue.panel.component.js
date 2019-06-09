"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var IssuePanelComponent = (function () {
    function IssuePanelComponent() {
    }
    IssuePanelComponent.prototype.closePanel = function () {
        var panel = document.getElementById("issue-panel");
        panel.style.height = "0vh";
        panel.style.width = "0vw";
        panel.style.zIndex = "-10";
    };
    IssuePanelComponent.prototype.openModal = function (id) {
        $('#' + id).modal('show');
    };
    IssuePanelComponent.prototype.closeModal = function (id) {
        $('#' + id).modal('hide');
    };
    IssuePanelComponent.prototype.addIssue = function (name, id, onclick) {
        var ul = document.getElementById(id);
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.setAttribute("href", "#");
        a.setAttribute("class", "list-group-item");
        a.setAttribute("onclick", onclick + ";event.stopPropagation()");
        li.setAttribute("role", "presentation");
        a.appendChild(document.createTextNode(name));
        a.innerHTML = name;
        li.appendChild(a);
    };
    IssuePanelComponent = __decorate([
        core_1.Component({
            selector: "issue-panel",
            templateUrl: "app/components/issuePanel/issue.panel.component.html"
        })
    ], IssuePanelComponent);
    return IssuePanelComponent;
}());
exports.IssuePanelComponent = IssuePanelComponent;
