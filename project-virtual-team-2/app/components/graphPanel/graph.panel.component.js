"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var GraphPanelComponent = (function () {
    function GraphPanelComponent() {
    }
    GraphPanelComponent.prototype.mergeBranches = function () {
        var p1 = document.getElementById('fromMerge').innerHTML;
        mergeCommits(p1);
    };
    GraphPanelComponent.prototype.rebaseBranches = function () {
        var p1 = document.getElementById('fromRebase').innerHTML;
        var p2 = document.getElementById('toRebase').innerHTML;
        rebaseCommits(p1, p2);
    };
    GraphPanelComponent = __decorate([
        core_1.Component({
            selector: "graph-panel",
            templateUrl: 'app/components/graphPanel/graph.panel.component.html'
        })
    ], GraphPanelComponent);
    return GraphPanelComponent;
}());
exports.GraphPanelComponent = GraphPanelComponent;
