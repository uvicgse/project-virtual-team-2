"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var header_component_1 = require("../header/header.component");
var file_panel_component_1 = require("../filePanel/file.panel.component");
var body_panel_component_1 = require("../bodyPanel/body.panel.component");
var footer_component_1 = require("../footer/footer.component");
var add_repository_component_1 = require("../addRepository/add.repository.component");
var authenticate_component_1 = require("../authenticate/authenticate.component");
var text_editor_component_1 = require("../textEditor/text.editor.component");
var wiki_component_1 = require("../wiki/wiki.component");
var selected_commit_diff_panel_component_1 = require("../selectedCommitDiffPanel/selected.commit.diff.panel.component");
var issue_panel_component_1 = require("../issuePanel/issue.panel.component");
var pull_request_panel_component_1 = require("../pullRequestPanel/pull.request.panel.component");
var AppComponent = (function () {
    function AppComponent() {
    }
    AppComponent.prototype.ngOnInit = function () {
        var userColorFilePath = ".settings/user_color.txt";
        if (fs.existsSync(userColorFilePath)) {
            fs.readFile(userColorFilePath, function (err, buffer) {
                console.log(buffer.toString());
                var color = buffer.toString();
                changeColor(color);
            });
        }
        createSettingsDir();
    };
    AppComponent = __decorate([
        core_1.Component({
            selector: "my-app",
            templateUrl: 'app/components/app/app.component.html',
            directives: [header_component_1.HeaderComponent, file_panel_component_1.FilePanelComponent, body_panel_component_1.BodyPanelComponent, footer_component_1.FooterComponent, add_repository_component_1.AddRepositoryComponent, authenticate_component_1.AuthenticateComponent, text_editor_component_1.TextEditorComponent, selected_commit_diff_panel_component_1.selectedCommitDiffPanelComponent, issue_panel_component_1.IssuePanelComponent, wiki_component_1.WikiComponent, pull_request_panel_component_1.PullRequestPanelComponent]
        })
    ], AppComponent);
    return AppComponent;
}());
exports.AppComponent = AppComponent;
