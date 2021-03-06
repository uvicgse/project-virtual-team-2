import { Component, ViewEncapsulation } from "@angular/core";
import { RepositoryService } from "../../services/repository.service";
import { GraphService } from "../../services/graph.service";


@Component({
  selector: "app-header",
  templateUrl: 'app/components/header/header.component.html',
  providers: [RepositoryService, GraphService],
  styleUrls: [
    'app/components/header/header.component.css'
  ],
  encapsulation: ViewEncapsulation.None
})

export class HeaderComponent   {
  repoName: string = "Repo name";
  repoBranch: string = "Repo branch";
  repository: any;
  showBranches: boolean = true;
  showTags: boolean = false;

  promptUserToAddRepository(): void {
    switchToAddRepositoryPanel();
  }

  switchToMainPanel(): void {
    // Check if either the password/username or both fields are empty and show an icon and make the field red if they are
    if (document.getElementById('Password1').value == "" && document.getElementById('Email1').value == "") {
      this.emptyPassword();
      this.emptyUsername();
    } else if (document.getElementById('Password1').value == "") {
      this.emptyPassword();
      this.notEmptyUsername();
    } else if (document.getElementById('Email1').value == "") {
      this.emptyUsername();
      this.notEmptyPassword();
    } else {
      this.notEmptyPassword();
      this.notEmptyUsername();

      // Both the fields filled so check if they can log in
      signInHead(collapseSignPanel);
      document.getElementById("Email1").value = "";
      document.getElementById("Password1").value = "";
    }
  }

  WarningSignIn(): void {
    redirectToHomePage();
  }

  /*
    If the password is empty, made the input field for the password red and show a icon that shows that the password 
    field is empty.
  */
  emptyPassword(): void {
    document.getElementById('Password1').classList.add("error");
    document.getElementById('password-error-icon').style.visibility = 'visible';
  }

  /*
    If the username is empty, made the input field for the username red and show a icon that shows that the username 
    field is empty.
  */
  emptyUsername(): void {
    document.getElementById('Email1').classList.add('error');
    document.getElementById('username-error-icon').style.visibility = 'visible';
  }

  /*
    If the username is not empty and the input field has been made red, change it back to normal and get
    rid of the warning icon.
  */
  notEmptyUsername(): void {
    if (document.getElementById('Email1').classList.contains('error')) {
      document.getElementById('Email1').classList.remove('error');
      document.getElementById('username-error-icon').style.visibility = 'hidden';
    }
  }

  /*
    If the password is not empty and the input field has been made red, change it back to normal and get
    rid of the warning icon.
  */
  notEmptyPassword(): void {
    if (document.getElementById('Password1').classList.contains('error')) {
      document.getElementById('Password1').classList.remove('error');
      document.getElementById('password-error-icon').style.visibility = 'hidden';
    }
  }

  displayBranches(): void {
    document.getElementById('branchesTab').style.display = 'block'
    document.getElementById('tagsTab').style.display = 'none'
    var inputValue = (<HTMLInputElement>document.getElementById('branchName'));
    inputValue.placeholder = 'Find or create branch';
  }

  displayTags(): void {
    document.getElementById('branchesTab').style.display = 'none'
    document.getElementById('tagsTab').style.display = 'block'
    var inputValue = (<HTMLInputElement>document.getElementById('branchName'));
    inputValue.placeholder = 'Find a tag';
  }

}
