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
