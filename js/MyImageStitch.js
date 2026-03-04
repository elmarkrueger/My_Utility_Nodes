import { app } from "../../scripts/app.js";

/**
 * ImageStitchHandler — Manages the interactive drag-and-drop canvas
 * for reordering image thumbnails within the ImageStitch node.
 */
class ImageStitchHandler {
    constructor(node) {
        this.node = node;
        this.items = [];            // [{key, img, loaded, linkId}]
        this.drag = { active: false, srcIdx: -1, overIdx: -1 };
        this._imgCache = {};        // Cache fetched Image objects by src URL

        // Layout constants
        this.THUMB_SIZE = 64;
        this.GAP = 8;
        this.PAD = 12;
        this.AREA_PAD = 10;
        this.LABEL_HEIGHT = 14;
    }

    /** Current layout mode from the layout widget. */
    get layout() {
        return this.node.widgets?.find(w => w.name === "layout")?.value || "Horizontal";
    }

    /** Reference to the hidden order_payload widget. */
    get orderWidget() {
        return this.node.widgets?.find(w => w.name === "order_payload");
    }

    // ─── Connection Management ─────────────────────────────────

    /**
     * Scan the node's inputs and update the internal items array.
     * Preserves existing order; appends newly connected images at the end.
     */
    refreshConnections() {
        if (!this.node.inputs) return;

        const connected = [];
        for (const inp of this.node.inputs) {
            if (inp.name?.startsWith("image_") && inp.link != null) {
                connected.push({ key: inp.name, linkId: inp.link });
            }
        }

        const connectedKeys = new Set(connected.map(c => c.key));
        const existingKeys = new Set(this.items.map(it => it.key));

        // Remove disconnected items
        this.items = this.items.filter(it => connectedKeys.has(it.key));

        // Add newly connected items at the end
        for (const c of connected) {
            if (!existingKeys.has(c.key)) {
                this.items.push({
                    key: c.key,
                    img: null,
                    loaded: false,
                    linkId: c.linkId,
                });
            } else {
                // Update linkId in case it changed (reconnection)
                const item = this.items.find(it => it.key === c.key);
                if (item) item.linkId = c.linkId;
            }
        }

        this.serializeOrder();
    }

    /**
     * Restore saved order from the serialized order_payload.
     * Called on workflow load (onConfigure).
     */
    restoreOrder(savedOrder) {
        if (!Array.isArray(savedOrder) || savedOrder.length === 0) return;

        const itemMap = new Map(this.items.map(it => [it.key, it]));
        const reordered = [];
        const used = new Set();

        for (const entry of savedOrder) {
            const key = entry?.source_socket;
            if (key && itemMap.has(key) && !used.has(key)) {
                reordered.push(itemMap.get(key));
                used.add(key);
            }
        }
        // Append any remaining items not in the saved order
        for (const it of this.items) {
            if (!used.has(it.key)) reordered.push(it);
        }
        this.items = reordered;
    }

    // ─── Thumbnail Preview Fetching ────────────────────────────

    /**
     * Try to fetch preview thumbnails from upstream connected nodes.
     * Only fetches for items that don't have a loaded preview yet.
     */
    tryFetchPreviews() {
        for (const item of this.items) {
            if (item.loaded) continue;
            this._fetchPreview(item);
        }
    }

    _fetchPreview(item) {
        try {
            const link = app.graph.links?.[item.linkId]
                      ?? app.graph.links?.get?.(item.linkId);
            if (!link) return;

            const origin = app.graph.getNodeById(link.origin_id);
            if (!origin?.imgs?.length) return;

            // Use the correct output slot index, fallback to first image
            const slotIdx = link.origin_slot ?? 0;
            const imgEl = origin.imgs[slotIdx] ?? origin.imgs[0];
            const src = imgEl?.src;
            if (!src) return;

            // Use cached image if available
            if (this._imgCache[src]?.complete) {
                item.img = this._imgCache[src];
                item.loaded = true;
                return;
            }

            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                item.img = img;
                item.loaded = true;
                this._imgCache[src] = img;
                this.node.setDirtyCanvas(true, true);
            };
            img.onerror = () => { /* Preview not available */ };
            img.src = src;
        } catch (_) {
            /* Silently ignore — preview not available yet */
        }
    }

    // ─── Serialization ─────────────────────────────────────────

    /** Write the current order to the hidden widget for backend consumption. */
    serializeOrder() {
        const w = this.orderWidget;
        if (!w) return;
        const payload = this.items.map((it, i) => ({
            layer_index: i,
            source_socket: it.key
        }));
        w.value = JSON.stringify(payload);
    }

    // ─── Layout Calculations ───────────────────────────────────

    /** Calculate the Y position below all visible widgets. */
    _getWidgetBottom() {
        let bottom = 70; // Safe default: title + 2 widgets
        if (this.node.widgets) {
            for (const w of this.node.widgets) {
                if (w.last_y == null) continue;
                const wh = w.computeSize?.(this.node.size?.[0] || 200)?.[1];
                if (wh != null && wh <= 0) continue; // hidden widget
                const end = w.last_y + (wh || 22);
                if (end > bottom) bottom = end;
            }
        }
        return bottom;
    }

    /** Get bounding box of the interactive canvas area (node-local coords). */
    getInteractiveArea() {
        const widgetBottom = this._getWidgetBottom();
        const count = Math.max(1, this.items.length);
        const ts = this.THUMB_SIZE;
        const g = this.GAP;
        const p = this.PAD;

        let w, h;
        if (this.layout === "Horizontal") {
            w = count * ts + Math.max(0, count - 1) * g + p * 2;
            h = ts + p * 2 + this.LABEL_HEIGHT;
        } else {
            w = ts + p * 2;
            h = count * ts + Math.max(0, count - 1) * g + p * 2 + this.LABEL_HEIGHT;
        }

        return {
            x: this.AREA_PAD,
            y: widgetBottom + 10,
            w: Math.max(w, 180),
            h: Math.max(h, ts + p * 2 + this.LABEL_HEIGHT),
        };
    }

    /** Get bounding box of a specific thumbnail at the given index. */
    getThumbRect(index) {
        const area = this.getInteractiveArea();
        const ts = this.THUMB_SIZE;
        const g = this.GAP;
        const p = this.PAD;

        if (this.layout === "Horizontal") {
            return {
                x: area.x + p + index * (ts + g),
                y: area.y + p,
                w: ts, h: ts,
            };
        } else {
            return {
                x: area.x + p,
                y: area.y + p + index * (ts + g),
                w: ts, h: ts,
            };
        }
    }

    /** Compute minimum node size to fit the interactive area. */
    computeMinSize() {
        const area = this.getInteractiveArea();
        return [
            Math.max(280, area.x + area.w + this.AREA_PAD),
            area.y + area.h + 12,
        ];
    }

    // ─── Drawing ───────────────────────────────────────────────

    /**
     * Main draw function, called from onDrawForeground.
     * ctx is already in node-local coordinates.
     */
    draw(ctx) {
        // Opportunistically check for new previews
        this.tryFetchPreviews();

        const area = this.getInteractiveArea();

        ctx.save();

        // ── Background Panel ──
        ctx.fillStyle = "rgba(22, 22, 26, 0.75)";
        ctx.strokeStyle = "rgba(75, 75, 85, 0.6)";
        ctx.lineWidth = 1;
        this._roundRect(ctx, area.x, area.y, area.w, area.h, 6);
        ctx.fill();
        ctx.stroke();

        // ── Empty State ──
        if (this.items.length === 0) {
            ctx.fillStyle = "#666";
            ctx.font = "11px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                "Bilder verbinden zum Anordnen",
                area.x + area.w / 2,
                area.y + area.h / 2
            );
            ctx.restore();
            return;
        }

        // ── Direction Label ──
        ctx.fillStyle = "rgba(130, 130, 140, 0.9)";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(
            this.layout === "Horizontal" ? "▸ Horizontal" : "▾ Vertikal",
            area.x + 5, area.y + 3
        );

        // ── Thumbnail Boxes ──
        for (let i = 0; i < this.items.length; i++) {
            this._drawThumb(ctx, i);
        }

        ctx.restore();
    }

    _drawThumb(ctx, index) {
        const rect = this.getThumbRect(index);
        const item = this.items[index];
        const isDragSrc = this.drag.active && this.drag.srcIdx === index;
        const isDragOver = this.drag.active && this.drag.overIdx === index
                           && this.drag.overIdx !== this.drag.srcIdx;

        // ── Drop Target Highlight ──
        if (isDragOver) {
            ctx.save();
            ctx.fillStyle = "rgba(70, 140, 235, 0.2)";
            this._roundRect(ctx, rect.x - 4, rect.y - 4, rect.w + 8, rect.h + 8, 5);
            ctx.fill();
            ctx.strokeStyle = "#4a8ceb";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }

        // ── Box ──
        ctx.save();
        ctx.globalAlpha = isDragSrc ? 0.35 : 1.0;
        ctx.fillStyle = isDragSrc ? "rgba(70, 130, 220, 0.35)" : "rgba(38, 38, 44, 0.95)";
        ctx.strokeStyle = isDragSrc ? "#4a82dc" : "rgba(85, 85, 95, 0.8)";
        ctx.lineWidth = isDragSrc ? 2 : 1;
        this._roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 4);
        ctx.fill();
        ctx.stroke();

        // ── Image or Placeholder ──
        if (item.loaded && item.img) {
            const nw = item.img.naturalWidth || item.img.width;
            const nh = item.img.naturalHeight || item.img.height;
            const aspect = nw / nh;
            let dw, dh;
            if (aspect > 1) {
                dw = rect.w - 6;
                dh = dw / aspect;
            } else {
                dh = rect.h - 6;
                dw = dh * aspect;
            }
            const dx = rect.x + (rect.w - dw) / 2;
            const dy = rect.y + (rect.h - dh) / 2;
            ctx.drawImage(item.img, dx, dy, dw, dh);
        } else {
            ctx.fillStyle = "#555";
            ctx.font = "22px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("\u{1F5BC}", rect.x + rect.w / 2, rect.y + rect.h / 2);
        }
        ctx.globalAlpha = 1.0;

        // ── Order Badge (blue circle with number) ──
        const badgeR = 9;
        const bx = rect.x + rect.w - badgeR + 3;
        const by = rect.y + badgeR - 3;
        ctx.fillStyle = "rgba(55, 120, 220, 0.9)";
        ctx.beginPath();
        ctx.arc(bx, by, badgeR, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${index + 1}`, bx, by);

        // ── Input Socket Label Below ──
        ctx.fillStyle = "#888";
        ctx.font = "8px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(item.key, rect.x + rect.w / 2, rect.y + rect.h + 2);

        ctx.restore();
    }

    /** Helper: draw a rounded rectangle path (fallback for older browsers). */
    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, y, w, h, r);
        } else {
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }
    }

    // ─── Hit Testing & Drag-and-Drop ───────────────────────────

    /** Returns the index of the thumbnail at (lx, ly), or -1. */
    hitTest(lx, ly) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            const r = this.getThumbRect(i);
            if (lx >= r.x && lx <= r.x + r.w && ly >= r.y && ly <= r.y + r.h) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Handle mouse down. Returns true if the event is consumed
     * (prevents LiteGraph from panning the canvas).
     */
    onMouseDown(lx, ly) {
        const idx = this.hitTest(lx, ly);
        if (idx >= 0) {
            this.drag = { active: true, srcIdx: idx, overIdx: idx };
            this.node.setDirtyCanvas(true, true);
            return true;
        }
        return false;
    }

    /** Handle mouse move during drag. */
    onMouseMove(lx, ly) {
        if (!this.drag.active) return false;
        const idx = this.hitTest(lx, ly);
        if (idx >= 0 && idx !== this.drag.overIdx) {
            this.drag.overIdx = idx;
            this.node.setDirtyCanvas(true, true);
        }
        return true;
    }

    /** Handle mouse up: complete the reorder. */
    onMouseUp() {
        if (!this.drag.active) return false;

        const { srcIdx, overIdx } = this.drag;
        if (overIdx >= 0 && overIdx !== srcIdx) {
            // Remove from source and insert at target
            const [item] = this.items.splice(srcIdx, 1);
            this.items.splice(overIdx, 0, item);
            this.serializeOrder();
        }

        this.drag = { active: false, srcIdx: -1, overIdx: -1 };
        this.node.setDirtyCanvas(true, true);
        return true;
    }

    // ─── Cleanup ───────────────────────────────────────────────

    /** Release cached image references (called when node is removed). */
    destroy() {
        for (const it of this.items) {
            if (it.img) {
                it.img.src = "";
                it.img = null;
            }
        }
        this.items = [];
        for (const key of Object.keys(this._imgCache)) {
            this._imgCache[key].src = "";
            delete this._imgCache[key];
        }
    }
}


// ═══════════════════════════════════════════════════════════════
// Extension Registration
// ═══════════════════════════════════════════════════════════════

app.registerExtension({
    name: "MyImageStitch",

    async beforeRegisterNodeDef(nodeType, nodeData, _app) {
        if (nodeData.name !== "MyImageStitch") return;

        // ─── onNodeCreated ──────────────────────────────────
        const origCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            if (origCreated) origCreated.apply(this, arguments);

            this._stitchHandler = new ImageStitchHandler(this);

            // Hide the order_payload widget (keep it for serialization)
            const pw = this.widgets?.find(w => w.name === "order_payload");
            if (pw) {
                pw.computeSize = () => [0, -4];
                pw.type = "converted-widget";
            }

            // React to layout changes
            const lw = this.widgets?.find(w => w.name === "layout");
            if (lw) {
                const origCb = lw.callback;
                lw.callback = (...args) => {
                    if (origCb) origCb.apply(lw, args);
                    this._stitchHandler.refreshConnections();
                    this._updateStitchSize();
                    this.setDirtyCanvas(true, true);
                };
            }

            // Initial sizing after LiteGraph finishes layout
            requestAnimationFrame(() => {
                this._stitchHandler.refreshConnections();
                this._updateStitchSize();
            });
        };

        // Helper to enforce minimum node size
        nodeType.prototype._updateStitchSize = function () {
            if (!this._stitchHandler) return;
            const [minW, minH] = this._stitchHandler.computeMinSize();
            const newW = Math.max(this.size[0], minW);
            const newH = Math.max(this.size[1], minH);
            if (newW !== this.size[0] || newH !== this.size[1]) {
                this.setSize([newW, newH]);
            }
        };

        // ─── onConfigure (workflow load) ────────────────────
        const origConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function (data) {
            if (origConfigure) origConfigure.apply(this, arguments);

            if (!this._stitchHandler) {
                this._stitchHandler = new ImageStitchHandler(this);
            }

            // Ensure order_payload widget stays hidden
            const pw = this.widgets?.find(w => w.name === "order_payload");
            if (pw) {
                pw.computeSize = () => [0, -4];
                pw.type = "converted-widget";
            }

            this._stitchHandler.refreshConnections();

            // Restore saved order
            try {
                const saved = JSON.parse(pw?.value || "[]");
                this._stitchHandler.restoreOrder(saved);
            } catch (_) { /* invalid JSON */ }

            requestAnimationFrame(() => this._updateStitchSize?.());
        };

        // ─── onConnectionsChange ────────────────────────────
        const origConn = nodeType.prototype.onConnectionsChange;
        nodeType.prototype.onConnectionsChange = function (side, slotIdx, isConnected, linkInfo, ioSlot) {
            if (origConn) origConn.apply(this, arguments);
            if (this._stitchHandler) {
                this._stitchHandler.refreshConnections();
                this._updateStitchSize();
                this.setDirtyCanvas(true, true);
            }
        };

        // ─── onDrawForeground ───────────────────────────────
        const origDrawFG = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function (ctx, graphCanvas) {
            if (origDrawFG) origDrawFG.apply(this, arguments);
            if (this._stitchHandler) {
                this._stitchHandler.draw(ctx);
            }
        };

        // ─── Mouse Events ───────────────────────────────────
        const origMouseDown = nodeType.prototype.onMouseDown;
        nodeType.prototype.onMouseDown = function (e, pos, graphCanvas) {
            if (this._stitchHandler?.onMouseDown(pos[0], pos[1])) {
                e.stopPropagation?.();
                e.preventDefault?.();
                return true;
            }
            if (origMouseDown) return origMouseDown.apply(this, arguments);
        };

        const origMouseMove = nodeType.prototype.onMouseMove;
        nodeType.prototype.onMouseMove = function (e, pos, graphCanvas) {
            if (this._stitchHandler?.onMouseMove(pos[0], pos[1])) {
                return true;
            }
            if (origMouseMove) return origMouseMove.apply(this, arguments);
        };

        const origMouseUp = nodeType.prototype.onMouseUp;
        nodeType.prototype.onMouseUp = function (e, pos, graphCanvas) {
            if (this._stitchHandler?.onMouseUp()) {
                return true;
            }
            if (origMouseUp) return origMouseUp.apply(this, arguments);
        };

        // ─── Cleanup on Remove ──────────────────────────────
        const origRemoved = nodeType.prototype.onRemoved;
        nodeType.prototype.onRemoved = function () {
            this._stitchHandler?.destroy();
            this._stitchHandler = null;
            if (origRemoved) origRemoved.apply(this, arguments);
        };
    },
});
