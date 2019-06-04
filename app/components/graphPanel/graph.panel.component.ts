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
     await this.asyncCall()
     console.log(this.tagList)
     this.tagList.sort((a, b) => (a.color > b.color) ? 1 : -1)
     this.showCommitList = true;
  }

  async asyncCall() {
    console.log('GRAPH')
    this.tagList = await getTags()}

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





