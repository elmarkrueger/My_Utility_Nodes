// ComfyUI.mytoolkit.String3 - Elmar Krüger 2025
import { app } from "../../scripts/app.js";

class MXString3
{
    constructor(node)
    {
        this.node = node;
        this.node.properties = this.node.properties || {};

        // Initialize String values (1-3)
        for(let i=1; i<=3; i++) {
            if (this.node.properties[`value${i}`] === undefined) this.node.properties[`value${i}`] = "";
            if (this.node.properties[`label${i}`] === undefined) this.node.properties[`label${i}`] = `String ${i}`;
        }

        // --- LAYOUT KONFIGURATION ---
        const fontsize = LiteGraph.NODE_SUBTEXT_SIZE;
        const shiftLeft = 10;
        const shiftRight = 30; // Etwas weniger Rand rechts für mehr Platz
        
        // Hier wurde der Platz vergrößert:
        const rowHeight = 50;  // War 30, jetzt 50 für mehr "Luft"
        const startY = 50;     // Startet etwas tiefer, damit der Header nicht stört
        const boxHeight = 24;  // Höhe der Eingabebox
        const labelGap = 5;    // Abstand zwischen Label und Box

        // Gesamthöhe der Node berechnen (Header + 3 Zeilen + Puffer)
        const totalHeight = startY + (3 * rowHeight) + 10;

        this.node.onAdded = function ()
        {
            this.size = [300, totalHeight];

            // Hide widgets
            if (this.widgets) {
                for (let i=0; i<this.widgets.length; i++) {
                    this.widgets[i].hidden = true;
                    this.widgets[i].type = "hidden";
                }
            }
        };

        this.node.onGraphConfigured = function ()
        {
            this.configured = true;
            this.onPropertyChanged();
        }

        this.node.onPropertyChanged = function (propName)
        {
            if (!this.configured) return;

            // Update Strings
            for(let i=1; i<=3; i++) {
                let val = String(this.properties[`value${i}`]);
                if (val.length > 255) val = val.substring(0, 255);
                this.properties[`value${i}`] = val;
                if(this.widgets && this.widgets[i-1]) this.widgets[i-1].value = val;
            }
        }

        this.node.onDrawForeground = function(ctx)
        {
            this.configured = true;
            if ( this.flags.collapsed ) return false;

            if (this.size[1] < totalHeight) this.size[1] = totalHeight;

            // Helper for roundRect
            const drawRoundRect = (x, y, w, h, r) => {
                ctx.beginPath();
                if (ctx.roundRect) {
                    ctx.roundRect(x, y, w, h, r);
                } else {
                    ctx.rect(x, y, w, h);
                }
                ctx.fill();
            };

            // Draw Strings (Rows 0-2)
            for(let i=0; i<3; i++) {
                // Berechnung der Y-Position für diese Zeile
                let rowBaseY = startY + (i * rowHeight);
                
                // Positionen für Label und Box
                let labelY = rowBaseY; 
                let boxY = rowBaseY + labelGap + 5; // Box beginnt unter dem Label

                // 1. Label zeichnen
                ctx.fillStyle = LiteGraph.NODE_TEXT_COLOR;
                ctx.font = fontsize + "px Arial";
                ctx.textAlign = "left";
                ctx.fillText(this.properties[`label${i+1}`], shiftLeft, labelY);

                // 2. Value Box Hintergrund zeichnen
                ctx.fillStyle = "rgba(20,20,20,0.5)"; // Dunkler Hintergrund für Box
                drawRoundRect(shiftLeft, boxY, this.size[0] - shiftLeft - shiftRight, boxHeight, 4);

                // 3. Value Text zeichnen (abgeschnitten für Display)
                let val = this.properties[`value${i+1}`];
                ctx.fillStyle = "#AAA"; // Etwas hellerer Text für den Wert
                ctx.textAlign = "left";
                
                // Clipping (damit Text nicht aus der Box ragt)
                ctx.save();
                ctx.beginPath();
                ctx.rect(shiftLeft, boxY, this.size[0] - shiftLeft - shiftRight, boxHeight);
                ctx.clip();
                
                // Text vertikal zentrieren in der Box
                let textY = boxY + (boxHeight / 2) + (fontsize / 3);
                ctx.fillText(val, shiftLeft + 5, textY);
                
                ctx.restore();
            }
        }

        this.node.onDblClick = function(e, pos, canvas)
        {
            let localY = e.canvasY - this.pos[1];
            let localX = e.canvasX - this.pos[0];

            // Wir prüfen, in welcher "Zeile" wir sind
            // Eine Zeile geht von (startY + i*rowHeight) bis zum Start der nächsten
            // Wir ziehen startY ab und teilen durch rowHeight
            let relativeY = localY - (startY - 15); // -15 Toleranz nach oben
            let row = Math.floor(relativeY / rowHeight);

            if (row >= 0 && row < 3) {
                let idx = row + 1;
                
                // Innerhalb der Zeile: War es das Label (oben) oder die Box (unten)?
                // Das Label befindet sich im oberen Drittel der Zeile
                let rowTop = (startY - 15) + (row * rowHeight);
                let clickInRowY = localY - rowTop;
                
                // Wenn Klick im oberen Bereich (ca. 20px), dann Label bearbeiten
                let isLabel = clickInRowY < 25; 

                if (isLabel) {
                    canvas.prompt(`Label String ${idx}`, this.properties[`label${idx}`], function(v) {
                        if (v!==null) { this.properties[`label${idx}`] = v; this.setDirtyCanvas(true, true); }
                    }.bind(this), e);
                } else {
                    if (localX < this.size[0] - shiftRight) {
                        canvas.prompt(`Value String ${idx}`, this.properties[`value${idx}`], function(v) {
                            if (v!==null) { this.properties[`value${idx}`] = v; this.onPropertyChanged(); }
                        }.bind(this), e);
                    }
                }
                return true;
            }
        }

        this.node.computeSize = () => [300, totalHeight];
    }
}

app.registerExtension(
{
    name: "mxString3",
    async beforeRegisterNodeDef(nodeType, nodeData, _app)
    {
        if (nodeData.name === "mxString3")
        {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) onNodeCreated.apply(this, []);
                this.mxString3 = new MXString3(this);
            }
        }
    }
});