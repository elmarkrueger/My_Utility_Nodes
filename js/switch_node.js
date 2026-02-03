import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "Comfy.SwitchCommandCenter",
    async nodeCreated(node) {
        if (node.comfyClass === "SwitchCommandCenter") {
            // Add button to toggle all switches at once
            node.addWidget("button", "TOGGLE ALL", "", function(w, canvas, n, pos, event) {
                // Find all active_X widgets and toggle them
                for (let i = 1; i <= 5; i++) {
                    const activeWidget = n.widgets.find(w => w.name === `active_${i}`);
                    if (activeWidget) {
                        activeWidget.value = !activeWidget.value;
                    }
                }
                app.graph.setDirtyCanvas(true, true);
            });

            // Add button to enable all switches
            node.addWidget("button", "ENABLE ALL", "", function(w, canvas, n, pos, event) {
                for (let i = 1; i <= 5; i++) {
                    const activeWidget = n.widgets.find(w => w.name === `active_${i}`);
                    if (activeWidget) {
                        activeWidget.value = true;
                    }
                }
                app.graph.setDirtyCanvas(true, true);
            });

            // Add button to disable all switches
            node.addWidget("button", "DISABLE ALL", "", function(w, canvas, n, pos, event) {
                for (let i = 1; i <= 5; i++) {
                    const activeWidget = n.widgets.find(w => w.name === `active_${i}`);
                    if (activeWidget) {
                        activeWidget.value = false;
                    }
                }
                app.graph.setDirtyCanvas(true, true);
            });
        }
    }
});
