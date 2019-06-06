import { Component } from "@angular/core";

@Component({
    selector: "selected-commit-diff-panel",
    templateUrl: "app/components/selectedCommitDiffPanel/selected.commit.diff.panel.component.html"
})

/**
 * This component contains the HTML and functionality
 * of the text editor.
 */
export class selectedCommitDiffPanelComponent {

    closeSelectedCommitDiffPanel(): void {
        // Hide commit panel.
        let commitPanel = document.getElementById("selected-commit-diff-panel")!;

        let myNode = document.getElementById("commit-diff-panel-body");
        if (myNode != null) {
            while (myNode.firstChild) {
                myNode.removeChild(myNode.firstChild);
            }
        }
        commitPanel.style.height = "0vh";
        commitPanel.style.width = "0vw";
        commitPanel.style.zIndex = "-10";

        let footer = document.getElementById("footer");
        if (footer != null) {
            footer.hidden = false;
        }

        let editorPanel = document.getElementById("editor-panel");
        if (editorPanel != null){
            editorPanel.hidden = false;
        }
    }

}