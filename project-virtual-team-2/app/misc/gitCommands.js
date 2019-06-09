function addCommand(command) {
    var gitCommand = document.createElement("p");
    gitCommand.className = "git-command";
    gitCommand.id = "git-command";
    gitCommand.innerHTML = command;
    var terminal = document.getElementById("terminal");
    if (terminal != null) {
        terminal.appendChild(gitCommand);
        terminal.scrollTop = terminal.scrollHeight;
    }
}
