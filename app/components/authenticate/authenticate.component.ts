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
}