import { Component, HostListener } from "@angular/core";
declare let loadMostRecentRepos:any;
@Component({
  selector: "add-repository-panel",
  templateUrl: 'app/components/addRepository/add.repository.component.html'
})

export class AddRepositoryComponent {
  recentRepos: [];
  loadMostRecentRepos:any;
  showRecent: boolean;

  ngOnInit(): void {
    // Show list of recent repos in order by most recently opened
    this.recentRepos = loadMostRecentRepos();
    this.recentRepos.reverse()
    if(this.recentRepos.length >0){
      this.showRecent = true
    }
  }

  // Custom event listener that is called whenever addRepository component is displayed
  @HostListener('window:loadRecentRepos', ['$event']) 
  updateRepos(event) {
    this.recentRepos = loadMostRecentRepos();
    this.recentRepos.reverse()
    if(this.recentRepos.length >0){
      this.showRecent = true
    }
  }

  // Open user selected recently opened repo 
  openRecentRepository(repo): void {
    console.log(repo);
    (<HTMLInputElement>document.getElementById("repoOpen")).value = repo;
    openRepository();
    switchToMainPanel();
  }
  
  selectClone(): void {
    if (document.getElementById("repoClone").value == null || document.getElementById("repoClone").value == "") {
      window.alert("Please enter the URL of the repository you wish to clone");
    } else if (document.getElementById("repoSave").value == null || document.getElementById("repoSave").value == "") {
      updateLocalPath();
    
    } else {
      // If directory is specified, continue as normal
      this.addRepository();
    }
  }

  // this function opens the browse folder window, which lets the user select a folder location
  selectBrowse(): void {
    document.getElementById("dirPickerSaveNew").click();
  }

  //Add function that determines if directory written or not
  selectDirectory(): void {
    if (document.getElementById("repoOpen").value == null || document.getElementById("repoOpen").value == "") {
      // If no directory specified, launch file browser
      document.getElementById("dirPickerOpenLocal").click();
    } else {
      // If directory is specified, continue as normal
      this.openRepository();
    }
  }

  selectLocalRepoDirectory(): void{
    if (document.getElementById("repoCreate").value == null || document.getElementById("repoCreate").value == ""){
      document.getElementById("dirPickerCreateLocal").click();
    }else {
      this.createLocalRepository();
    }
  }

  addRepository(): void {
    downloadRepository();
  }

  openRepository(): void {
    openRepository();
    switchToMainPanel();
  }

  chooseLocalPath(): void {
    chooseLocalPath();
  }

  createLocalRepository(): void {
    createLocalRepository();
  }

  returnToMainPanel(): void {
    switchToMainPanel();
  }


  prepareDontMissDND :  function() {

      $(document.body).bind("dragover", function(e) {
          e.preventDefault();
          return false;
      });

      $(document.body).bind("drop", function(e){
          e.preventDefault();
          fileUpload(e);
          return false;
      });


  
}

function fileUpload(ev){
  if(checkIfInTheApp()){
    ev.dataTransfer = ev.originalEvent.dataTransfer;
    if (ev.dataTransfer.items) {
      // Use DataTransferItemList interface to access the file(s)
      for (var i = 0; i < ev.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (ev.dataTransfer.items[i].kind === 'file') {
          var file = ev.dataTransfer.items[i].getAsFile();
          document.getElementById("repoOpen").value = ev.dataTransfer.files[i].path + "\\";
          console.log('... file[' + i + '].name = ' + file.name);
        }
      }
    }
    else {
      // Use DataTransfer interface to access the file(s)
      for (var i = 0; i < ev.dataTransfer.files.length; i++) {
        document.getElementById("repoOpen").value = ev.dataTransfer.files[i].path + "\\";
        console.log('... file[' + i + '].name = ' + ev.dataTransfer.files[i].name);
      }
    }
    openRepository()
    switchToMainPanel();
  }
}
