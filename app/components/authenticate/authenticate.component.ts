import { Component, OnInit, } from "@angular/core";

@Component({
  selector: "user-auth",
  templateUrl: 'app/components/authenticate/authenticate.component.html'
})

export class AuthenticateComponent implements OnInit {
  ngOnInit(): any {
    // useSavedCredentials returns true if there is a saved credential and uses it.
    if (useSavedCredentials()){
      // @ts-ignore
      document.getElementById("rememberLogin").checked = true;
    } else {
      // @ts-ignore
      document.getElementById("rememberLogin").checked = false;
    }
  }

  /*
  This function runs upon clicking the log in button on the main page
  It then first checks if there is already a token 
    if there is not it calls the logic to authenticate and make a token
  now that there is a token, logs in with that token
  */

  switchToMainPanel(): void {
    console.log("switchToMainPanel: Authenticate.component.ts");
    if (getOauthToken() == null){
      createOauthToken();
    }
    if (getOauthToken() == null){
      console.log("there was a log in error as there is still no token (switchToMainPanel: Authenticate.component.ts)");
    }
    else {
      getUserInfo(switchToAddRepositoryPanel);
    }

    /* previous log in logic
    // Check if either the password/username or both fields are empty and show an appropriate message if they are
    if (document.getElementById('password').value == "" && document.getElementById('username').value == "") {
      emptyPassword();
      emptyUsername();
    } else if (document.getElementById('password').value == "") {
      emptyPassword();
      notEmptyUsername();
    } else if (document.getElementById('username').value == "") {
      emptyUsername();
      notEmptyPassword();
    } else {
      // Both the fields filled so check if they can log in
      notEmptyPassword();
      notEmptyUsername();      
      document.getElementById('grey-out').style.display = 'block';
      */
    //}
  }

  testing(): void {
    console.log("testing: Authenticate.component.ts");
    openOauthWindow();
  }

  createNewAccount(): void {
    window.open("https://github.com/join?", "_blank");
  }
  
  openGitHubPasswordResetPage() : void {
    window.open("https://github.com/password_reset", "_blank");
  }
}

/*
  This function will open a new browser window to GitHub's Oauth authentication page and request a token,
  will then store this token in file system which can be retrieved later with another function
*/
function createOauthToken() {
  return;
}

/*
  If the password is empty, made the input field for the password red and show a message saying its 
  a required field.
*/
/*
function emptyPassword() {
  document.getElementById('password').classList.add("error");
  document.getElementById('password-error').style.display = 'inline-block';
}
*/
/*
  If the username is empty, made the input field for the username red and show a message saying its 
  a required field.
*/
/*
function emptyUsername() {
  document.getElementById('username').classList.add('error');
  document.getElementById('username-error').style.display = 'inline-block';
}
*/
/*
  If the username is not empty and the input field has been made red, change it back to normal and get
  rid of the warning message.
*/
/*
function notEmptyUsername() {
  if (document.getElementById('username').classList.contains('error')) {
    document.getElementById('username').classList.remove('error');
    document.getElementById('username-error').style.display = 'none';
  }
}
*/
/*
  If the password is not empty and the input field has been made red, change it back to normal and get
  rid of the warning message.
*/
/*
function notEmptyPassword() {
  if (document.getElementById('password').classList.contains('error')) {
    document.getElementById('password').classList.remove('error');
    document.getElementById('password-error').style.display = 'none';
  }
}
*/