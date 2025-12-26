// ComfyUI.mytoolkit.MultiSlider4 - Elmar Krüger 2025
import { app } from "../../scripts/app.js";

class MXFloat4
{
    constructor(node)
    {
        this.node = node;
        this.node.properties = this.node.properties || {};

        // Defaults
        this.node.properties.min = 0.00;
        this.node.properties.max = 1.00;
        this.node.properties.step = 0.01;
        this.node.properties.decimals = 2;
        this.node.properties.snap = true;

        // Initialize values
        for(let i=1; i<=4; i++) {
            if (this.node.properties[`value${i}`] === undefined) {
                this.node.properties[`value${i}`] = 0.00;
            }
            if (this.node.properties[`label${i}`] === undefined) {
                this.node.properties[`label${i}`] = `F${i}`;
            }
        }

        this.node.intpos = [0,0,0,0];

        const fontsize = LiteGraph.NODE_SUBTEXT_SIZE;
        const shiftLeft = 10;
        const shiftRight = 90;
        const rowHeight = 30;
        const startY = 30;

        // Hide widgets
        for (let i=0; i<4; i++) {
            if(this.node.widgets[i]) {
                this.node.widgets[i].hidden = true;
                this.node.widgets[i].type = "hidden";
            }
        }

        this.node.onAdded = function ()
        {
            this.size = [210, 160];
            for(let i=1; i<=4; i++) {
                let val = this.properties[`value${i}`];
                let norm = (val - this.properties.min) / (this.properties.max - this.properties.min);
                this.intpos[i-1] = Math.max(0, Math.min(1, norm));
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

            if (this.properties.step <= 0) this.properties.step = 0.01;
            if (this.properties.min >= this.properties.max) this.properties.max = this.properties.min + this.properties.step;

            this.properties.decimals = Math.floor(this.properties.decimals);
            if (this.properties.decimals > 4) this.properties.decimals = 4;
            if (this.properties.decimals < 0) this.properties.decimals = 0;

            for(let i=1; i<=4; i++) {
                let val = this.properties[`value${i}`];
                if (isNaN(val)) val = this.properties.min;
                if (val < this.properties.min) val = this.properties.min;
                if (val > this.properties.max) val = this.properties.max;

                val = Math.round(Math.pow(10, this.properties.decimals) * val) / Math.pow(10, this.properties.decimals);
                this.properties[`value${i}`] = val;

                this.intpos[i-1] = Math.max(0, Math.min(1, (val - this.properties.min) / (this.properties.max - this.properties.min)));

                if(this.widgets[i-1]) {
                    this.widgets[i-1].value = val;
                }
            }
        }

        this.node.onDrawForeground = function(ctx)
        {
            this.configured = true;
            if ( this.flags.collapsed ) return false;

            if (this.size[1] < 160) this.size[1] = 160;

            let dgt = parseInt(this.properties.decimals);

            for(let i=0; i<4; i++) {
                let y = startY + (i * rowHeight);

                // Track
                ctx.fillStyle="rgba(20,20,20,0.5)";
                ctx.beginPath();
                ctx.roundRect( shiftLeft, y-1, this.size[0]-shiftRight-shiftLeft, 4, 2);
                ctx.fill();

                // Knob
                let x = shiftLeft + (this.size[0]-shiftRight-shiftLeft) * this.intpos[i];
                ctx.fillStyle=LiteGraph.NODE_TEXT_COLOR;
                ctx.beginPath();
                ctx.arc(x, y+1, 7, 0, 2 * Math.PI, false);
                ctx.fill();

                ctx.lineWidth = 1.5;
                ctx.strokeStyle=node.bgcolor || LiteGraph.NODE_DEFAULT_BGCOLOR;
                ctx.beginPath();
                ctx.arc(x, y+1, 5, 0, 2 * Math.PI, false);
                ctx.stroke();

                // Text
                ctx.fillStyle=LiteGraph.NODE_TEXT_COLOR;
                ctx.font = (fontsize) + "px Arial";
                ctx.textAlign = "center";
                ctx.fillText(this.properties[`value${i+1}`].toFixed(dgt), this.size[0]-shiftRight+24, y+5);

                // Label
                ctx.textAlign = "left";
                ctx.fillText(this.properties[`label${i+1}`], shiftLeft, y-8);
            }
        }

        this.node.onDblClick = function(e, pos, canvas)
        {
            let localY = e.canvasY - this.pos[1];
            let index = -1;
            for(let i=0; i<4; i++) {
                let y = startY + (i * rowHeight);
                if (localY >= y - 15 && localY <= y + 15) {
                    index = i;
                    break;
                }
            }

            if (index !== -1) {
                // Check if clicked on label area (top half of the row)
                let y = startY + (index * rowHeight);
                if (localY < y) {
                     canvas.prompt(`Label ${index+1}`, this.properties[`label${index+1}`], function(v) {
                        if (v !== null) {
                            this.properties[`label${index+1}`] = v;
                            this.setDirtyCanvas(true, true);
                        }
                    }.bind(this), e);
                } else if ( e.canvasX > this.pos[0]+this.size[0]-shiftRight+10 ) {
                    canvas.prompt(`Value ${index+1}`, this.properties[`value${index+1}`], function(v) {
                        if (!isNaN(Number(v))) {
                            this.properties[`value${index+1}`] = Number(v);
                            this.onPropertyChanged();
                        }
                    }.bind(this), e);
                }
                return true;
            }
        }

        this.node.onMouseDown = function(e)
        {
            if ( e.canvasX < this.pos[0]+shiftLeft-5 || e.canvasX > this.pos[0]+this.size[0]-shiftRight+5 ) return false;

            let localY = e.canvasY - this.pos[1];
            let index = -1;

            for(let i=0; i<4; i++) {
                let y = startY + (i * rowHeight);
                if (localY >= y - 15 && localY <= y + 15) {
                    index = i;
                    break;
                }
            }

            if (index === -1) return false;

            this.activeSlider = index;
            this.capture = true;
            this.unlock = false;
            this.captureInput(true);
            this.valueUpdate(e);
            return true;
        }

        this.node.onMouseMove = function(e, pos, canvas)
        {
            if (!this.capture) return;
            if ( canvas.pointer.isDown === false ) { this.onMouseUp(e); return; }
            this.valueUpdate(e);
        }

        this.node.onMouseUp = function(e)
        {
            if (!this.capture) return;
            this.capture = false;
            this.activeSlider = -1;
            this.captureInput(false);
        }

        this.node.valueUpdate = function(e)
        {
            if (this.activeSlider === -1 || this.activeSlider === undefined) return;

            let idx = this.activeSlider;
            let propName = `value${idx+1}`;

            let prevVal = this.properties[propName];
            let rn = Math.pow(10,this.properties.decimals);
            let vX = (e.canvasX - this.pos[0] - shiftLeft)/(this.size[0]-shiftRight-shiftLeft);

            if (e.ctrlKey) this.unlock = true;
            if (e.shiftKey !== this.properties.snap)
            {
                let step = this.properties.step/(this.properties.max - this.properties.min);
                vX = Math.round(vX/step)*step;
            }

            this.intpos[idx] = Math.max(0, Math.min(1, vX));
            let newVal = Math.round(rn*(this.properties.min + (this.properties.max - this.properties.min) * ((this.unlock)?vX:this.intpos[idx])))/rn;

            this.properties[propName] = newVal;

            if(this.widgets[idx]) {
                this.widgets[idx].value = newVal;
            }

            if ( newVal !== prevVal ) {
                this.graph.setisChangedFlag(this.id);
            }
        }

        this.node.computeSize = () => [210, 160];
    }
}

app.registerExtension(
{
    name: "mxFloat4",
    async beforeRegisterNodeDef(nodeType, nodeData, _app)
    {
        if (nodeData.name === "mxFloat4")
        {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) onNodeCreated.apply(this, []);
                this.mxFloat4 = new MXFloat4(this);
            }
        }
    }
});
