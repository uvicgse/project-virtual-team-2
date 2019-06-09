"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var AuthenticateComponent = (function () {
    function AuthenticateComponent() {
    }
    AuthenticateComponent.prototype.ngOnInit = function () {
        if (useSavedCredentials()) {
            document.getElementById("rememberLogin").checked = true;
        }
        else {
            document.getElementById("rememberLogin").checked = false;
        }
    };
    AuthenticateComponent.prototype.switchToMainPanel = function () {
        if (document.getElementById('password').value == "" && document.getElementById('username').value == "") {
            emptyPassword();
            emptyUsername();
        }
        else if (document.getElementById('password').value == "") {
            emptyPassword();
            notEmptyUsername();
        }
        else if (document.getElementById('username').value == "") {
            emptyUsername();
            notEmptyPassword();
        }
        else {
            notEmptyPassword();
            notEmptyUsername();
            document.getElementById('grey-out').style.display = 'block';
            getUserInfo(switchToAddRepositoryPanel);
        }
    };
    AuthenticateComponent.prototype.createNewAccount = function () {
        window.open("https://github.com/join?", "_blank");
    };
    AuthenticateComponent.prototype.openGitHubPasswordResetPage = function () {
        window.open("https://github.com/password_reset", "_blank");
    };
    AuthenticateComponent = __decorate([
        core_1.Component({
            selector: "user-auth",
            templateUrl: 'app/components/authenticate/authenticate.component.html'
        })
    ], AuthenticateComponent);
    return AuthenticateComponent;
}());
exports.AuthenticateComponent = AuthenticateComponent;
function emptyPassword() {
    document.getElementById('password').classList.add("error");
    document.getElementById('password-error').style.display = 'inline-block';
}
function emptyUsername() {
    document.getElementById('username').classList.add('error');
    document.getElementById('username-error').style.display = 'inline-block';
}
function notEmptyUsername() {
    if (document.getElementById('username').classList.contains('error')) {
        document.getElementById('username').classList.remove('error');
        document.getElementById('username-error').style.display = 'none';
    }
}
function notEmptyPassword() {
    if (document.getElementById('password').classList.contains('error')) {
        document.getElementById('password').classList.remove('error');
        document.getElementById('password-error').style.display = 'none';
    }
}
