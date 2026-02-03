import { app } from "../../scripts/app.js";

app.registerExtension({
    name: "Comfy.SwitchCommandCenter",
    async nodeCreated(node) {
        if (node.comfyClass === "SwitchCommandCenter") {
            // Initialize custom labels in properties
            if (!node.properties) node.properties = {};
            if (!node.properties.labels) {
                node.properties.labels = ["Input 1", "Input 2", "Input 3", "Input 4", "Input 5"];
            }

            // Track which label is being edited
            node._editingLabel = -1;
            node._editText = "";

            // Custom draw and mouse handling for toggle widgets with editable labels
            for (let i = 1; i <= 5; i++) {
                const widget = node.widgets.find(w => w.name === `active_${i}`);
                if (widget) {
                    const idx = i - 1;
                    
                    // Store the last drawn Y position for hit detection
                    widget._lastY = 0;
                    
                    widget.draw = function(ctx, n, width, y, height) {
                        this._lastY = y;
                        this._height = height;
                        this._width = width;
                        
                        const label = n.properties.labels[idx] || `Input ${i}`;
                        const isEditing = n._editingLabel === idx;
                        
                        // Draw background
                        ctx.fillStyle = "#232323";
                        ctx.beginPath();
                        ctx.roundRect(15, y, width - 30, height, 4);
                        ctx.fill();
                        
                        // Draw toggle switch on the right side
                        const toggleWidth = 40;
                        const toggleHeight = 20;
                        const toggleX = width - toggleWidth - 25;
                        const toggleY = y + (height - toggleHeight) / 2;
                        
                        // Toggle background
                        ctx.fillStyle = this.value ? "#4a9eff" : "#555";
                        ctx.beginPath();
                        ctx.roundRect(toggleX, toggleY, toggleWidth, toggleHeight, toggleHeight / 2);
                        ctx.fill();
                        
                        // Toggle knob
                        const knobRadius = toggleHeight / 2 - 2;
                        const knobX = this.value ? 
                            toggleX + toggleWidth - knobRadius - 4 : 
                            toggleX + knobRadius + 4;
                        ctx.fillStyle = "#fff";
                        ctx.beginPath();
                        ctx.arc(knobX, toggleY + toggleHeight / 2, knobRadius, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Draw label text on left side (or input box if editing)
                        if (isEditing) {
                            // Draw text input background
                            ctx.fillStyle = "#444";
                            ctx.fillRect(20, y + 2, toggleX - 30, height - 4);
                            ctx.strokeStyle = "#4a9eff";
                            ctx.lineWidth = 1;
                            ctx.strokeRect(20, y + 2, toggleX - 30, height - 4);
                            
                            // Draw editing text with cursor
                            ctx.fillStyle = "#fff";
                            ctx.font = "12px Arial";
                            ctx.textAlign = "left";
                            ctx.textBaseline = "middle";
                            const displayText = n._editText + "|";
                            ctx.fillText(displayText, 25, y + height / 2);
                        } else {
                            ctx.fillStyle = this.value ? "#fff" : "#888";
                            ctx.font = "12px Arial";
                            ctx.textAlign = "left";
                            ctx.textBaseline = "middle";
                            ctx.fillText(label, 25, y + height / 2);
                        }
                    };
                    
                    // Override mouse handler to separate label clicks from toggle clicks
                    widget.mouse = function(event, pos, n) {
                        if (event.type === "pointerdown") {
                            const localX = pos[0];
                            const toggleX = this._width - 40 - 25;
                            
                            if (localX >= toggleX) {
                                // Clicked on toggle switch area - toggle the value
                                this.value = !this.value;
                                app.graph.setDirtyCanvas(true, true);
                                return true;
                            } else if (localX >= 15 && localX < toggleX - 5) {
                                // Clicked on label area - start editing
                                // First, save any currently editing label
                                if (n._editingLabel >= 0 && n._editingLabel !== idx) {
                                    n.properties.labels[n._editingLabel] = n._editText || `Input ${n._editingLabel + 1}`;
                                }
                                n._editingLabel = idx;
                                n._editText = n.properties.labels[idx] || `Input ${idx + 1}`;
                                app.graph.setDirtyCanvas(true, true);
                                return true;
                            }
                        }
                        return false;
                    };
                }
            }

            // Handle clicks outside widgets to finish editing
            const origOnMouseDown = node.onMouseDown;
            node.onMouseDown = function(e, localPos, graphCanvas) {
                // If clicking elsewhere while editing, finish editing
                if (this._editingLabel >= 0) {
                    this.properties.labels[this._editingLabel] = this._editText || `Input ${this._editingLabel + 1}`;
                    this._editingLabel = -1;
                    app.graph.setDirtyCanvas(true, true);
                }
                
                if (origOnMouseDown) return origOnMouseDown.apply(this, arguments);
            };

            // Handle keyboard input for label editing
            const origOnKeyDown = node.onKeyDown;
            node.onKeyDown = function(e) {
                if (this._editingLabel >= 0) {
                    if (e.key === "Enter" || e.key === "Escape") {
                        if (e.key === "Enter") {
                            this.properties.labels[this._editingLabel] = this._editText || `Input ${this._editingLabel + 1}`;
                        }
                        this._editingLabel = -1;
                        app.graph.setDirtyCanvas(true, true);
                        e.preventDefault();
                        return true;
                    } else if (e.key === "Backspace") {
                        this._editText = this._editText.slice(0, -1);
                        app.graph.setDirtyCanvas(true, true);
                        e.preventDefault();
                        return true;
                    } else if (e.key.length === 1) {
                        this._editText += e.key;
                        app.graph.setDirtyCanvas(true, true);
                        e.preventDefault();
                        return true;
                    }
                }
                if (origOnKeyDown) return origOnKeyDown.apply(this, arguments);
            };

            // Add buttons at the end
            node.addWidget("button", "TOGGLE ALL", "", function(w, canvas, n, pos, event) {
                for (let i = 1; i <= 5; i++) {
                    const activeWidget = n.widgets.find(w => w.name === `active_${i}`);
                    if (activeWidget) {
                        activeWidget.value = !activeWidget.value;
                    }
                }
                app.graph.setDirtyCanvas(true, true);
            });

            node.addWidget("button", "ENABLE ALL", "", function(w, canvas, n, pos, event) {
                for (let i = 1; i <= 5; i++) {
                    const activeWidget = n.widgets.find(w => w.name === `active_${i}`);
                    if (activeWidget) {
                        activeWidget.value = true;
                    }
                }
                app.graph.setDirtyCanvas(true, true);
            });

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
