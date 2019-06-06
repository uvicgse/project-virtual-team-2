import { Component } from "@angular/core";

@Component({
  selector: "wiki",
  templateUrl: 'app/components/wiki/wiki.component.html'
})

export class WikiComponent {
  closeWiki(): void {
    let editor = document.getElementById("wiki-panel")!;
    editor.style.height = "0vh";
    editor.style.width = "0vw";
    editor.style.zIndex = "-999";
  }

  updateWiki() : void {
    updateWiki();
  }
}