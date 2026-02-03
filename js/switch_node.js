import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "Comfy.SwitchCommandCenter",
    async nodeCreated(node) {
        if (node.comfyClass === "SwitchCommandCenter") {
            // Initialize labels property if not exists
            if (!node.properties) node.properties = {};
            if (!node.properties.labels) {
                node.properties.labels = ["Input 1", "Input 2", "Input 3", "Input 4", "Input 5"];
            }

            // Override drawForeground to show labels
            const origDraw = node.onDrawForeground;
            node.onDrawForeground = function(ctx) {
                if (origDraw) origDraw.apply(this, arguments);
                if (this.flags.collapsed) return;

                ctx.save();
                ctx.fillStyle = "#fff";
                ctx.font = "12px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                for(let i=0; i<5; i++) {
                     // Find input position
                     const pos = this.getConnectionPos(true, i);
                     const label = this.properties.labels[i];
                     if(label) {
                        ctx.fillText(label, this.size/2, pos);
                     }
                }
                ctx.restore();
            };

            // Add Physical Switch Button
            node.addWidget("button", "TOGGLE SWITCH", "", function(w, canvas, node, pos, event) {
                // Find the index of the 'active' widget (the boolean input)
                const activeWidgetIndex = node.widgets.findIndex(w => w.name === "active");
                if (activeWidgetIndex!== -1) {
                    const widget = node.widgets;
                    widget.value =!widget.value; // Toggle state
                    // Visual feedback updates would go here
                    app.graph.setDirtyCanvas(true, true); // Force redraw
                }
            });
        }
    }
});