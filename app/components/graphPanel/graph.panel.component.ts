import { Component, HostListener} from "@angular/core";
import * as nodegit from "git";

declare let getTags:any;

@Component({
  selector: "graph-panel",
  templateUrl: 'app/components/graphPanel/graph.panel.component.html'
})

export class GraphPanelComponent {
  tagObjList: [any];
  showCommitList: boolean;
  getTags: any;


  //
  // This Event listener should be more specific
  //
  @HostListener('click', ['$event']) 
<<<<<<< Updated upstream
  onClick() {
    this.showCommitList = true; 
    this.tagObjList = getTags();
    
    console.log(this.tagObjList) 
    /*
    this.tagObjList.forEach(function(t){
      //console.log(t[0])
      console.log(t[0].tagName)
      console.log(t[0].commitMsg)
    })
    */
  }
=======
  async onClick() {
     await this.asyncCall()
     console.log(this.tagList)
     this.showCommitList = true;
  }

  async asyncCall() {
    console.log('GRAPH')
    this.tagList = await getTags()}
>>>>>>> Stashed changes

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





