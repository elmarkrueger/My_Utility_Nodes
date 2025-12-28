// ComfyUI.mytoolkit.InputSwitch v.1.0.6 - Elmar Krüger 2025
import { app } from "../../scripts/app.js";

class MXInputSwitch {
    constructor(node) {
        this.node = node;
        this.node.properties = this.node.properties || {};

        // Initialize properties
        this.node.properties.selectA = 1;
        this.node.properties.selectB = 0;
        this.node.properties.labelA = "Input A";
        this.node.properties.labelB = "Input B";

        // Configuration for drawing
        this.layout = {
            toggleWidth: 40,
            toggleHeight: 18, // Reduced height to prevent overlap
            toggleRightMargin: 20,
            labelLeftMargin: 20,
            cornerRadius: 9
        };

        // Hide the widgets (select_A, select_B)
        // We do this in onConfigure or onAdded to ensure widgets exist
    }

    setupWidgets() {
        if (!this.node.widgets) return;
        
        // Find and hide the integer widgets
        for (const w of this.node.widgets) {
            if (w.name === "select_A" || w.name === "select_B") {
                w.hidden = true;
                w.type = "hidden"; // This prevents them from being drawn
                w.computeSize = () => [0, 0]; // Ensure they take no space
            }
        }
    }

    updateWidgetsFromProperties() {
        if (!this.node.widgets) return;
        
        const wA = this.node.widgets.find(w => w.name === "select_A");
        const wB = this.node.widgets.find(w => w.name === "select_B");

        if (wA) wA.value = this.node.properties.selectA;
        if (wB) wB.value = this.node.properties.selectB;
    }

    handlePropertyChange(propName) {
        // Ensure mutual exclusivity
        if (propName === "selectA" && this.node.properties.selectA === 1) {
            this.node.properties.selectB = 0;
        } else if (propName === "selectB" && this.node.properties.selectB === 1) {
            this.node.properties.selectA = 0;
        }

        // Ensure at least one is selected (radio behavior)
        if (this.node.properties.selectA === 0 && this.node.properties.selectB === 0) {
            this.node.properties.selectA = 1;
        }

        this.updateWidgetsFromProperties();
    }

    draw(ctx) {
        if (this.node.flags.collapsed) return;

        // Ensure size is sufficient
        if (this.node.size[1] < 80) this.node.size[1] = 80;

        const inputs = this.node.inputs;
        if (!inputs) return;

        ctx.save();
        
        // Iterate through inputs to find our targets
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            // Identify input A and B by name or index if names are cleared
            // We assume index 0 is A and index 1 is B based on Python definition
            let isInputA = i === 0;
            let isInputB = i === 1;

            if (!isInputA && !isInputB) continue;

            // Get exact position of the slot
            // getConnectionPos returns [x, y] in canvas coordinates
            const linkPos = this.node.getConnectionPos(true, i);
            const slotY = linkPos[1] - this.node.pos[1]; // Relative Y

            // Determine state
            const isSelected = isInputA ? this.node.properties.selectA : this.node.properties.selectB;
            const label = isInputA ? this.node.properties.labelA : this.node.properties.labelB;

            // 1. Draw Label
            ctx.fillStyle = isSelected ? "#C8DCC8" : "#A0A0A0";
            ctx.font = "12px Arial";
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(label, this.layout.labelLeftMargin, slotY);

            // 2. Draw Toggle
            const tx = this.node.size[0] - this.layout.toggleRightMargin - this.layout.toggleWidth;
            const ty = slotY - (this.layout.toggleHeight / 2);
            
            // Toggle Background
            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(tx, ty, this.layout.toggleWidth, this.layout.toggleHeight, this.layout.cornerRadius);
            } else {
                ctx.rect(tx, ty, this.layout.toggleWidth, this.layout.toggleHeight);
            }
            
            ctx.fillStyle = isSelected ? "#46AA46" : "#323232";
            ctx.fill();
            
            // Toggle Border
            ctx.strokeStyle = isSelected ? "#5AC85A" : "#464646";
            ctx.lineWidth = 1;
            ctx.stroke();

            // Toggle Knob
            const knobSize = this.layout.toggleHeight - 4;
            const knobX = isSelected 
                ? (tx + this.layout.toggleWidth - knobSize - 2) 
                : (tx + 2);
            const knobY = ty + 2;

            ctx.beginPath();
            ctx.arc(knobX + knobSize/2, knobY + knobSize/2, knobSize/2, 0, Math.PI * 2);
            ctx.fillStyle = isSelected ? "#FFFFFF" : "#B0B0B0";
            ctx.fill();

            // Text inside toggle (ON/OFF)
            ctx.font = "bold 9px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            const textX = isSelected 
                ? (tx + (this.layout.toggleWidth - knobSize)/2) 
                : (tx + this.layout.toggleWidth - (this.layout.toggleWidth - knobSize)/2);
            
            ctx.fillStyle = isSelected ? "rgba(255,255,255,0.9)" : "rgba(100,100,100,0.8)";
            ctx.fillText(isSelected ? "ON" : "OFF", textX, ty + this.layout.toggleHeight/2);
        }

        ctx.restore();
    }

    handleMouseDown(e, localX, localY) {
        const inputs = this.node.inputs;
        if (!inputs) return false;

        for (let i = 0; i < inputs.length; i++) {
            if (i > 1) break; // Only handle first two inputs

            const linkPos = this.node.getConnectionPos(true, i);
            const slotY = linkPos[1] - this.node.pos[1];
            
            // Check toggle click area
            const tx = this.node.size[0] - this.layout.toggleRightMargin - this.layout.toggleWidth;
            const ty = slotY - (this.layout.toggleHeight / 2);
            
            if (localX >= tx && localX <= tx + this.layout.toggleWidth &&
                localY >= ty && localY <= ty + this.layout.toggleHeight) {
                
                // Toggle clicked
                if (i === 0) { // Input A
                    if (this.node.properties.selectA === 0) {
                        this.node.properties.selectA = 1;
                        this.handlePropertyChange("selectA");
                        this.node.setDirtyCanvas(true, true);
                    }
                } else { // Input B
                    if (this.node.properties.selectB === 0) {
                        this.node.properties.selectB = 1;
                        this.handlePropertyChange("selectB");
                        this.node.setDirtyCanvas(true, true);
                    }
                }
                return true; // Handled
            }
        }
        return false;
    }

    handleDblClick(e, localX, localY) {
        const inputs = this.node.inputs;
        if (!inputs) return false;

        for (let i = 0; i < inputs.length; i++) {
            if (i > 1) break;

            const linkPos = this.node.getConnectionPos(true, i);
            const slotY = linkPos[1] - this.node.pos[1];
            
            // Check label click area (left side)
            const tx = this.node.size[0] - this.layout.toggleRightMargin - this.layout.toggleWidth;
            
            if (localY >= slotY - 10 && localY <= slotY + 10 &&
                localX >= this.layout.labelLeftMargin && localX < tx - 10) {
                
                const propName = (i === 0) ? "labelA" : "labelB";
                const currentLabel = this.node.properties[propName];
                
                const canvas = app.canvas;
                canvas.prompt(`Label ${i === 0 ? 'A' : 'B'}`, currentLabel, (v) => {
                    if (v !== null) {
                        this.node.properties[propName] = v;
                        this.node.setDirtyCanvas(true, true);
                    }
                }, e);
                return true;
            }
        }
        return false;
    }
}

app.registerExtension({
    name: "mxInputSwitch",
    async beforeRegisterNodeDef(nodeType, nodeData, _app) {
        if (nodeData.name === "mxInputSwitch") {
            
            // Override onNodeCreated to attach our handler
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function() {
                if (onNodeCreated) onNodeCreated.apply(this, []);
                this.mxInputSwitch = new MXInputSwitch(this);
                this.mxInputSwitch.setupWidgets();
            };

            // Override onConfigure to ensure widgets are hidden after load
            const onConfigure = nodeType.prototype.onConfigure;
            nodeType.prototype.onConfigure = function() {
                if (onConfigure) onConfigure.apply(this, arguments);
                if (this.mxInputSwitch) {
                    this.mxInputSwitch.setupWidgets();
                    this.mxInputSwitch.updateWidgetsFromProperties();
                }
            };

            // Override onDrawBackground to hide default labels
            nodeType.prototype.onDrawBackground = function(ctx) {
                if (this.inputs) {
                    for (const input of this.inputs) {
                        input.label = " "; // Hide default label
                    }
                }
                if (this.outputs) {
                    for (const output of this.outputs) {
                        output.label = " "; // Hide default label
                    }
                }
            };

            // Override onDrawForeground to draw our custom UI
            nodeType.prototype.onDrawForeground = function(ctx) {
                if (this.mxInputSwitch) {
                    this.mxInputSwitch.draw(ctx);
                }
            };

            // Override onMouseDown for toggle interaction
            const onMouseDown = nodeType.prototype.onMouseDown;
            nodeType.prototype.onMouseDown = function(e, pos) {
                let localX, localY;
                if (pos && pos.length >= 2) {
                    localX = pos[0];
                    localY = pos[1];
                } else {
                    localX = e.canvasX - this.pos[0];
                    localY = e.canvasY - this.pos[1];
                }

                if (this.mxInputSwitch && this.mxInputSwitch.handleMouseDown(e, localX, localY)) {
                    return true; // Stop propagation if handled
                }
                if (onMouseDown) return onMouseDown.apply(this, arguments);
                return false;
            };

            // Override onDblClick for label renaming
            const onDblClick = nodeType.prototype.onDblClick;
            nodeType.prototype.onDblClick = function(e, pos) {
                let localX, localY;
                if (pos && pos.length >= 2) {
                    localX = pos[0];
                    localY = pos[1];
                } else {
                    localX = e.canvasX - this.pos[0];
                    localY = e.canvasY - this.pos[1];
                }

                if (this.mxInputSwitch && this.mxInputSwitch.handleDblClick(e, localX, localY)) {
                    return true;
                }
                if (onDblClick) return onDblClick.apply(this, arguments);
                return false;
            };
        }
    }
});
