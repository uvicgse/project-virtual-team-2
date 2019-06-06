import { Component } from "@angular/core";

@Component({
  selector: "app-footer",
  templateUrl: 'app/components/footer/footer.component.html'
})

export class FooterComponent {
  displayFileEditor(): void {
    let editor = document.getElementById("editor-panel");

    if (editor != null) {
      editor.style.height = "100vh"
      editor.style.width = "100vw"
      editor.style.zIndex = "10";
    }
  }
  displayIssuePanel(): void {
    let issue = document.getElementById("issue-panel");
    displayIssues();
    if(issue != null) {
      issue.style.height = "100vh"
      issue.style.width = "100vw"
      issue.style.zIndex = "10";
    } 
  }
}
