#Issue 62: Enable cursor hover over nodes to dispay tags

*Henri De Boever*
*Group 6 - Virtual Team 2*

## Overview

This document's function is to catalogue the research efforts that were done in the context of trying to display the tag name over nodes
 on hover by the user's mouse.

## Key Findings and How to Proceed

Since the application already does a display of the number of commits for a given node each time the user hovers over nodes present in the
graph, the initial effort was focused on trying to mirror the functionality in order to inject the tag name in the same way.

As many tasks end up turning out, this one was more complicated than expected. Instead of directly accessing the attributes of a commit of
a branch, it seems clickedthe current implentation to display the number of commits is happening as a calculation through updating a
bsNode object in real time.

The specific line that displays to the user is located in graphing.ts at line 339. An quick glance at the code in this file would indicate
that wrapping in an additional attribute
from a tag object would be less trivial than one would assume.

The bsNodes seem to be defined in graphSetup.ts on line 20 as a vis.Dataset data structure, so perhaps the definitions could be modified there
to contain a tag name as well?

## Timeline

The time that our team assumed this would take was undermined by the fact that we had made assumptions about the ease of navigation in this code base.
As it stands, there are 2 options, the first being re-engineering the bsNode object to also contain references to tag names in order to display it,
and the other way would be to implement our own component that would call functions that were written for the rest of the tagging functionality.

In either case, we'll have to keep a reference to the node objects being generated in the graph to be sure that the mouse can detect them when the cursor
is over them.

I figured that if we can link the commit of the node currently being hovered, we can then check the hashes with one another,
then return the tag name of the one where the hashes match. The only blockage I have at the moment is that I am unsure as to how to link
the displaying of the tag names at the location of the nodes on the front end.

There are 3 different types of nodes to be dealt with in the case of displaying a tag name, bsNodes, basicNdoes, and Nodes.
