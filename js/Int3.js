// ComfyUI.mytoolkit.Int3 - Elmar Krüger 2025
import { app } from "../../scripts/app.js";

class MXInt3
{
    constructor(node)
    {
        this.node = node;
        this.node.properties = this.node.properties || {};

        // Initialize Int values (1-3)
        for(let i=1; i<=3; i++) {
            if (this.node.properties[`value${i}`] === undefined) this.node.properties[`value${i}`] = 0;
            if (this.node.properties[`label${i}`] === undefined) this.node.properties[`label${i}`] = `Int ${i}`;
        }

        const fontsize = LiteGraph.NODE_SUBTEXT_SIZE;
        const shiftLeft = 10;
        const shiftRight = 60;
        const rowHeight = 30;
        const startY = 30;

        this.node.onAdded = function ()
        {
            this.size = [300, 140];

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

            // Update Ints
            for(let i=1; i<=3; i++) {
                let val = parseInt(this.properties[`value${i}`]);
                if (isNaN(val)) val = 0;
                if (val < 0) val = 0;
                if (val > 4294967296) val = 4294967296;
                this.properties[`value${i}`] = val;
                if(this.widgets && this.widgets[i-1]) this.widgets[i-1].value = val;
            }
        }

        this.node.onDrawForeground = function(ctx)
        {
            this.configured = true;
            if ( this.flags.collapsed ) return false;

            if (this.size[1] < 140) this.size[1] = 140;

            // Helper for roundRect
            const drawRoundRect = (x, y, w, h, r) => {
                if (ctx.roundRect) {
                    ctx.beginPath();
                    ctx.roundRect(x, y, w, h, r);
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    ctx.rect(x, y, w, h);
                    ctx.fill();
                }
            };

            // Draw Ints (Rows 0-2)
            for(let i=0; i<3; i++) {
                let y = startY + (i * rowHeight);

                // Label
                ctx.fillStyle=LiteGraph.NODE_TEXT_COLOR;
                ctx.font = (fontsize) + "px Arial";
                ctx.textAlign = "left";
                ctx.fillText(this.properties[`label${i+1}`], shiftLeft, y-8);

                // Value Box Background
                ctx.fillStyle="rgba(20,20,20,0.5)";
                drawRoundRect(shiftLeft, y-5, this.size[0]-shiftLeft-shiftRight, 20, 2);

                // Arrows
                let boxRight = this.size[0]-shiftRight;
                let arrowY = y + 5;

                // Left Arrow (<)
                ctx.fillStyle = "rgba(100,100,100,0.8)";
                ctx.beginPath();
                ctx.moveTo(boxRight - 35, arrowY);
                ctx.lineTo(boxRight - 25, arrowY - 6);
                ctx.lineTo(boxRight - 25, arrowY + 6);
                ctx.fill();

                // Right Arrow (>)
                ctx.beginPath();
                ctx.moveTo(boxRight - 5, arrowY);
                ctx.lineTo(boxRight - 15, arrowY - 6);
                ctx.lineTo(boxRight - 15, arrowY + 6);
                ctx.fill();

                // Value
                ctx.fillStyle=LiteGraph.NODE_TEXT_COLOR;
                ctx.textAlign = "right";
                ctx.fillText(this.properties[`value${i+1}`], boxRight - 45, y+10);
            }
        }

        this.node.onDblClick = function(e, pos, canvas)
        {
            let localY = e.canvasY - this.pos[1];
            let localX = e.canvasX - this.pos[0];
            let row = Math.floor((localY - (startY - 15)) / rowHeight);

            if (row >= 0 && row < 3) {
                let y = startY + (row * rowHeight);
                let isLabel = localY < (y - 5);
                let idx = row + 1;

                if (isLabel) {
                    canvas.prompt(`Label Int ${idx}`, this.properties[`label${idx}`], function(v) {
                        if (v!==null) { this.properties[`label${idx}`] = v; this.setDirtyCanvas(true, true); }
                    }.bind(this), e);
                } else {
                    // Check if not clicking arrows
                    let boxRight = this.size[0]-shiftRight;
                    if (localX < boxRight - 40) {
                         canvas.prompt(`Value Int ${idx}`, this.properties[`value${idx}`], function(v) {
                            if (!isNaN(Number(v))) { this.properties[`value${idx}`] = Number(v); this.onPropertyChanged(); }
                        }.bind(this), e);
                    }
                }
                return true;
            }
        }

        this.node.onMouseDown = function(e)
        {
            let localY = e.canvasY - this.pos[1];
            let row = Math.floor((localY - (startY - 15)) / rowHeight);

            if (row >= 0 && row < 3) {
                let idx = row + 1;
                let boxRight = this.size[0]-shiftRight;
                let localX = e.canvasX - this.pos[0];

                // Check arrows
                if (localX >= boxRight - 35 && localX <= boxRight - 25) {
                    this.properties[`value${idx}`] = Math.max(0, this.properties[`value${idx}`] - 1);
                    this.onPropertyChanged();
                    return true;
                } else if (localX >= boxRight - 15 && localX <= boxRight - 5) {
                    this.properties[`value${idx}`] = Math.min(4294967296, this.properties[`value${idx}`] + 1);
                    this.onPropertyChanged();
                    return true;
                }
            }
            return false;
        }

        this.node.computeSize = () => [300, 140];
    }
}

app.registerExtension(
{
    name: "mxInt3",
    async beforeRegisterNodeDef(nodeType, nodeData, _app)
    {
        if (nodeData.name === "mxInt3")
        {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) onNodeCreated.apply(this, []);
                this.mxInt3 = new MXInt3(this);
            }
        }
    }
});
