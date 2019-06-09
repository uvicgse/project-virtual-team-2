"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var repository_service_1 = require("../../services/repository.service");
var graph_service_1 = require("../../services/graph.service");
var HeaderComponent = (function () {
    function HeaderComponent() {
        this.repoName = "Repo name";
        this.repoBranch = "Repo branch";
    }
    HeaderComponent.prototype.promptUserToAddRepository = function () {
        switchToAddRepositoryPanel();
    };
    HeaderComponent.prototype.switchToMainPanel = function () {
        if (document.getElementById('Password1').value == "" && document.getElementById('Email1').value == "") {
            this.emptyPassword();
            this.emptyUsername();
        }
        else if (document.getElementById('Password1').value == "") {
            this.emptyPassword();
            this.notEmptyUsername();
        }
        else if (document.getElementById('Email1').value == "") {
            this.emptyUsername();
            this.notEmptyPassword();
        }
        else {
            this.notEmptyPassword();
            this.notEmptyUsername();
            signInHead(collapseSignPanel);
            document.getElementById("Email1").value = "";
            document.getElementById("Password1").value = "";
        }
    };
    HeaderComponent.prototype.WarningSignIn = function () {
        redirectToHomePage();
    };
    HeaderComponent.prototype.emptyPassword = function () {
        document.getElementById('Password1').classList.add("error");
        document.getElementById('password-error-icon').style.visibility = 'visible';
    };
    HeaderComponent.prototype.emptyUsername = function () {
        document.getElementById('Email1').classList.add('error');
        document.getElementById('username-error-icon').style.visibility = 'visible';
    };
    HeaderComponent.prototype.notEmptyUsername = function () {
        if (document.getElementById('Email1').classList.contains('error')) {
            document.getElementById('Email1').classList.remove('error');
            document.getElementById('username-error-icon').style.visibility = 'hidden';
        }
    };
    HeaderComponent.prototype.notEmptyPassword = function () {
        if (document.getElementById('Password1').classList.contains('error')) {
            document.getElementById('Password1').classList.remove('error');
            document.getElementById('password-error-icon').style.visibility = 'hidden';
        }
    };
    HeaderComponent = __decorate([
        core_1.Component({
            selector: "app-header",
            templateUrl: 'app/components/header/header.component.html',
            providers: [repository_service_1.RepositoryService, graph_service_1.GraphService]
        })
    ], HeaderComponent);
    return HeaderComponent;
}());
exports.HeaderComponent = HeaderComponent;
