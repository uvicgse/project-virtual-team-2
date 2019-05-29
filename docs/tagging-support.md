# Issue #40: Add Tagging Support

*by Sam Charles & Henri De Boever*
*Group 6 - Virtual Team 2*

## Overview
This document outlines the research and implementation plan done in sprint 1 in response to issue #42 on the Visual Git repository, which can be [found here](https://github.com/uvicgse/project-virtual-team-2/issues/40).

This issue aims to add tagging support for Visual Git, allowing users to tag previous commits and/or commits that are yet to be pushed. More on tags in git found [from Atlassian](https://www.atlassian.com/git/tutorials/inspecting-a-repository/git-tag) and [from the Git SCM website](https://git-scm.com/book/en/v2/Git-Basics-Tagging).

## Functionality
After preliminary research on git tagging, some required functionality for the requested feature was determined. We have separated this into two parts, depending on the difficulty of implementation. This functionality may be added to in future work, but is currently as follows:

Beta Implementation (base tagging support)
* Add lightweight tags to current commits
* Add lightweight tags to previous commits
* Edit lightweight tags on existing commits
* Delete tags on existing commits

Full Implementation:
* View tags for previous commits (hover over in graph view)
* Filter / Search commits based on tags
* View full list of commit tags, and their corresponding commits


## Tools 
The current Visual Git version uses the [NodeGit API](https://www.nodegit.org/api/) to perform git actions. After reviewing the documentation, it appears that the API offers comprehensive tagging functionality. This will be used to implement the functionality described above. Link to the [NodeGit “Tag” API documentation](https://www.nodegit.org/api/tag/).

## Implementation Plan
Since git tags can be assigned as an attribute to any given branch, we suspect that we could make a widget appear out of the nodes that represent branches and commits. The user would press a button located on the top of the screen in the toolbar labelled something like “view version tags”, and the tags for each branch would then be displayed. We could also add a function that would allow the user to modify (add, rename, delete) a tag to the selected branch from the application itself.

Alternatively, we could also make it so that a tag bubble would appear over a node if a user is hovering over the node. This bubble would have the tag info on it for the given node. 

## Proposed Timeline

 | Feature                     | Development        |     Date |
 | --------------------------- | ------------------ | -------: |
 | Create tag dialog           | backend            |    05/31 |
 | Edit / modify existing tags | backend            |    06/02 |
 | Widget design               | frontend           |    06/04 |
 | Search & Filter tags        | backend & frontend | Sprint 3 |




