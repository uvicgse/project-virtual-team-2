import { Component, HostListener} from "@angular/core";
import * as nodegit from "git";


declare let getCommitHistory:any;


@Component({
  selector: "graph-panel",
  templateUrl: 'app/components/graphPanel/graph.panel.component.html'
})

export class GraphPanelComponent {
  commitList: [any];
  showCommitList: boolean;
  getCommitHistory: any;


  //
  // This Event listener shouuld be more specific
  //
  @HostListener('click', ['$event']) 
  onClick() {
    this.showCommitList = true;
    let currentPath = document.getElementById("repo-name").innerHTML  
    this.commitList = getCommitHistory(currentPath);
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
  }

  
  
  
  }





