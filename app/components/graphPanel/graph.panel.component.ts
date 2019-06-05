import { Component, HostListener, ViewChild, ElementRef} from "@angular/core";
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
  @ViewChild('graphNodeClickModal') modal: ElementRef;
  //
  // This Event listener should be more specific
  // TODO: you should probably explain the sort function
  @HostListener('click', ['$event']) 
  async onClick() {
    let modal = document.getElementById("graphNodeClickModal").classList.contains('loadTags');
    if(modal){
      let beginnningHash = document.getElementById('commitHash').innerHTML;
      let endingHash = document.getElementById('commitHashEnd').innerHTML;
      await this.asyncCall(beginnningHash, endingHash);
      console.log(this.tagList);
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
  
  async asyncCall(beginnningHash, endingHash) {
    console.log('GRAPH');
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

  deleteTag(tagName): void {
    deleteTag(tagName);
    this.modal.nativeElement.contentWindow.location.reload(true);
  }


  
}





