import { api } from "../../scripts/api.js";
import { app } from "../../scripts/app.js";

// ── Global: Real-time preview updates from Python backend ──────────────────
// Receives per-image progress messages sent by PromptServer during load_images().
// Fires BEFORE onExecuted, giving immediate visual feedback as each image loads.
api.addEventListener("iterator_preview", function (event) {
    const data = event.detail;
    if (!data?.node) return;

    const node = app.graph.getNodeById(parseInt(data.node));
    if (!node) return;

    if (!node._loadingPreviews) node._loadingPreviews = [];

    const idx = data.index;
    const url = `/view?filename=${encodeURIComponent(data.filename)}&type=${data.type}&subfolder=${data.subfolder}&t=${Date.now()}`;
    const img = new Image();
    img.onload = () => {
        // Always advance to show the most recently loaded image
        if (idx >= (node._currentPreviewIndex ?? -1)) {
            node._currentPreviewIndex = idx;
            node._loadingTotal = data.total;
            node.previewImg = img;
            node.setDirtyCanvas(true, true);
        }
    };
    img.src = url;
    node._loadingPreviews[idx] = img;
});

app.registerExtension({
    name: "DirectoryImageIterator.Preview",
    async beforeRegisterNodeDef(nodeType, nodeData, appInstance) {
        if (nodeData.name !== "DirectoryImageIterator") return;

        // ── 1. Handle execution result ─────────────────────────────────
        //    Fires once after the Python node finishes loading ALL images.
        //    Finalises the preview array and starts downstream tracking.
        const onExecuted = nodeType.prototype.onExecuted;
        nodeType.prototype.onExecuted = function (message) {
            onExecuted?.apply(this, arguments);
            if (!message?.images?.length) return;

            this.canvasWidget.value = message.images;

            // Prefer thumbnails already loaded via iterator_preview events
            if (this._loadingPreviews
                && this._loadingPreviews.filter(Boolean).length >= message.images.length) {
                this._previewImages = [...this._loadingPreviews];
            } else {
                // Fallback: preload all thumbnails now
                this._previewImages = message.images.map((imgData) => {
                    const img = new Image();
                    img.src = `/view?filename=${encodeURIComponent(imgData.filename)}&type=${imgData.type}&subfolder=${imgData.subfolder}&t=${Date.now()}`;
                    return img;
                });
            }
            this._loadingPreviews = null;

            // If no preview is showing yet, show the last loaded image
            if (!this.previewImg || !this.previewImg.complete) {
                const lastIdx = this._previewImages.length - 1;
                this._currentPreviewIndex = lastIdx;
                const img = this._previewImages[lastIdx];
                if (img?.complete && img.naturalWidth > 0) {
                    this.previewImg = img;
                    this.setDirtyCanvas(true, true);
                } else if (img) {
                    img.onload = () => {
                        this.previewImg = img;
                        this.setDirtyCanvas(true, true);
                    };
                }
            }

            // Start tracking downstream node execution to cycle the preview
            if (this._previewImages.length > 1) {
                this._startIterationTracking();
            }
        };

        // ── 2. Downstream node lookup (handles all link storage formats) ──
        nodeType.prototype._getDownstreamNodeIds = function () {
            const ids = new Set();
            for (const output of this.outputs || []) {
                for (const linkId of output.links || []) {
                    let link;
                    const links = app.graph.links;
                    if (links instanceof Map) {
                        link = links.get(linkId);
                    } else if (links) {
                        link = links[linkId];
                    }
                    if (!link) continue;
                    // LiteGraph stores links as arrays [id,origin,slot,target,slot,type]
                    // or objects {id, origin_id, origin_slot, target_id, target_slot, type}
                    const tid = Array.isArray(link) ? link[3]
                        : (link.target_id ?? link.targetId);
                    if (tid != null) ids.add(String(tid));
                }
            }
            return ids;
        };

        // ── 3. Iteration tracking via "executing" API events ──────────────
        //    Each time the first downstream node starts executing for a new
        //    list item, we advance the preview to the corresponding image.
        nodeType.prototype._startIterationTracking = function () {
            if (this._executingHandler) {
                api.removeEventListener("executing", this._executingHandler);
                this._executingHandler = null;
            }

            const downstreamIds = this._getDownstreamNodeIds();
            if (downstreamIds.size === 0) return;

            // Pick one downstream node to count executions on
            const trackId = downstreamIds.values().next().value;
            const node = this;
            let iterCount = -1;

            this._executingHandler = function (event) {
                // Handle both old format (string) and new format ({node: "id"})
                let executingId;
                const d = event.detail;
                if (d == null) {
                    executingId = null;
                } else if (typeof d === "string" || typeof d === "number") {
                    executingId = String(d);
                } else if (typeof d === "object") {
                    executingId = d.node != null ? String(d.node) : null;
                } else {
                    return;
                }

                // null → full prompt execution finished
                if (executingId === null) {
                    api.removeEventListener("executing", node._executingHandler);
                    node._executingHandler = null;
                    return;
                }

                if (executingId === trackId && node._previewImages?.length) {
                    iterCount++;
                    const idx = iterCount % node._previewImages.length;
                    node._currentPreviewIndex = idx;
                    const img = node._previewImages[idx];
                    if (img?.complete && img.naturalWidth > 0) {
                        node.previewImg = img;
                        node.setDirtyCanvas(true, true);
                    } else if (img) {
                        const cap = idx;
                        img.onload = () => {
                            if (node._currentPreviewIndex === cap) {
                                node.previewImg = img;
                                node.setDirtyCanvas(true, true);
                            }
                        };
                    }
                }
            };

            api.addEventListener("executing", this._executingHandler);
        };

        // ── 4. Node creation – hidden widget + session recovery ────────────
        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            onNodeCreated?.apply(this, arguments);
            const node = this;

            const widget = {
                type: "dict",
                name: "Retain_Previews",
                options: { serialize: false },
                _value: [],
                set value(v) { this._value = v; app.nodeOutputs[node.id + ""] = v; },
                get value()  { return this._value; },
            };
            this.canvasWidget = this.addCustomWidget(widget);

            // Recover from a prior execution within the same browser session
            const stored = app.nodeOutputs[this.id + ""];
            if (stored?.length) {
                this.canvasWidget.value = stored;
                this._previewImages = stored.map((imgData) => {
                    const img = new Image();
                    img.src = `/view?filename=${encodeURIComponent(imgData.filename)}&type=${imgData.type}&subfolder=${imgData.subfolder}&t=${Date.now()}`;
                    return img;
                });

                const lastIdx = stored.length - 1;
                this._currentPreviewIndex = lastIdx;
                this._previewImages[lastIdx].onload = () => {
                    this.previewImg = this._previewImages[lastIdx];
                    this.setDirtyCanvas(true, true);
                };
            }
        };

        // ── 5. Navigate to a specific preview index ──────────────────────────
        nodeType.prototype._navigatePreview = function (newIdx) {
            if (!this._previewImages?.length) return;
            const total = this._previewImages.length;
            // Wrap around
            newIdx = ((newIdx % total) + total) % total;
            this._currentPreviewIndex = newIdx;
            const img = this._previewImages[newIdx];
            if (img?.complete && img.naturalWidth > 0) {
                this.previewImg = img;
                this.setDirtyCanvas(true, true);
            } else if (img) {
                const cap = newIdx;
                img.onload = () => {
                    if (this._currentPreviewIndex === cap) {
                        this.previewImg = img;
                        this.setDirtyCanvas(true, true);
                    }
                };
            }
        };

        // ── 6. Draw thumbnail + counter overlay + pagination arrows ────────
        const onDrawForeground = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function (ctx) {
            onDrawForeground?.apply(this, arguments);
            if (!this.previewImg?.complete || this.previewImg.naturalWidth === 0) return;

            const margin = 10;
            let widgetBottom = 0;

            if (this.widgets?.length) {
                const visible = this.widgets.filter(w => w !== this.canvasWidget);
                if (visible.length) {
                    const last = visible[visible.length - 1];
                    widgetBottom = (last.last_y || 0)
                        + (last.computeSize ? last.computeSize()[1] : 20);
                }
            }

            const y = widgetBottom + margin;
            const w = this.size[0] - margin * 2;
            const aspect = this.previewImg.naturalWidth / this.previewImg.naturalHeight;
            const h = w / aspect;

            const needed = y + h + margin + 30; // extra space for pagination bar
            if (this.size[1] < needed) this.size[1] = needed;

            ctx.drawImage(this.previewImg, margin, y, w, h);

            // Store image area for hit testing
            this._imgArea = { x: margin, y: y, w: w, h: h };

            const total = this._previewImages?.length || this._loadingTotal || 0;
            if (total > 1) {
                const idx = this._currentPreviewIndex ?? 0;

                // ── Counter badge — "3 / 10  photo.jpg" ──
                let origName = "";
                const meta = this.canvasWidget?.value?.[idx];
                if (meta?.original_filename) {
                    origName = meta.original_filename;
                } else if (meta?.filename) {
                    origName = meta.filename.replace(/^iter_thumb_[a-f0-9]+_/, "");
                }
                if (origName.length > 30) origName = origName.substring(0, 27) + "...";

                const label = origName
                    ? `${idx + 1} / ${total}  ${origName}`
                    : `${idx + 1} / ${total}`;

                ctx.save();
                ctx.font = "bold 12px sans-serif";
                const tw = ctx.measureText(label).width;
                const bx = margin + w - tw - 12;
                const by = y + 4;

                ctx.fillStyle = "rgba(0,0,0,0.65)";
                ctx.fillRect(bx, by, tw + 8, 18);
                ctx.fillStyle = "#fff";
                ctx.textBaseline = "top";
                ctx.fillText(label, bx + 4, by + 3);
                ctx.restore();

                // ── Pagination bar below the image ──
                const barY = y + h + 4;
                const btnW = 28;
                const btnH = 22;
                const barCenterX = margin + w / 2;

                // "< Prev" button
                const prevBtnX = barCenterX - btnW - 40;
                // "Next >" button
                const nextBtnX = barCenterX + 40;

                // Store button rects for hit testing (in node-local coords)
                this._prevBtnRect = { x: prevBtnX, y: barY, w: btnW, h: btnH };
                this._nextBtnRect = { x: nextBtnX, y: barY, w: btnW, h: btnH };

                // Draw prev button
                ctx.save();
                ctx.fillStyle = (this._hoverBtn === "prev") ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.55)";
                ctx.beginPath();
                ctx.roundRect(prevBtnX, barY, btnW, btnH, 4);
                ctx.fill();
                ctx.fillStyle = "#fff";
                ctx.font = "bold 14px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("\u25C0", prevBtnX + btnW / 2, barY + btnH / 2);
                ctx.restore();

                // Draw next button
                ctx.save();
                ctx.fillStyle = (this._hoverBtn === "next") ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.55)";
                ctx.beginPath();
                ctx.roundRect(nextBtnX, barY, btnW, btnH, 4);
                ctx.fill();
                ctx.fillStyle = "#fff";
                ctx.font = "bold 14px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText("\u25B6", nextBtnX + btnW / 2, barY + btnH / 2);
                ctx.restore();

                // Page indicator dots / text between buttons
                ctx.save();
                ctx.fillStyle = "rgba(0,0,0,0.55)";
                const pageLabel = `${idx + 1} / ${total}`;
                ctx.font = "bold 12px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                const pageLabelW = ctx.measureText(pageLabel).width;
                ctx.beginPath();
                ctx.roundRect(barCenterX - pageLabelW / 2 - 6, barY, pageLabelW + 12, btnH, 4);
                ctx.fill();
                ctx.fillStyle = "#fff";
                ctx.fillText(pageLabel, barCenterX, barY + btnH / 2);
                ctx.restore();
            }
        };

        // ── 7. Mouse interaction for pagination ────────────────────────────
        const onMouseDown = nodeType.prototype.onMouseDown;
        nodeType.prototype.onMouseDown = function (e, localPos, graphCanvas) {
            const total = this._previewImages?.length || 0;
            if (total > 1) {
                const x = localPos[0];
                const y = localPos[1];
                const prev = this._prevBtnRect;
                const next = this._nextBtnRect;

                if (prev && x >= prev.x && x <= prev.x + prev.w && y >= prev.y && y <= prev.y + prev.h) {
                    this._navigatePreview((this._currentPreviewIndex ?? 0) - 1);
                    return true; // consume the event
                }
                if (next && x >= next.x && x <= next.x + next.w && y >= next.y && y <= next.y + next.h) {
                    this._navigatePreview((this._currentPreviewIndex ?? 0) + 1);
                    return true;
                }
            }
            return onMouseDown?.apply(this, arguments);
        };

        const onMouseMove = nodeType.prototype.onMouseMove;
        nodeType.prototype.onMouseMove = function (e, localPos, graphCanvas) {
            const total = this._previewImages?.length || 0;
            let newHover = null;
            if (total > 1) {
                const x = localPos[0];
                const y = localPos[1];
                const prev = this._prevBtnRect;
                const next = this._nextBtnRect;

                if (prev && x >= prev.x && x <= prev.x + prev.w && y >= prev.y && y <= prev.y + prev.h) {
                    newHover = "prev";
                } else if (next && x >= next.x && x <= next.x + next.w && y >= next.y && y <= next.y + next.h) {
                    newHover = "next";
                }
            }
            if (this._hoverBtn !== newHover) {
                this._hoverBtn = newHover;
                this.setDirtyCanvas(true, false);
            }
            return onMouseMove?.apply(this, arguments);
        };

        // ── 8. Cleanup on node removal ─────────────────────────────────────
        const onRemoved = nodeType.prototype.onRemoved;
        nodeType.prototype.onRemoved = function () {
            if (this._executingHandler) {
                api.removeEventListener("executing", this._executingHandler);
                this._executingHandler = null;
            }
            onRemoved?.apply(this, arguments);
        };
    }
});
