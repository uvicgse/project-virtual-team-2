import { Component, HostListener} from "@angular/core";
import { tagItem } from "../../misc/git";
import { resolve } from "url";



declare let getTags:any;

@Component({
  selector: "graph-panel",
  templateUrl: 'app/components/graphPanel/graph.panel.component.html'
})

export class GraphPanelComponent {
  tagList: any;
  showCommitList: boolean;
  getTags: any;
  //
  // This Event listener should be more specific
  //
  @HostListener('click', ['$event']) 
  async onClick() {
    let testModal = document.getElementById("graphNodeClickModal").classList.contains('loadTags')
    if(testModal){
     await this.asyncCall()
     console.log(this.tagList)
     console.log(document.getElementById('commitHash').innerHTML);
     this.tagList.sort(function(a, b){
      var A = a.commitMsg,
          B = b.commitMsg;
      //
      if(A>B) return -1;
      if(A<B) return 1;
      return 0;
    })
     this.showCommitList = true;
  }
  document.getElementById("graphNodeClickModal").classList.remove('loadTags');
  }
  
  async asyncCall() {
    console.log('GRAPH')
    this.tagList = await getTags();
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

  modifyTag(oldTagName, newTagName, newTagMsg): void {
    modifyTag(oldTagName, newTagName, newTagMsg);
  }

  deleteTag(tagName): void {
    deleteTag(tagName);
  }


  
}





