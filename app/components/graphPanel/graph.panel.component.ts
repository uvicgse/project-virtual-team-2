import { Component, HostListener, ViewChild, ElementRef} from "@angular/core";
import { resolve } from "url";

@Component({
  selector: "graph-panel",
  templateUrl: 'app/components/graphPanel/graph.panel.component.html',
  styles: ['#authorModalImage {padding-right: 10px; float: left;}']
})

export class GraphPanelComponent {
  tagList: any;
  showCommitList: boolean;
  @ViewChild('graphNodeClickModal') modal: ElementRef;

  // Listen for user click on graph and display if node clicked
  @HostListener('click', ['$event'])
  async onClick() {
    // Check if modal has show class
    let modal = document.getElementById("graphNodeClickModal").classList.contains('loadTags');
    // Display if show class
    if(modal){
      let beginnningHash = document.getElementById('commitHash').innerHTML;
      let numCommit = document.getElementById('numCommit').innerHTML;
      await this.asyncCall(beginnningHash, numCommit);
      this.showCommitList = true;
    }
    // remove if show class
    document.getElementById("graphNodeClickModal").classList.remove('loadTags');
  }


  // get all tags and commits information
  async asyncCall(beginnningHash, endingHash) {
    this.tagList = await getTags(beginnningHash, endingHash);
  }


  mergeBranches(): void {
    let p1 = document.getElementById('fromMerge').innerHTML;
    mergeCommits(p1);
  }

  rebaseBranches(): void {
    let p1 = document.getElementById('fromRebase').innerHTML;
    let p2 = document.getElementById('toRebase').innerHTML;
    rebaseCommits(p1, p2);
  }

  // Delete tag when delete tag button is clicked. Method will reload list of commits after tag has been deleted
  deleteTag(tagName): void {
    deleteTag(tagName);
    let beginnningHash = document.getElementById('commitHash').innerHTML;
    let numCommit = document.getElementById('numCommit').innerHTML;
    this.asyncCall(beginnningHash, numCommit);
    //this.modal.nativeElement.contentWindow.location.reload(true);
  }
  //Add  or modify tag when Add or Modify button is clicked in the model
  async addOrModifyTag(commit): void {
    await addOrModifyTag(commit);
    document.getElementById("onExit").click();
  }

}
