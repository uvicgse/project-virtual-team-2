"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var AddRepositoryComponent = (function () {
    function AddRepositoryComponent() {
    }
    AddRepositoryComponent.prototype.ngOnInit = function () {
        this.recentRepos = loadMostRecentRepos();
        this.recentRepos.reverse();
        if (this.recentRepos.length > 0) {
            this.showRecent = true;
        }
    };
    AddRepositoryComponent.prototype.updateRepos = function (event) {
        this.recentRepos = loadMostRecentRepos();
        this.recentRepos.reverse();
        if (this.recentRepos.length > 0) {
            this.showRecent = true;
        }
    };
    AddRepositoryComponent.prototype.openRecentRepository = function (repo) {
        console.log(repo);
        document.getElementById("repoOpen").value = repo;
        openRepository();
        switchToMainPanel();
    };
    AddRepositoryComponent.prototype.selectClone = function () {
        if (document.getElementById("repoClone").value == null || document.getElementById("repoClone").value == "") {
            window.alert("Please enter the URL of the repository you wish to clone");
        }
        else if (document.getElementById("repoSave").value == null || document.getElementById("repoSave").value == "") {
            updateLocalPath();
        }
        else {
            this.addRepository();
        }
    };
    AddRepositoryComponent.prototype.selectBrowse = function () {
        document.getElementById("dirPickerSaveNew").click();
    };
    AddRepositoryComponent.prototype.selectDirectory = function () {
        if (document.getElementById("repoOpen").value == null || document.getElementById("repoOpen").value == "") {
            document.getElementById("dirPickerOpenLocal").click();
        }
        else {
            this.openRepository();
        }
    };
    AddRepositoryComponent.prototype.selectLocalRepoDirectory = function () {
        if (document.getElementById("repoCreate").value == null || document.getElementById("repoCreate").value == "") {
            document.getElementById("dirPickerCreateLocal").click();
        }
        else {
            this.createLocalRepository();
        }
    };
    AddRepositoryComponent.prototype.addRepository = function () {
        downloadRepository();
    };
    AddRepositoryComponent.prototype.openRepository = function () {
        openRepository();
        switchToMainPanel();
    };
    AddRepositoryComponent.prototype.chooseLocalPath = function () {
        chooseLocalPath();
    };
    AddRepositoryComponent.prototype.createLocalRepository = function () {
        createLocalRepository();
    };
    AddRepositoryComponent.prototype.returnToMainPanel = function () {
        switchToMainPanel();
    };
    __decorate([
        core_1.HostListener('window:loadRecentRepos', ['$event']),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", void 0)
    ], AddRepositoryComponent.prototype, "updateRepos", null);
    AddRepositoryComponent = __decorate([
        core_1.Component({
            selector: "add-repository-panel",
            templateUrl: 'app/components/addRepository/add.repository.component.html'
        })
    ], AddRepositoryComponent);
    return AddRepositoryComponent;
}());
exports.AddRepositoryComponent = AddRepositoryComponent;
{
    $(document.body).bind("dragover", function (e) {
        e.preventDefault();
        return false;
    });
    $(document.body).bind("drop", function (e) {
        e.preventDefault();
        fileUpload(e);
        return false;
    });
}
function fileUpload(ev) {
    if (checkIfInTheApp()) {
        ev.dataTransfer = ev.originalEvent.dataTransfer;
        if (ev.dataTransfer.items) {
            for (var i = 0; i < ev.dataTransfer.items.length; i++) {
                if (ev.dataTransfer.items[i].kind === 'file') {
                    var file = ev.dataTransfer.items[i].getAsFile();
                    document.getElementById("repoOpen").value = ev.dataTransfer.files[i].path + "\\";
                    console.log('... file[' + i + '].name = ' + file.name);
                }
            }
        }
        else {
            for (var i = 0; i < ev.dataTransfer.files.length; i++) {
                document.getElementById("repoOpen").value = ev.dataTransfer.files[i].path + "\\";
                console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
            }
        }
        openRepository();
        switchToMainPanel();
    }
}
