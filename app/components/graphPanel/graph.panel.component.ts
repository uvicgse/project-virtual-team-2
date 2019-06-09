import { Component, HostListener, ViewChild, ElementRef} from "@angular/core";


declare let getTags:any;

@Component({
  selector: "graph-panel",
  templateUrl: 'app/components/graphPanel/graph.panel.component.html'
})

export class GraphPanelComponent {
  commitList: any;
  showCommitList: boolean;
  getTags: any;
  @ViewChild('graphNodeClickModal') modal: ElementRef;
  


  // Listen for user click on graph and display if nodelclicked
  @HostListener('click', ['$event']) 
  async onClick() {
    // Check if modal has show class
    let modal = document.getElementById("graphNodeClickModal").classList.contains('loadTags');
    // Display if show class
    if(modal){
      let beginnningHash = document.getElementById('commitHash').innerHTML;
      let numCommit = document.getElementById('numCommit').innerHTML;
      console.log('inComponent');
      console.log(numCommit);
      await this.asyncGetCommits(beginnningHash, numCommit);
      console.log(this.commitList);
      this.showCommitList = true;
    }
    // remove if show class
    document.getElementById("graphNodeClickModal").classList.remove('loadTags');
  }
  
  // get all tags and commits information
  async asyncGetCommits(beginnningHash, endingHash) {
    console.log('GRAPH');
    this.commitList = await getTags(beginnningHash, endingHash);
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
  async deleteTag(tagName): void {
    await deleteTag(tagName);
    document.getElementById("onExit").click();
    //this.modal.nativeElement.contentWindow.location.reload(true);
  }

  async addOrModifyTag(commit): void {
    await addOrModifyTag(commit);
    document.getElementById("onExit").click();
  }

  // reloadTaglist(): void {
  //   let beginnningHash = document.getElementById('commitHash').innerHTML;
  //   let numCommit = document.getElementById('numCommit').innerHTML;
  //   this.asyncGetCommits(beginnningHash, numCommit);
  // }


  
}





