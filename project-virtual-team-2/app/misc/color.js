var cs = require('color-scheme');
var before = 'default';
function changeColor(color) {
    var userSettingsDirectory = ".settings/";
    var userColorFilePath = userSettingsDirectory + "user_color.txt";
    if (!fs.existsSync(userSettingsDirectory)) {
        fs.mkdir(userSettingsDirectory);
    }
    if (color != null) {
        fs.writeFile(userColorFilePath, color, function (err) {
            if (err)
                console.log("Cannot write colour to file: " + err);
        });
    }
    var head = document.getElementsByClassName('navbar');
    var headButton = document.getElementsByClassName('navbar-btn');
    var fa = document.getElementsByClassName('fa');
    var fp = document.getElementById('file-panel');
    var p = document.getElementsByTagName('p');
    var h1 = document.getElementsByTagName('h1');
    var diffp = document.getElementById('diff-panel-body');
    var network = document.getElementById('my-network');
    var footer = document.getElementById('footer');
    var arp = document.getElementById('add-repository-panel');
    var auth = document.getElementById('authenticate');
    var rememberLogin = document.getElementById('checkboxText');
    var repoName = document.getElementById('repo-name');
    var branchName = document.getElementById('branch-name');
    var modifiedMessageColor = document.getElementById('modified-files-message');
    var stagedMessageColor = document.getElementById('staged-files-message');
    var modifiedTitle = document.getElementById('unstaged-files-heading');
    var stagedTitle = document.getElementById('staged-files-heading');
    var diffPanel = document.getElementById('diff-panel');
    var diffChangePopUp = document.getElementById('selected-commit-diff-panel');
    var commitDiffPanel = document.getElementById('commit-diff-panel-body');
    var diffChangePanelText = document.getElementsByClassName('diffChangeText');
    var editor = document.getElementById('editor-panel');
    var editorHeader = document.getElementsByClassName('editor-header');
    var editorFileTab = document.getElementById('file-tab');
    var editorEditors = document.getElementById('file-editors');
    var editorIndentSelector = document.getElementById('indent-selector-p');
    var editorIndentDropdown = document.getElementById('selected-indent');
    if (color === 'white') {
        for (var i_1 = 0; i_1 < head.length; i_1++) {
            console.log(head[i_1]);
            head[i_1].className = 'navbar navbar-white';
        }
        for (var i_2 = 0; i_2 < headButton.length; i_2++) {
            if (before === 'default') {
                headButton[i_2].classList.remove('btn-inverse');
            }
            headButton[i_2].classList.add('btn-default');
        }
        for (var i_3 = 0; i_3 < fa.length; i_3++) {
            fa[i_3].setAttribute('style', 'color:#a8abaf');
        }
        fp.setAttribute('style', 'background-color:#E3E3E3');
        for (var i_4 = 0; i_4 < p.length; i_4++) {
            p[i_4].style.color = '#fff';
        }
        for (var i_5 = 0; i_5 < h1.length; i_5++) {
            h1[i_5].style.color = '#5E5E5E';
        }
        changeTextColor('#fff');
        diffp.style.color = '#fff';
        diffp.style.backgroundColor = '#302f2f';
        diffPanel.style.backgroundColor = '#302f2f';
        network.style.backgroundColor = '#D6D6D6';
        footer.style.backgroundColor = '#E3E3E3';
        arp.style.backgroundColor = '#D1D1D1';
        auth.style.backgroundColor = '#D6D6D6';
        rememberLogin.style.color = '#5E5E5E';
        repoName.style.color = '#000000';
        branchName.style.color = '#000000';
        modifiedTitle.style.color = '#000000';
        stagedTitle.style.color = '#000000';
        diffChangePopUp.style.backgroundColor = '#E3E3E3';
        commitDiffPanel.style.backgroundColor = '#302f2f';
        if (modifiedMessageColor != null) {
            modifiedMessageColor.style.color = '#000000';
        }
        if (stagedMessageColor != null) {
            stagedMessageColor.style.color = '#000000';
        }
        before = 'white';
    }
    else if (color === 'pink') {
        for (var i = 0; i < head.length; i++) {
            console.log(head[i]);
            head[i].className = 'navbar navbar-pink';
        }
        for (var i = 0; i < headButton.length; i++) {
            if (before === 'default') {
                headButton[i].classList.remove('btn-inverse');
            }
            headButton[i].classList.add('btn-default');
        }
        for (var i = 0; i < fa.length; i++) {
            fa[i].setAttribute('style', 'color:white');
        }
        fp.setAttribute('style', 'background-color: #FFC2C2');
        for (var i = 0; i < p.length; i++) {
            p[i].style.color = '#000000';
        }
        for (var i = 0; i < h1.length; i++) {
            h1[i].style.color = '#FFA3A3';
        }
        changeTextColor('#000000');
        diffp.style.color = '#000000';
        diffp.style.backgroundColor = 'white';
        diffPanel.style.backgroundColor = 'white';
        network.style.backgroundColor = '#FFE5E5';
        footer.style.backgroundColor = '#FFD7D7';
        footer.style.border = '#FFD7D7';
        arp.style.backgroundColor = '#FFD7D7';
        auth.style.backgroundColor = '#FFE5E5';
        rememberLogin.style.color = '#FFA3A3';
        repoName.style.color = '#fff';
        branchName.style.color = '#fff';
        modifiedTitle.style.color = '#fff';
        stagedTitle.style.color = '#fff';
        diffChangePopUp.style.backgroundColor = '#FFD7D7';
        commitDiffPanel.style.backgroundColor = '#fff';
        if (modifiedMessageColor != null) {
            modifiedMessageColor.style.color = '#fff';
        }
        if (stagedMessageColor != null) {
            stagedMessageColor.style.color = '#fff';
        }
        before = 'pink';
    }
    else if (color === 'blue') {
        for (var i = 0; i < head.length; i++) {
            console.log(head[i]);
            head[i].className = 'navbar navbar-blue';
        }
        for (var i = 0; i < headButton.length; i++) {
            if (before === 'default') {
                headButton[i].classList.remove('btn-inverse');
            }
            headButton[i].classList.add('btn-default');
        }
        for (var i = 0; i < fa.length; i++) {
            fa[i].setAttribute('style', 'color:white');
        }
        fp.setAttribute('style', 'background-color: #9DD2FE');
        for (var i = 0; i < p.length; i++) {
            p[i].style.color = '#000000';
        }
        for (var i = 0; i < h1.length; i++) {
            h1[i].style.color = '#4EAFFE';
        }
        changeTextColor('#000000');
        diffp.style.color = '#000000';
        diffp.style.backgroundColor = 'white';
        diffPanel.style.backgroundColor = 'white';
        network.style.backgroundColor = '#EEF6FF';
        footer.style.backgroundColor = '#B6DEFF';
        footer.style.border = '#B6DEFF';
        arp.style.backgroundColor = '#DAEEFF';
        auth.style.backgroundColor = '#DAEEFF';
        rememberLogin.style.color = '#4EAFFE';
        repoName.style.color = '#fff';
        branchName.style.color = '#fff';
        modifiedTitle.style.color = '#fff';
        stagedTitle.style.color = '#fff';
        diffChangePopUp.style.backgroundColor = '#B6DEFF';
        commitDiffPanel.style.backgroundColor = '#fff';
        if (modifiedMessageColor != null) {
            modifiedMessageColor.style.color = '#fff';
        }
        if (stagedMessageColor != null) {
            stagedMessageColor.style.color = '#fff';
        }
        before = 'blue';
    }
    else if (color === 'navy') {
        for (var i = 0; i < head.length; i++) {
            console.log(head[i]);
            head[i].className = 'navbar navbar-navy';
        }
        for (var i = 0; i < headButton.length; i++) {
            if (before === 'default') {
                headButton[i].classList.remove('btn-inverse');
            }
            headButton[i].classList.add('btn-default');
        }
        for (var i = 0; i < fa.length; i++) {
            fa[i].setAttribute('style', 'color:white');
        }
        fp.setAttribute('style', 'background-color: #0066FF');
        for (var i = 0; i < p.length; i++) {
            p[i].style.color = '#000000';
        }
        for (var i = 0; i < h1.length; i++) {
            h1[i].style.color = '#001C83';
        }
        changeTextColor('#000000');
        diffp.style.color = '#000000';
        diffp.style.backgroundColor = 'white';
        diffPanel.style.backgroundColor = 'white';
        network.style.backgroundColor = '#CCE0FF';
        network.style.border = '#CCE0FF';
        footer.style.backgroundColor = '#4D94FF';
        footer.style.border = '#4D94FF';
        arp.style.backgroundColor = '#4D94FF';
        auth.style.backgroundColor = '#4D94FF';
        rememberLogin.style.color = '#001C83';
        repoName.style.color = '#fff';
        branchName.style.color = '#fff';
        modifiedTitle.style.color = '#fff';
        stagedTitle.style.color = '#fff';
        diffChangePopUp.style.backgroundColor = '#0066FF';
        commitDiffPanel.style.backgroundColor = '#fff';
        if (modifiedMessageColor != null) {
            modifiedMessageColor.style.color = '#fff';
        }
        if (stagedMessageColor != null) {
            stagedMessageColor.style.color = '#fff';
        }
        before = 'navy';
    }
    else if (color === 'green') {
        for (var i = 0; i < head.length; i++) {
            console.log(head[i]);
            head[i].className = 'navbar navbar-green';
        }
        for (var i = 0; i < headButton.length; i++) {
            if (before === 'default') {
                headButton[i].classList.remove('btn-inverse');
            }
            headButton[i].classList.add('btn-default');
        }
        for (var i = 0; i < fa.length; i++) {
            fa[i].setAttribute('style', 'color:white');
        }
        fp.setAttribute('style', 'background-color: #5CD65C');
        for (var i = 0; i < p.length; i++) {
            p[i].style.color = '#000000';
        }
        for (var i = 0; i < h1.length; i++) {
            h1[i].style.color = '#00990d';
        }
        changeTextColor('#000000');
        diffp.style.color = '#000000';
        diffp.style.backgroundColor = 'white';
        diffPanel.style.backgroundColor = 'white';
        network.style.backgroundColor = '#EBFAEB';
        footer.style.backgroundColor = '#ADEBAD';
        footer.style.border = '#ADEBAD';
        arp.style.backgroundColor = '#ADEBAD';
        auth.style.backgroundColor = '#ADEBAD';
        rememberLogin.style.color = '#00990d';
        repoName.style.color = '#fff';
        branchName.style.color = '#fff';
        modifiedTitle.style.color = '#fff';
        stagedTitle.style.color = '#fff';
        diffChangePopUp.style.backgroundColor = '#ADEBAD';
        commitDiffPanel.style.backgroundColor = '#fff';
        if (modifiedMessageColor != null) {
            modifiedMessageColor.style.color = '#fff';
        }
        if (stagedMessageColor != null) {
            stagedMessageColor.style.color = '#fff';
        }
        before = 'green';
    }
    else if (color === 'default') {
        for (var i_6 = 0; i_6 < head.length; i_6++) {
            console.log(head[i_6]);
            head[i_6].className = 'navbar navbar-inverse';
        }
        for (var i_7 = 0; i_7 < headButton.length; i_7++) {
            if (before === 'default') {
                headButton[i_7].classList.remove('btn-default');
            }
            headButton[i_7].classList.add('btn-inverse');
        }
        for (var i_8 = 0; i_8 < fa.length; i_8++) {
            fa[i_8].setAttribute('style', 'color:white');
        }
        fp.setAttribute('style', 'background-color:#282828');
        for (var i_9 = 0; i_9 < p.length; i_9++) {
            p[i_9].style.color = '#fff';
        }
        for (var i_10 = 0; i_10 < h1.length; i_10++) {
            h1[i_10].style.color = '#ccc';
        }
        changeTextColor('#fff');
        diffp.style.color = '#fff';
        diffp.style.backgroundColor = '#282828';
        diffPanel.style.backgroundColor = '#282828';
        network.style.backgroundColor = '#181818';
        footer.style.backgroundColor = '#282828';
        arp.style.backgroundColor = '#282828';
        auth.style.backgroundColor = '#282828';
        rememberLogin.style.color = '#ccc';
        repoName.style.color = '#fff';
        branchName.style.color = '#fff';
        modifiedTitle.style.color = '#fff';
        stagedTitle.style.color = '#fff';
        diffChangePopUp.style.backgroundColor = '#282828';
        commitDiffPanel.style.backgroundColor = '#282828';
        if (modifiedMessageColor != null) {
            modifiedMessageColor.style.color = '#fff';
        }
        if (stagedMessageColor != null) {
            stagedMessageColor.style.color = '#fff';
        }
        before = 'default';
    }
    function changeTextColor(textColor) {
        for (var i_11 = 0; i_11 < diffChangePanelText.length; i_11++) {
            diffChangePanelText[i_11].setAttribute('style', 'color:' + textColor);
        }
    }
    editor.style.color = diffp.style.color;
    editor.style.backgroundColor = network.style.backgroundColor;
    var navbarStyle = head[0].className.split(" ")[1];
    for (var i_12 = 0; i_12 < editorHeader.length; i_12++) {
        editorHeader[i_12].className = 'editor-header ' + navbarStyle;
    }
    editorFileTab.style.color = repoName.style.color;
    editorFileTab.style.backgroundColor = fp.style.backgroundColor;
    editorEditors.style.color = diffp.style.color;
    editorEditors.style.backgroundColor = diffp.style.backgroundColor;
    editorIndentSelector.style.color = repoName.style.color;
    editorIndentDropdown.style.color = diffp.style.color;
    editorIndentDropdown.style.backgroundColor = diffp.style.backgroundColor;
}
