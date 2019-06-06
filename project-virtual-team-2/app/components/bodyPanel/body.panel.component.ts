import { Component } from "@angular/core";
import { DiffPanelComponent } from "../diffPanel/diff.panel.component";
import { GraphPanelComponent } from "../graphPanel/graph.panel.component";

@Component({
  selector: "body-panel",
  templateUrl: 'app/components/bodyPanel/body.panel.component.html',
  directives: [DiffPanelComponent, GraphPanelComponent]
})

export class BodyPanelComponent {

}
