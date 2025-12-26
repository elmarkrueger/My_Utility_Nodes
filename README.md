# My Utility Nodes

A collection of custom utility nodes for ComfyUI, designed to streamline workflows with enhanced input controls, sliders, and image processing tools.

**Author:** Elmar Krüger  
**Year:** 2025

---

## 📋 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Available Nodes](#available-nodes)
  - [Slider Nodes](#slider-nodes)
  - [Multi-Input Nodes](#multi-input-nodes)
  - [Image Processing](#image-processing)
- [Node Details](#node-details)
- [Technical Architecture](#technical-architecture)
- [License](#license)

---

## Overview

My Utility Nodes is a ComfyUI custom node package that provides enhanced UI controls and utility functions for common workflow tasks. It includes interactive slider widgets with custom JavaScript interfaces, multi-value input nodes, and specialized image processing capabilities.

### Key Features

- **Interactive Sliders**: Custom-designed slider widgets with visual feedback
- **Type Flexibility**: Supports both integer and float values with runtime switching
- **Batch Input Handling**: Multi-value nodes for floats, integers, and strings
- **Lossless Image Conversion**:  RGBA to RGB conversion without quality loss
- **Enhanced CFG Control**: Specialized CFG (Classifier-Free Guidance) slider

---

## Installation

### Method 1: Git Clone (Recommended)

```bash
cd ComfyUI/custom_nodes/
git clone https://github.com/elmarkrueger/My_Utility_Nodes.git
```

### Method 2: Manual Installation

1. Download this repository as a ZIP file
2. Extract to `ComfyUI/custom_nodes/My_Utility_Nodes/`
3. Restart ComfyUI

### Dependencies

- ComfyUI (latest version recommended)
- PyTorch
- No additional Python packages required

---

## Available Nodes

### Slider Nodes

| Node | Category | Description |
|------|----------|-------------|
| **Slider** (`mxSlider`) | `utils/slider` | Single-axis slider with int/float toggle |
| **Slider 2D** (`mxSlider2D`) | `utils/slider` | Dual-axis slider for X/Y coordinates |
| **Float 5** (`mxFloat5`) | `utils/slider` | Five independent float sliders (0.0-1.0) |
| **Float 4** (`mxFloat4`) | `utils/slider` | Four independent float sliders (0.00-1.00, 0.01 steps) |
| **CFG Guider** (`mxCFGGuider`) | `utils/slider` | Specialized CFG parameter control |

### Multi-Input Nodes

| Node | Category | Description |
|------|----------|-------------|
| **Int 3** (`mxInt3`) | `utils/multiInteger` | Three independent integer inputs |
| **String 3** (`mxString3`) | `utils/multiString` | Three independent string inputs |

### Image Processing

| Node | Category | Description |
|------|----------|-------------|
| **RGBA zu RGB (Verlustfrei)** | `Bildverarbeitung/Konvertierung` | Lossless RGBA to RGB conversion |

---

## Node Details

### 🎚️ mxSlider

**Purpose:** Universal single-value input with visual slider control

**Inputs:**
- `Xi` (INT): Integer value (range: -4,294,967,296 to 4,294,967,296, default: 20)
- `Xf` (FLOAT): Float value (same range, default: 20.0)
- `isfloatX` (INT): Toggle between int (0) and float (1) output

**Outputs:**
- `X` (ANY): Returns either `Xi` or `Xf` based on toggle

**Use Cases:**
- Dynamic parameter adjustment during workflow development
- A/B testing between integer and float values
- Single source of truth for dimension or parameter values

---

### 🎚️🎚️ mxSlider2D

**Purpose:** Dual-axis control for coordinate pairs or dimensions

**Inputs:**
- `Xi`, `Xf` (INT/FLOAT): X-axis values (default: 512)
- `Yi`, `Yf` (INT/FLOAT): Y-axis values (default:  512)
- `isfloatX`, `isfloatY` (INT): Independent toggles for each axis

**Outputs:**
- `X`, `Y` (ANY): Coordinate pair or dimension values

**Use Cases:**
- Image resolution control (width × height)
- Position coordinates in 2D space
- Aspect ratio experimentation

---

### 🔢 mxFloat5

**Purpose:** Batch float input for parameter sets

**Inputs:**
- `F1` through `F5` (FLOAT): Five independent values (0.0-1.0, step: 0.1)

**Outputs:**
- `F1` through `F5` (FLOAT): Pass-through values

**Use Cases:**
- Multi-layer opacity controls
- RGBA + alpha channel values
- Batch parameter passing to downstream nodes

---

### 🔢 mxFloat4

**Purpose:** Precision float slider for fine-tuned parameter control

**Inputs:**
- `F1` through `F4` (FLOAT): Four independent values (0.00-1.00, step: 0.01)

**Outputs:**
- `F1` through `F4` (FLOAT): Pass-through values

**Features:**
- Custom JavaScript slider with visual feedback
- Higher precision (0.01 steps) compared to Float 5
- Editable labels for each slider (double-click on label)
- Direct value input (double-click on value)
- Snap-to-grid behavior (toggleable with Shift key)
- Customizable min/max/step/decimals in properties panel

**Use Cases:**
- Fine-grained parameter adjustments (e.g., LoRA weights)
- Multi-model blending ratios
- Precision color correction values
- Advanced sampler parameter sets

---

### 🖼️ RGBA_to_RGB_Lossless

**Purpose:** Zero-copy conversion from 4-channel (RGBA) to 3-channel (RGB) images

**Inputs:**
- `image` (IMAGE): Input tensor in BHWC format (Batch, Height, Width, Channels)

**Outputs:**
- `rgb_image` (IMAGE): RGB tensor without alpha channel

**Technical Implementation:**
- Uses PyTorch tensor slicing (`image[..., :3]`) for zero-copy operation
- Handles edge cases: 
  - **4 channels (RGBA):** Strips alpha channel
  - **3 channels (RGB):** Pass-through
  - **1 channel (Grayscale):** Replicates to 3 channels
  - **Other:** Returns original with warning

**Benefits:**
- No pixel recomputation or compression
- Extremely memory-efficient (view operation)
- Fast processing (no data copying)

---

### ⚙️ mxCFGGuider

**Purpose:** Specialized control for CFG (Classifier-Free Guidance) scale parameter

**Inputs:**
- `cfg` (FLOAT): CFG value (0.0-100.0, default: 7.0, step: 0.1)

**Outputs:**
- `FLOAT`: CFG value

**Features:**
- Custom JavaScript slider with visual feedback
- Fine-grained control (0.1 step precision)
- Property panel for min/max/decimals customization
- Snap-to-grid behavior (toggleable with Shift)
- Double-click for direct value input

---

### 🔢 mxInt3 & mxString3

**Purpose:** Batch input for multiple values of the same type

**mxInt3 Inputs:**
- `I1`, `I2`, `I3` (INT): Three integers (0-4,294,967,296)

**mxString3 Inputs:**
- `S1`, `S2`, `S3` (STRING): Three text strings

**Use Cases:**
- Seed value collections
- Multi-prompt workflows
- Batch processing with variant parameters

---

## Technical Architecture

### File Structure

```
My_Utility_Nodes/
├── __init__.py              # Package initialization and exports
├── mytoolkit.py             # Python node definitions
├── js/                      # Frontend JavaScript extensions
│   ├── CFGGuider.js         # CFG slider widget
│   ├── Slider.js            # Single-axis slider widget
│   ├── Slider2D.js          # Dual-axis slider widget
│   ├── MultiSlider.js       # Multi-value slider widget (5 sliders)
│   ├── MultiSlider4.js      # Multi-value slider widget (4 sliders)
│   ├── Int3.js              # Integer input widget
│   └── String3.js           # String input widget
└── README.md
```

### Custom Type System

The package uses a custom `AnyType` class for flexible type handling:

```python
class AnyType(str):
    def __ne__(self, __value: object) -> bool:
        return False
```

This allows nodes to accept and pass any ComfyUI data type without strict type enforcement.

### JavaScript Integration

Each slider node has a corresponding JavaScript extension that:
- Hooks into ComfyUI's node creation lifecycle (`beforeRegisterNodeDef`)
- Hides default widget UI and renders custom controls
- Handles mouse events for interactive dragging
- Provides visual feedback with canvas drawing
- Syncs property changes with the Python backend

---

## Usage Examples

### Example 1: Dynamic Image Resolution

```
[mxSlider2D] → width/height → [Empty Latent Image]
```

Set `Xi=512, Yi=768` for portrait mode, toggle to `Xf=1024, Yf=1024` for square format.

### Example 2: Multi-Seed Batch Generation

```
[mxInt3] → seeds → [KSampler] (batch mode)
```

Generate three variations with seeds from `I1`, `I2`, `I3`.

### Example 3: RGBA Image Cleanup

```
[Load Image] → [RGBA_to_RGB_Lossless] → [Image Processing Node]
```

Remove alpha channel before passing to nodes that expect RGB input.

---

## License

This project is released under the MIT License (or as specified by the author).

**Copyright © 2025 Elmar Krüger**

---

## Contributing

Contributions, issues, and feature requests are welcome! 

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## Support

For bugs and feature requests, please open an issue on the [GitHub repository](https://github.com/elmarkrueger/My_Utility_Nodes/issues).

---

## Changelog

### v1.1.0 (2025)
- Added **Float 4** (`mxFloat4`) node with higher precision (0.01 steps)
- Enhanced slider controls with editable labels
- Improved documentation with detailed use cases

### v1.0.0 (2025)
- Initial release
- 7 custom nodes with JavaScript UI integration
- RGBA to RGB lossless converter
- Interactive slider controls
- Multi-value input nodes

---

**Made with ❤️ for the ComfyUI community**
