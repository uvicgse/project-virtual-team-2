import { Component } from "@angular/core";
import { FooterComponent } from "../footer/footer.component";
import { TextEditorComponent } from "../textEditor/text.editor.component";

@Component({
  selector: "diff-panel",
  templateUrl: 'app/components/diffPanel/diff.panel.component.html'
})

export class DiffPanelComponent {
  // Creating instances for the classes so that their functions can be used
  private footerInstance: FooterComponent = new FooterComponent();
  private textEditorInstance: TextEditorComponent = new TextEditorComponent();

  /* 
    This function is called when the Open in Editor button is pressed in the diff panel. 
    It opens the file currently open in the diff panel in the file editor
  */
  openFromDiff(): void {
    // Displays the file editor
    this.footerInstance.displayFileEditor();

    // Grabs the name of the file that is currently open in the diff panel
    let doc = document.getElementById("diff-panel");
    let fileName = doc.getElementsByTagName("P")[0].innerHTML;

    // Gets the full path of the file by adding it to the repo path
    let fileLocation = repoFullPath + '/' + fileName;

    // If the file exists, opens it in the file editor
    if (readFile.exists(fileLocation)) {
      let readme = fs.readFileSync(fileLocation, 'utf8');
      this.textEditorInstance.openDiffFile(fileName, fileLocation, readme);
    }
  }
}
