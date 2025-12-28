// ComfyUI.mytoolkit.InputSwitch3 v.1.0.0 - Elmar Krüger 2025
import { app } from "../../scripts/app.js";

class MXInputSwitch3 {
    constructor(node) {
        this.node = node;
        this.node.properties = this.node.properties || {};

        // Initialize properties
        this.node.properties.selectA = 1;
        this.node.properties.selectB = 0;
        this.node.properties.selectC = 0;
        this.node.properties.labelA = "Input A";
        this.node.properties.labelB = "Input B";
        this.node.properties.labelC = "Input C";

        // Configuration for drawing
        this.layout = {
            toggleWidth: 40,
            toggleHeight: 18,
            toggleRightMargin: 20,
            labelLeftMargin: 20,
            cornerRadius: 9
        };
    }

    setupWidgets() {
        if (!this.node.widgets) return;
        
        // Find and hide the integer widgets
        for (const w of this.node.widgets) {
            if (w.name === "select_A" || w.name === "select_B" || w.name === "select_C") {
                w.hidden = true;
                w.type = "hidden";
                w.computeSize = () => [0, 0];
            }
        }
    }

    updateWidgetsFromProperties() {
        if (!this.node.widgets) return;
        
        const wA = this.node.widgets.find(w => w.name === "select_A");
        const wB = this.node.widgets.find(w => w.name === "select_B");
        const wC = this.node.widgets.find(w => w.name === "select_C");

        if (wA) wA.value = this.node.properties.selectA;
        if (wB) wB.value = this.node.properties.selectB;
        if (wC) wC.value = this.node.properties.selectC;
    }

    handlePropertyChange(propName) {
        // Ensure mutual exclusivity
        if (propName === "selectA" && this.node.properties.selectA === 1) {
            this.node.properties.selectB = 0;
            this.node.properties.selectC = 0;
        } else if (propName === "selectB" && this.node.properties.selectB === 1) {
            this.node.properties.selectA = 0;
            this.node.properties.selectC = 0;
        } else if (propName === "selectC" && this.node.properties.selectC === 1) {
            this.node.properties.selectA = 0;
            this.node.properties.selectB = 0;
        }

        // Ensure at least one is selected (radio behavior)
        if (this.node.properties.selectA === 0 && 
            this.node.properties.selectB === 0 && 
            this.node.properties.selectC === 0) {
            this.node.properties.selectA = 1;
        }

        this.updateWidgetsFromProperties();
    }

    draw(ctx) {
        if (this.node.flags.collapsed) return;

        // Ensure size is sufficient
        if (this.node.size[1] < 110) this.node.size[1] = 110;

        const inputs = this.node.inputs;
        if (!inputs) return;

        ctx.save();
        
        // Iterate through inputs to find our targets
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            // Identify input A, B, C by index
            let isInputA = i === 0;
            let isInputB = i === 1;
            let isInputC = i === 2;

            if (!isInputA && !isInputB && !isInputC) continue;

            // Get exact position of the slot
            const linkPos = this.node.getConnectionPos(true, i);
            const slotY = linkPos[1] - this.node.pos[1]; // Relative Y

            // Determine state
            let isSelected = false;
            let label = "";

            if (isInputA) {
                isSelected = this.node.properties.selectA;
                label = this.node.properties.labelA;
            } else if (isInputB) {
                isSelected = this.node.properties.selectB;
                label = this.node.properties.labelB;
            } else if (isInputC) {
                isSelected = this.node.properties.selectC;
                label = this.node.properties.labelC;
            }

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
            if (i > 2) break; // Only handle first three inputs

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
                } else if (i === 1) { // Input B
                    if (this.node.properties.selectB === 0) {
                        this.node.properties.selectB = 1;
                        this.handlePropertyChange("selectB");
                        this.node.setDirtyCanvas(true, true);
                    }
                } else if (i === 2) { // Input C
                    if (this.node.properties.selectC === 0) {
                        this.node.properties.selectC = 1;
                        this.handlePropertyChange("selectC");
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
            if (i > 2) break;

            const linkPos = this.node.getConnectionPos(true, i);
            const slotY = linkPos[1] - this.node.pos[1];
            
            // Check label click area (left side)
            const tx = this.node.size[0] - this.layout.toggleRightMargin - this.layout.toggleWidth;
            
            if (localY >= slotY - 10 && localY <= slotY + 10 &&
                localX >= this.layout.labelLeftMargin && localX < tx - 10) {
                
                let propName = "";
                if (i === 0) propName = "labelA";
                else if (i === 1) propName = "labelB";
                else if (i === 2) propName = "labelC";

                const currentLabel = this.node.properties[propName];
                const labelLetter = i === 0 ? 'A' : (i === 1 ? 'B' : 'C');
                
                const canvas = app.canvas;
                canvas.prompt(`Label ${labelLetter}`, currentLabel, (v) => {
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
    name: "mxInputSwitch3",
    async beforeRegisterNodeDef(nodeType, nodeData, _app) {
        if (nodeData.name === "mxInputSwitch3") {
            
            // Override onNodeCreated to attach our handler
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function() {
                if (onNodeCreated) onNodeCreated.apply(this, []);
                this.mxInputSwitch3 = new MXInputSwitch3(this);
                this.mxInputSwitch3.setupWidgets();
            };

            // Override onConfigure to ensure widgets are hidden after load
            const onConfigure = nodeType.prototype.onConfigure;
            nodeType.prototype.onConfigure = function() {
                if (onConfigure) onConfigure.apply(this, arguments);
                if (this.mxInputSwitch3) {
                    this.mxInputSwitch3.setupWidgets();
                    this.mxInputSwitch3.updateWidgetsFromProperties();
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
                if (this.mxInputSwitch3) {
                    this.mxInputSwitch3.draw(ctx);
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

                if (this.mxInputSwitch3 && this.mxInputSwitch3.handleMouseDown(e, localX, localY)) {
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

                if (this.mxInputSwitch3 && this.mxInputSwitch3.handleDblClick(e, localX, localY)) {
                    return true;
                }
                if (onDblClick) return onDblClick.apply(this, arguments);
                return false;
            };
        }
    }
});
