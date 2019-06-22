// Function takes a string and displays string in the center of the footer in VisualGit
// @param command: string representation of a git command
function addCommand(command) {
  let gitCommand = document.createElement("p");
  gitCommand.className = "git-command";
  gitCommand.id = "git-command";
  gitCommand.innerHTML = command;
  let terminal = document.getElementById("terminal");
  if (terminal != null) {
    terminal.appendChild(gitCommand);
    terminal.scrollTop = terminal.scrollHeight;
  }
}
