import { Component, OnInit, } from "@angular/core";
import { create } from "domain";

@Component({
  selector: "user-auth",
  templateUrl: 'app/components/authenticate/authenticate.component.html'
})

export class AuthenticateComponent implements OnInit {
  ngOnInit(): any {
  }

  switchToMainPanel(): void {
    console.log("switchToMainPanel: Authenticate.component.ts");

    //If there is a token then sign in
    let file = 'token.json';
    // check if the data.json file exists
    if (fs.existsSync(file)) {
      getUserInfo(switchToAddRepositoryPanel);
    }
    //Otherwise create token then sign in
    else {
      authenticateUser(switchToAddRepositoryPanel);
    }
  }
  Githublogin():void {
    authenticateUser(switchToAddRepositoryPanel);
  }
}


/*
  This function will open a new browser window to GitHub's Oauth authentication page and request a token,
  will then store this token in file system which can be retrieved later with another function
*/
function createOauthToken() {
  //Maybe here should call openOauthWindow or just remove the function altogether
  //openOauthWindow();
  //For now and testing just enter a valid token and store it
  storeOauthToken('PutYourTokenHere');
}