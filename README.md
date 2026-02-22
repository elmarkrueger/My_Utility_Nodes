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

**Version 2.0** features a complete reorganization into logical modules for better maintainability and scalability, plus new nodes for latent noise blending, megapixel-based image resizing, and advanced flow control.

### Key Features

- **Interactive Sliders**: Custom-designed slider widgets with visual feedback
- **Type Flexibility**: Supports both integer and float values with runtime switching
- **Precision Control**: High-precision float sliders (0.01 steps) for fine-tuned adjustments
- **Batch Input Handling**: Multi-value nodes for floats, integers, and strings
- **Advanced Switching**: Multiple switch types including flow control and batch logic routing
- **Lossless Image Conversion**: RGBA to RGB conversion without quality loss
- **Megapixel Resizing**: Intelligent image resizing based on target megapixel count
- **Latent Operations**: Specialized nodes for Qwen models and latent noise blending
- **Audio Export**: MP3 export with quality control and batch processing support
- **Enhanced Parameter Control**: Specialized sliders for CFG and model sampling parameters
- **Image Iteration with Pagination**: Browse loaded images interactively with prev/next controls
- **Modular Architecture**: Clean organization into 6 logical modules for easy maintenance

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
- **pydub** (required for audio MP3 export)

Install Python dependencies:
```bash
pip install -r requirements.txt
```

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
| **Model Sampling Float** (`mxModelSamplingFloat`) | `utils/slider` | Model sampling parameter slider (0.00-15.00) |

### Multi-Input Nodes

| Node | Category | Description |
|------|----------|-------------|
| **Int 3** (`mxInt3`) | `utils/multiInteger` | Three independent integer inputs |
| **String 3** (`mxString3`) | `utils/multiString` | Three independent string inputs |

### Switch Nodes

| Node | Category | Description |
|------|----------|-------------|
| **Input Switch** (`mxInputSwitch`) | `utils/switch` | Switches between two Any-type inputs with visual toggles |
| **Input Switch 3** (`mxInputSwitch3`) | `utils/switch` | Switches between three Any-type inputs with visual toggles |
| **Size Switch** (`mxSizeSwitch`) | `utils/switch` | Switches between two resolution pairs (width/height) with independent labels |
| **Batch Logic Switch** (`BatchLogicSwitch`) | `MyUtilityNodes/Logic` | Splits a batch into groups and assigns different parameters |
| **Switch Command Center** (`SwitchCommandCenter`) | `utils/flow_control` | Five-input flow control switch with active/inactive state |

### Image Processing

| Node | Category | Description |
|------|----------|-------------|
| **RGBA zu RGB (Verlustfrei)** | `Bildverarbeitung/Konvertierung` | Lossless RGBA to RGB conversion |
| **Directory Image Iterator** (`DirectoryImageIterator`) | `image/iteration` | Loads a sorted slice of images from a folder and iterates them one-by-one through the downstream graph, with interactive pagination controls |
| **Iterator Current Filename** (`IteratorCurrentFilename`) | `image/iteration` | Helper node: extracts the single current-iteration filename (without extension) for direct use as `filename_prefix` in Save Image nodes |

### Audio Processing

| Node | Category | Description |
|------|----------|-------------|
| **Save Audio as MP3 (Custom)** (`SaveAudioAsMP3_Custom`) | `Audio/Custom` | Exports audio to MP3 files with quality control and batch support |

### File I/O
(`RGBA_to_RGB_Lossless`) | `Bildverarbeitung/Konvertierung` | Lossless RGBA to RGB conversion |
| **Megapixel Resize** (`MegapixelResizeNode`) | `Image/Resizing` | Resizes images to target megapixel count while maintaining aspect ratio |
| **Bild mit Sidecar TXT speichern V2** (`SaveImageWithSidecarTxt_V2`) | `Custom_Research/IO` | Saves images with a synchronized text file containing metadata (supports 3-pass sampling details) |

### Latent Nodes

| Node | Category | Description |
|------|----------|-------------|
| **Empty Qwen Latent** (`EmptyQwen2512LatentImage`) | `My_Utility_Nodes/Qwen` | Initializes empty latents for Qwen-Image-2512 (16 channels) with optimized resolutions |
| **Latent Noise Blender** (`LatentNoiseBlender`) | `Latent/Noise` | Blends a latent image with latent noise using percentage-based slider |
| **VAE Decode Audio (Tiled)** (`VAEDecodeAudioTiled`) | `latent/audio` | Memory-efficient tiled audio decoding from latents with overlap blending |
| **ACE Latent Blend 1.5** (`ACELatentBlend`) | `ACE_Step/Latent` | Blends ACE-Step 1.5 audio latents with Linear, Slerp, Add, and Multiply modes |
| **Generate Noise (Flux 2 Klein)** (`GenerateNoiseForFlux2Klein`) | `KJNodes/noise` | Generates parameterized noise for Flux 2 Klein (128ch, f16) with backward compatibility for SD1.5/SDXL/SD3 |
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

### � DirectoryImageIterator

**Purpose:** Load a deterministically sorted slice of images from a local directory and feed them one-by-one into the downstream graph, with live canvas thumbnail preview and interactive pagination controls.

**Inputs:**
- `folder_path` (STRING): Absolute path to the source image directory
- `start_index` (INT): Zero-based offset into the sorted list of images (default: 0)
- `image_limit` (INT): Maximum number of images to process; 0 means all remaining (default: 0)

**Outputs:**
- `image` (IMAGE): Individual image tensors, one per downstream execution pass
- `filename` (STRING): Corresponding base filename for each image

**Technical Implementation:**
- Files are sorted alphanumerically and sliced with `start_index` / `image_limit` for deterministic, repeatable results
- `OUTPUT_IS_LIST = (True, True)` activates ComfyUI's sequential list-iteration engine — the downstream graph runs once per image, enabling mixed-resolution datasets without dimensional crashes
- EXIF rotation is corrected automatically via `ImageOps.exif_transpose`
- Tensors are cast to `float32` in `[0, 1]` range with shape `(1, H, W, 3)` — the standard ComfyUI IMAGE format
- `IS_CHANGED` computes a SHA-256 hash of filenames and modification timestamps in the active slice; the cache is only invalidated when the content of that slice actually changes
- Input path is resolved with `os.path.realpath` to prevent path traversal attacks
- A 512×512 max JPEG thumbnail is saved to the ComfyUI temp directory per image; the first thumbnail is displayed via a custom LiteGraph canvas widget that auto-resizes the node to maintain aspect ratio
- **Interactive pagination:** After execution, ◀ / ▶ arrow buttons appear below the preview image, allowing the user to browse through all loaded images manually. Navigation wraps around (past the last image returns to the first, and vice versa). A page counter between the buttons shows the current position (e.g., "3 / 10"). Buttons highlight on hover for visual feedback.

**Supported formats:** `.jpg`, `.jpeg`, `.png`, `.webp`, `.tiff`

**Use Cases:**
- Sequential upscaling of an entire image folder
- Automated dataset curation pipelines
- Video frame-by-frame processing
- Batch image-to-image translation workflows with variable resolutions

> **Tip:** To use the `filename` output as `filename_prefix` in a Save Image node, always route it through the **Iterator Current Filename** helper node (see below). Wiring the list directly causes the error *"expected string or bytes-like object, got 'list'"*.

---

### 🏷️ IteratorCurrentFilename

**Purpose:** Bridge node that extracts the single, current-iteration filename from `DirectoryImageIterator` and prepares it as a clean string for `SaveImage.filename_prefix`.

**The problem it solves:**  
`DirectoryImageIterator` emits `filename` as a Python list (`OUTPUT_IS_LIST = True`). ComfyUI correctly expands IMAGE tensors through downstream nodes, but wiring a `STRING` list directly to `filename_prefix` passes the entire list object, causing:  
`ValueError: expected string or bytes-like object, got 'list'`

**Inputs:**
- `filename` (STRING, `forceInput`): The filename list from `DirectoryImageIterator`

**Outputs:**
- `filename_prefix` (STRING): One filename per iteration step, with the file extension stripped (required by ComfyUI's Save Image node)

**Wiring:**
```
DirectoryImageIterator.filename  →  Iterator Current Filename  →  SaveImage.filename_prefix
DirectoryImageIterator.image     →  Megapixel Resize (or any processing)  →  SaveImage.images
```

**Technical note:** The node uses `INPUT_IS_LIST = True` to accept the full list in one call, strips extensions with `os.path.splitext`, then re-emits with `OUTPUT_IS_LIST = (True,)` so ComfyUI forwards exactly one string per downstream execution step.

---

### �🖼️ RGBA_to_RGB_Lossless

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

### 🎵 SaveAudioAsMP3_Custom

**Purpose:** Export audio data to MP3 files with configurable quality settings and automatic batch processing.

**Inputs:**
- `audio` (AUDIO): Audio data containing waveform tensor and sample rate
- `filename` (STRING): Base filename for output files (default: "audio_output")
- `path` (STRING): Optional custom output directory path (default: "" uses ComfyUI output directory)
- `quality` (COMBO): MP3 bitrate selection - 320k, 256k, 192k (default), 128k, or 64k

**Outputs:**
- None (Output Node)

**Technical Implementation:**
1. **Path Resolution**
   - Uses ComfyUI's default output directory if path is empty
   - Creates custom directories automatically if they don't exist
   - Validates and handles path errors gracefully

2. **Audio Data Processing**
   - Extracts waveform tensor and sample rate from AUDIO format
   - Processes each audio in batch automatically (batch dimension: waveform.shape[0])
   - Converts PyTorch tensors to NumPy arrays (CPU)

3. **Format Conversion**
   - **Stereo (2 channels):** Converts from planar format to interleaved format
   - **Mono (1 channel):** Flattens to 1D array
   - Handles channel detection automatically

4. **Audio Quantization**
   - Clips audio values to [-1.0, 1.0] range to prevent distortion
   - Converts float32 audio to int16 format (scales by 32767)
   - Maintains audio quality during conversion

5. **MP3 Export via Pydub**
   - Creates AudioSegment with proper sample width (2 bytes), frame rate, and channels
   - Exports to MP3 format with selected bitrate
   - Uses pydub's ffmpeg backend for encoding

6. **Batch & Filename Handling**
   - Appends batch index for batches > 1 (e.g., `audio_001.mp3`, `audio_002.mp3`)
   - Implements overwrite protection with auto-increment counter
   - Prevents file conflicts automatically

**Features:**
- **Quality Control:** Five bitrate options from 64k (small file) to 320k (maximum quality)
- **Batch Processing:** Automatically processes and saves multiple audio files
- **Overwrite Protection:** Never overwrites existing files - adds numeric suffix instead
- **Custom Paths:** Save to any directory with automatic creation
- **Channel Flexibility:** Handles both mono and stereo audio automatically
- **ComfyUI Integration:** Works seamlessly with ComfyUI's audio pipeline

**Dependencies:**
- Requires `pydub` library (install via `pip install -r requirements.txt`)
- Pydub uses ffmpeg for MP3 encoding

**Use Cases:**
- Exporting generated audio from text-to-speech or music generation models
- Converting ComfyUI audio format to standard MP3 files
- Batch audio export with quality presets
- Creating audio assets at different quality levels for different use cases
- Archiving audio workflow results

**Quality Guide:**
- **320k:** Maximum quality, large files (~2.5 MB/min)
- **256k:** Very high quality (~2 MB/min)
- **192k:** High quality, balanced size (default, ~1.5 MB/min)
- **128k:** Good quality, smaller files (~1 MB/min)
- **64k:** Low quality, minimal size (~0.5 MB/min, voice-only)

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

### 🎯 mxModelSamplingFloat

**Purpose:** Precision slider for model sampling parameters with extended range

**Inputs:**
- `value` (FLOAT): Sampling value (0.00-15.00, default: 1.00, step: 0.01)

**Outputs:**
- `value` (FLOAT): Sampling parameter value

**Features:**
- Compact single-slider design based on CFG Guider
- High precision (0.01 steps) with 2 decimal places
- Extended range (0.00-15.00) for advanced sampling control
- Visual feedback with interactive slider knob
- Snap-to-grid behavior (toggle with Shift key)
- Direct value input via double-click
- Customizable min/max/step/decimals in properties panel

**Use Cases:**
- Model sampling sigma adjustments
- Advanced sampler parameter control
- Denoise strength fine-tuning
- Custom sampling schedule values
- Noise level adjustments

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

### 🔀 mxInputSwitch

**Purpose:** Route one of two Any-type inputs to output using visual boolean switches

**Inputs:**
- `input_A` (ANY): First input (can be any ComfyUI data type)
- `input_B` (ANY): Second input (can be any ComfyUI data type)
- `select_A` (INT): Boolean switch for input A (0 or 1)
- `select_B` (INT): Boolean switch for input B (0 or 1)

**Outputs:**
- `output` (ANY): The selected input (A or B)

**Features:**
- Visual toggle switches with ON/OFF indicators
- Only one input can be active at a time
- Clicking a toggle automatically deactivates the other
- Customizable labels for both inputs (double-click on label)
- Green ON state, gray OFF state for clear visual feedback
- Works with any ComfyUI data type (images, latents, models, etc.)

**Use Cases:**
- A/B testing different models or settings
- Conditional routing in workflows
- Quick switching between different image processing paths
- Toggle between different prompts, LoRAs, or samplers
- Create dynamic workflows with alternative branches

**Usage:**
1. Connect two inputs of any type to `input_A` and `input_B`
2. Click one of the toggle switches to select which input to route
3. The active input will have a green "ON" indicator
4. Double-click on labels to rename them for better organization
5. The selected input is passed through to the output

---
### 📏 mxSizeSwitch

**Purpose:** Switch between two predefined resolution pairs (width/height) using a simple toggle.

**Inputs:**
- `width_A` (INT): Width for configuration A.
- `height_A` (INT): Height for configuration A.
- `label_A` (STRING): Customizable label for configuration A (e.g., "Portrait").
- `width_B` (INT): Width for configuration B.
- `height_B` (INT): Height for configuration B.
- `label_B` (STRING): Customizable label for configuration B (e.g., "Landscape").
- `select` (INT): Switch control (0 for A, 1 for B).

**Outputs:**
- `width` (INT): The selected width.
- `height` (INT): The selected height.

**Use Cases:**
- Quickly toggling between Portrait and Landscape orientations.
- Switching between "Preview" (low res) and "Production" (high res) sizes.
- A/B testing different aspect ratios.

---
### � BatchLogicSwitch

**Purpose:** Divides a batch of generations into equal-sized groups and assigns different parameters (A, B, C) to each group. Replaces complex subgraphs of IntDiv, IntMul, and IfElif nodes.

**Inputs:**
- `batch_index` (INT): The controlling signal (e.g., current seed or batch index).
- `total_batch_size` (INT): Total number of items in the batch (default: 12).
- `num_groups` (INT): Number of groups to split the batch into (default: 3).
- `input_A` (ANY): Parameter for the first group (Index 0).
- `input_B` (ANY): Parameter for the second group (Index 1).
- `input_C` (ANY): Parameter for the third group (Index 2).
- `fallback_input` (ANY): Optional fallback value for indices outside the groups.

**Outputs:**
- `selected_context` (ANY): The selected input parameter based on the current batch index.

**Logic:**
1. Calculates `group_size = total_batch_size // num_groups`.
2. Determines `current_group_idx = batch_index // group_size`.
3. Routes the corresponding input (A, B, or C) to the output.

**Use Cases:**
- Applying different prompts or settings to different parts of a batch.
- Creating variations within a single batch generation.
- Simplifying complex logic structures in workflows.

---

### �💾 SaveImageWithSidecarTxt_V2

**Purpose:** Saves images to disk while generating a matching text file containing detailed generation metadata, with support for up to 3 sampling passes.

**Inputs:**
- `images` (IMAGE): The image batch to save
- `filename_prefix` (STRING): Prefix for filenames (default: "ComfyUI")
- `file_format` (COMBO): Output format selection (PNG, JPG, JPEG, WEBP)
- `output_path` (STRING): Optional custom output directory (absolute path)
- `positive_prompt` (STRING): Positive prompt text (ForceInput)
- `negative_prompt` (STRING): Negative prompt text (ForceInput)
- `model_name` (STRING): Name of the diffusion model (ForceInput)
- `clip_name` (STRING): Name of the CLIP model (ForceInput)
- `vae_name` (STRING): Name of the VAE model (ForceInput)
- `p1_sampler`, `p1_scheduler`, `p1_steps`, `p1_seed`: Pass 1 sampling details (ForceInput)
- `p2_sampler`, `p2_scheduler`, `p2_steps`, `p2_seed`: Pass 2 sampling details (ForceInput)
- `p3_sampler`, `p3_scheduler`, `p3_steps`, `p3_seed`: Pass 3 sampling details (ForceInput)

**Outputs:**
- None (Output Node)

**Features:**
- **Sidecar Text File**: Automatically creates a `.txt` file with the same basename as the image.
- **Metadata Logging**: The text file includes prompts, model names, and detailed sampling info for up to 3 passes.
- **Format Support**: Supports PNG (with metadata), JPG/JPEG (high quality), and WEBP.
- **Custom Paths**: Allows saving to a specific folder outside the default ComfyUI output directory.
- **Alpha Handling**: Automatically converts RGBA to RGB for JPEG format.

**Text File Content:**
- Filename & Path
- Model Details (Diffusion, Clip, VAE)
- Positive & Negative Prompts
- Sampling Process (Detailed info for each active sampler pass)

---

### 🌌 EmptyQwen2512LatentImage

**Purpose:** Specialized initialization of empty latents for the Qwen-Image-2512 model, which requires a specific 16-channel architecture.

**Inputs:**
- `resolution` (COMBO): Select from optimized aspect ratios/resolutions (e.g., 16:9, 1:1, 9:16)
- `b🔀 mxInputSwitch3

**Purpose:** Route one of three Any-type inputs to output using visual boolean switches

**Inputs:**
- `input_A` (ANY): First input (can be any ComfyUI data type)
- `input_B` (ANY): Second input (can be any ComfyUI data type)
- `input_C` (ANY): Third input (can be any ComfyUI data type)
- `select_A` (INT): Boolean switch for input A (0 or 1)
- `select_B` (INT): Boolean switch for input B (0 or 1)
- `select_C` (INT): Boolean switch for input C (0 or 1)

**Outputs:**
- `output` (ANY): The selected input (A, B, or C)

**Features:**
- Visual toggle switches with ON/OFF indicators
- Only one input can be active at a time
- Works with any ComfyUI data type (images, latents, models, etc.)

**Use Cases:**
- A/B/C testing three different models or settings
- Three-way conditional routing in workflows
- Compare three different processing paths

---

### 🎛️ SwitchCommandCenter

**Purpose:** Five-input flow control switch with active/inactive state using ExecutionBlocker

**Inputs:**
- `input_1` through `input_5` (ANY): Five inputs of any ComfyUI data type
- `active` (BOOLEAN): Enable/disable switch execution

**Outputs:**
- `output_1` through `output_5` (ANY): Pass-through outputs when active

**Features:**
- Controls whether downstream nodes execute
- Uses ExecutionBlocker for flow control
- Visual active/inactive state indicator

**Use Cases:**
- Enable/disable entire workflow branches
- Conditional execution of expensive operations
- Testing and debugging complex node chains
- Dynamic workflow routing based on user input

---

## Technical Architecture

```
__init__.py                  # Package entry point with NODE_CLASS_MAPPINGS
├── audio_nodes.py           # Audio processing and export nodes
├── slider_nodes.py          # Slider and parameter control nodes
├── multi_value_nodes.py     # Multi-value input nodes (floats, ints, strings)
├── switch_nodes.py          # All switching and logic routing nodes
├── image_nodes.py           # Image processing and I/O nodes
├── latent_nodes.py          # Latent space operation nodes
├── js/                      # Frontend JavaScript extensions
│   ├── CFGGuider.js         # CFG slider widget
│   ├── ModelSamplingFloat.js # Model sampling slider widget
│   ├── Slider.js            # Single-axis slider widget
│   ├── Slider2D.js          # Dual-axis slider widget
│   ├── MultiSlider.js       # Multi-value slider widget (5 sliders)
│   ├── MultiSlider4.js      # Multi-value slider widget (4 sliders)
│   ├── Int3.js              # Integer input widget
│   ├── String3.js           # String input widget
│   ├── InputSwitch.js       # Two-input switch toggle widget
│   ├── InputSwitch3.js      # Three-input switch toggle widget
│   ├── switch_node.js       # Switch command center widget
│   └── DirectoryImageIterator.js  # Directory iterator thumbnail preview widget
└── README.md                # This file
```

### Module Organization

The package is organized into **6 logical modules** for better maintainability:

1. **slider_nodes.py** - Parameter sliders and control widgets
   - mxSlider, mxSlider2D, mxCFGGuider, mxModelSamplingFloat

2. **multi_value_nodes.py** - Multiple value inputs
   - mxFloat4, mxFloat5, mxInt3, mxString3

3. **switch_nodes.py** - Switching and routing logic
   - mxInputSwitch, mxInputSwitch3, mxSizeSwitch, BatchLogicSwitch, SwitchCommandCenter

4. **image_nodes.py** - Image processing and file operations
   - RGBA_to_RGB_Lossless, MegapixelResizeNode, SaveImageWithSidecarTxt_V2, DirectoryImageIterator, IteratorCurrentFilename

5. **latent_nodes.py** - Latent space operations
   - EmptyQwen2512LatentImage, LatentNoiseBlender, VAEDecodeAudioTiled, ACELatentBlend, GenerateNoiseForFlux2Klein

6. **audio_nodes.py** - Audio processing and export
   - SaveAudioAsMP3_Custom
**Use Cases:**
- Enable/disable entire workflow branches
- Conditional execution of expensive operations
- Testing and debugging complex node chains
- Dynamic workflow routing based on user input

---

### 🌌 EmptyQwen2512LatentImage

**Purpose:** Specialized initialization of empty latents for the Qwen-Image-2512 model, which requires a specific 16-channel architecture.

**Inputs:**
- `resolution` (COMBO): Select from optimized aspect ratios/resolutions (e.g., 16:9, 1:1, 9:16)
- `size_multiplier` (FLOAT): Scale factor for resolution (1.0-2.0, step: 0.25)
- `batch_size` (INT): Number of latent images to generate (1-64)

**Outputs:**
- `latent` (LATENT): The initialized empty latent batch with 16 channels
- `width` (INT): The effective width in pixels (aligned to 16px)
- `height` (INT): The effective height in pixels (aligned to 16px)

**Features:**
- Automatic handling of the 16-channel structure required by Qwen
- Pre-defined resolution presets optimized for the model (1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3)
- Scaling slider for resolution adjustment (1.0x to 2.0x)
- Automatic alignment to 16px for optimal VAE encoding
- Correct downsampling factor calculation (factor of 8)

**Use Cases:**
- Starting a Qwen-Image-2512 workflow
- Ensuring correct latent dimensions and channels for this specific model architecture
- Experimenting with different resolutions via the multiplier

---

### 🎨 LatentNoiseBlender

**Purpose:** Blend a latent image with latent noise using a percentage-based slider, ideal for adding controlled noise to latent space representations.

**Inputs:**
- `latent_image` (LATENT): Base latent structure
- `latent_noise` (LATENT): Noise latent to blend in
- `blend_percentage` (INT): Blend amount 0-100 (default: 50, visual slider)

**Outputs:**
- `blended_latent` (LATENT): The resulting blended latent

**Features:**
- Smart shape compatibility checking with automatic resize if needed
- Device-aware processing (handles GPU/CPU automatically)
- Preserves latent metadata and masks
- Visual percentage slider (0-100)
- Batch broadcasting support (1→N or N→N)

**Formula:**
```
output = (1 - alpha) * image + alpha * noise
where alpha = blend_percentage / 100
```

**Use Cases:**
- Adding controlled noise to latents before sampling
- Creative latent space manipulation
- Noise injection for style variation
- Experimental latent blending techniques
- Pre-processing latents for specific samplers

---

### 🎛️ ACELatentBlend

**Purpose:** Specialized blending of ACE-Step 1.5 1D audio latents with multiple blend modes, dynamic resizing, and Spherical Linear Interpolation (Slerp).

**Inputs:**
- `latents_a` (LATENT): The primary/target latent (e.g., empty or noise latent)
- `latents_b` (LATENT): The secondary/reference latent (e.g., loaded audio latent)
- `blend_mode` (COMBO): Blending algorithm — Linear, Slerp, Add, or Multiply (default: Linear)
- `blend_strength` (FLOAT): Blend factor 0.0-1.0 (default: 0.5, step: 0.01)
- `resize_mode` (COMBO): How to handle mismatched temporal lengths — Crop/Pad or Time Stretch (default: Crop/Pad)

**Outputs:**
- `LATENT`: The blended latent result

**Blend Modes:**
- **Linear:** `(1 - strength) * A + strength * B` — Standard weighted average
- **Slerp:** Spherical Linear Interpolation — Maintains magnitude, ideal for latent vectors
- **Add:** `A + (B * strength)` — Additive blending, preserves A and layers B on top
- **Multiply:** `A * (B * strength + (1 - strength))` — Multiplicative modulation

**Resize Modes:**
- **Crop/Pad:** Crops longer latents or zero-pads shorter ones to match `latents_a` length
- **Time Stretch:** Interpolates `latents_b` temporally to match `latents_a` length

**Features:**
- Automatic temporal alignment between latents of different lengths
- Batch size alignment via repetition when batch sizes differ
- Slerp implementation handles collinear vectors gracefully
- Compatible with ACE-Step 1.5 audio latent format (B, C, L)
- Fine-grained blend control with 0.01 step precision

**⚠️ Denoise Setting (Critical):**

When using ACELatentBlend, the `denoise` value on your sampler must be adjusted to complement the `blend_strength`. As a rule of thumb, set denoise to approximately `1.0 - blend_strength`. For example, if you blend 30% (`blend_strength = 0.3`) of a reference audio latent into empty noise, the latent is already partially formed — a high denoise would overwrite that injected structure.

- **Sweet spot: 0.6–0.8 denoise.** This range respects the blended reference while still allowing the sampler to generate new content guided by your prompts.
- **Below 0.5 denoise:** Too much of the reference audio will dominate the output. The sampler doesn't have enough freedom to reshape the latent, leading to audible distortions and poor quality in the generated song.
- **At 1.0 denoise:** The sampler fully re-noises the latent, effectively ignoring the blended reference entirely.

**Use Cases:**
- Blending reference audio latents with noise for guided generation
- Time-stretching audio latents to match different durations
- Creative audio latent manipulation with different blend curves
- Interpolating between two audio concepts in latent space using Slerp
- Layering audio characteristics from one generation onto another

---

### 🔊 GenerateNoiseForFlux2Klein

**Purpose:** Generates highly parameterized noise tensors for injection or use as empty latents, refactored to support Flux 2 Klein architectures (128 channels, f16 spatial downsampling) while maintaining backward compatibility with SD1.5/SDXL/SD3 workflows.

**Inputs:**
- `width` (INT): Image width in pixels (16-8192, step: 16, default: 1024)
- `height` (INT): Image height in pixels (16-8192, step: 16, default: 1024)
- `batch_size` (INT): Number of noise samples to generate (1-4096, default: 1)
- `seed` (INT): Random seed for deterministic generation (default: 123)
- `multiplier` (FLOAT): Noise intensity multiplier (0.0-4096, step: 0.01, default: 1.0)
- `constant_batch_noise` (BOOLEAN): Replicate identical noise across the batch (default: False)
- `normalize` (BOOLEAN): Normalize noise variance to unit standard deviation (default: False)
- `model` (MODEL, optional): Model for sigma-based variance scaling
- `sigmas` (SIGMAS, optional): Diffusion schedule sigmas for noise scaling
- `latent_channels` (COMBO, optional): Number of latent channels — 4 (SD1.5/SDXL), 16 (SD3/Qwen), or 128 (Flux 2 Klein)
- `shape` (COMBO, optional): Tensor layout — BCHW (2D images), BCTHW or BTCHW (video/volumetric)

**Outputs:**
- `LATENT`: Generated noise tensor wrapped in ComfyUI latent format

**Key Features:**
- **Flux 2 Klein Support:** 128-channel latent noise with f16 spatial downsampling
- **Dynamic Downscaling:** Automatically uses f16 for 128 channels, f8 for 4/16 channels
- **Multiple Tensor Shapes:** BCHW (standard image), BCTHW/BTCHW (video synthesis)
- **Sigma Scaling:** Optional variance scaling using model sigmas and latent format scale factor
- **Deterministic Seeds:** Manual seed-based generator for reproducible noise
- **Normalization:** Optional unit variance normalization
- **Constant Batch Noise:** Option to repeat identical noise across the batch dimension

**Architecture Compatibility:**
| Channels | Downscale | Use Case |
|----------|-----------|----------|
| 4 | f8 | SD 1.5, SDXL |
| 16 | f8 | SD3, Qwen-Image-2512 |
| 128 | f16 | Flux 2 Klein |

**Use Cases:**
- Generating empty latents for Flux 2 Klein workflows
- Creating parameterized noise injection for any diffusion architecture
- Video synthesis latent initialization (BCTHW/BTCHW formats)
- Sigma-aware noise scaling for custom sampling schedules
- Deterministic noise generation for reproducible experiments

---

### 🔊 VAEDecodeAudioTiled

**Purpose:** Memory-efficient tiled decoding of audio latents, designed for processing long audio sequences without running out of VRAM.

**Inputs:**
- `samples` (LATENT): Audio latent samples to decode
- `vae` (VAE): VAE model for decoding (e.g., ACE-Step audio VAE)
- `tile_size` (INT): Size of each processing tile (128-4096, default: 512)
- `overlap` (INT): Overlap between tiles for smooth blending (16-512, default: 64)

**Outputs:**
- `AUDIO`: Decoded audio waveform with sample rate

**Features:**
- **Tiled Processing**: Decodes audio in chunks to minimize VRAM usage
- **Hann Window Blending**: Smooth transitions between tiles using overlap-add with Hann windowing
- **CPU Buffer Allocation**: Output accumulated on CPU to avoid GPU memory overflow
- **Automatic VRAM Cleanup**: Clears GPU cache after each tile for maximum efficiency
- **STD Normalization**: Global normalization for consistent audio output levels
- **ACE-Step Compatible**: Designed for ACE-Step 1.5 audio models (1920x upscale ratio)

**Technical Details:**
```
stride = tile_size - overlap
For each tile:
  1. Extract latent slice
  2. Decode on GPU
  3. Apply Hann window
  4. Accumulate to CPU buffer with overlap-add
  5. Clear VRAM
Finally: Normalize by accumulated weights and apply STD normalization
```

**Use Cases:**
- Decoding long audio sequences that would otherwise exceed VRAM
- Processing high-resolution audio latents from ACE-Step models
- Memory-constrained workflows requiring audio generation
- Batch audio decoding with limited GPU memory

---

### �🖼️ MegapixelResizeNode

**Purpose:** Resize images to a specific megapixel count while maintaining aspect ratio and ensuring VAE-compatible dimensions (multiples of 8).

**Inputs:**
- `image` (IMAGE): Input image batch
- `target_megapixels` (FLOAT): Target size in megapixels (0.1-4.0, default: 1.0)
- `method` (COMBO): Resampling method (lanczos, bicubic, bilinear, nearest-exact, area)

**Outputs:**
- `IMAGE`: Resized image
- `width` (INT): New width in pixels
- `height` (INT): New height in pixels

**Features:**
- Maintains original aspect ratio
- Ensures dimensions are multiples of 8 for VAE compatibility
- Target size in megapixels (e.g., 1.0 MP ≈ 1024×1024)
- Multiple resampling methods for quality/speed trade-offs
- Automatic safety clamping to prevent zero-dimension images

**Calculation:**
```
target_pixels = megapixels * 1,000,000
height = sqrt(target_pixels / aspect_ratio)
width = height * aspect_ratio
(rounded to nearest multiple of 8)
```

**Use Cases:**
- Standardizing images to consistent sizes for batch processing
- Preparing images for specific model input requirements
- Downsizing large images while maintaining quality
- Creating thumbnails or previews at specific megapixel targets
- Ensuring VAE-compatible dimensions automatically

```2.0.0 (2026-02-03) - Major Reorganization
- **Complete code reorganization** into 5 logical modules for better maintainability
  - `slider_nodes.py` - Slider and parameter controls (4 nodes)
  - `multi_value_nodes.py` - Multi-value inputs (4 nodes)
  - `switch_nodes.py` - Switching and routing logic (5 nodes)
  - `image_nodes.py` - Image processing and I/O (3 nodes)
  - `latent_nodes.py` - Latent space operations (2 nodes)
- **New Nodes:**
  - Added **Latent Noise Blender** (`LatentNoiseBlender`) - Blend latents with noise using percentage slider
  - Added **Megapixel Resize** (`MegapixelResizeNode`) - Intelligent image resizing by target megapixel count
  - Added **Switch Command Center** (`SwitchCommandCenter`) - Five-input flow control with ExecutionBlocker
- **Enhanced Nodes:**
  - `EmptyQwen2512LatentImage` now includes size_multiplier slider for resolution scaling
  - All nodes from `mytoolkit.py` distributed to appropriate modules
- **Documentation:**
  - Complete README overhaul reflecting new structure
  - Added detailed documentation for all new nodes
  - Updated examples and usage patterns
- **Total Node Count:** 18 nodes organized across 5 modules

### v1.8.0 (2026)
- Added **Size Switch** (`mxSizeSwitch`) node for easy toggling between two resolution pairs with customizable labels

### v1.7.0 (2026)
- Added **Empty Qwen Latent** (`EmptyQwen2512LatentImage`) for Qwen-Image-2512 model support with 16-channel latents

### v1.6.0 (2026)
- Added **Batch Logic Switch** (`BatchLogicSwitch`) node for splitting batches and assigning different parameters to groups
│   ├── Slider2D.js          # Dual-axis slider widget
│   ├── MultiSlider.js       # Multi-value slider widget (5 sliders)
│   ├── MultiSlider4.js      # Multi-value slider widget (4 sliders)
│   ├── Int3.js              # Integer input widget
│   ├── String3.js           # String input widget
│   └── InputSwitch.js       # Input switch toggle widget
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

### Example 4: Advanced Model Sampling Control

```
[ModelSamplingFloat] → sampling_parameter → [Custom Sampler]
```

Fine-tune model sampling parameters with 0.01 precision across 0.00-15.00 range for advanced workflows.

### Example 5: Multi-LoRA Weight Control

```
[Float 4] → F1,F2,F3,F4 → [Multiple LoRA Loaders]
```

Control four different LoRA weights simultaneously with precision sliders and custom labels.

---

### Example 6: Conditional Model Selection

```
[Load Checkpoint A] ──┐
                       ├── [Input Switch] → [KSampler]
[Load Checkpoint B] ──┘
```

Switch between two different models with a single toggle. Use custom labels like "SD 1.5" and "SDXL" for clarity.

### Example 7: Image Path Selection

```
[Load Image 1] ──┐
                  ├── [Input Switch] → [Image Processing]
[Load Image 2] ──┘
```

Compare different source images by toggling between them without rewiring connections.

### Example 8: Saving with Metadata

```
[KSampler] → [SaveImageWithSidecarTxt_V2]
```

Connect your image and all metadata strings (prompts, model names, sampler details for up to 3 passes) to generate an image file and a corresponding text file with all generation parameters.

### Example 9: Batch Parameter Variation

```
[Batch Index] → [BatchLogicSwitch] → [KSampler]
```

Split a batch of 12 images into 3 groups of 4. Assign different LoRAs or prompts to `input_A`, `input_B`, and `input_C`. The switch will automatically route the correct parameter based on the current image index.

### Example 10: Latent Noise Blending

```
[Empty Latent Image] → latent_image ─┐
                                       ├─ [Latent Noise Blender] → [KSampler]
[Random Noise Latent] → latent_noise ─┘
```

Blend 50% of random noise into your base latent to add variation before sampling. Adjust the blend_percentage slider from 0-100 to control noise intensity.

### Example 11: Megapixel-Based Resizing

```
[Load Image] → [Megapixel Resize] → [VAE Encode]
                (target: 2.0 MP)
```

Resize any input image to exactly 2 megapixels while maintaining aspect ratio and ensuring dimensions are VAE-compatible (multiples of 8). Perfect for standardizing batch inputs.

### Example 12: Flow Control with Switch Command Center

```
[Model A] ──┐
[Prompt A] ─┤
[LoRA A] ───┼── [Switch Command Center] ──→ [Active Branch Processing]
[CFG A] ────┤      (active: True/False)
[Steps A] ──┘
```

Enable or disable entire workflow branches with a single toggle. When inactive, ExecutionBlocker prevents downstream nodes from executing, saving computation time during experimentation.

### Example 13: ACE-Step Latent Blending

```
[ACE Empty Latent] → latents_a ─┐
                                  ├─ [ACE Latent Blend 1.5] → [ACE Sampler]
[ACE Encode Audio] → latents_b ─┘   (mode: Slerp, strength: 0.7)
```

Blend a reference audio latent into an empty noise latent using Slerp interpolation at 70% strength. The node automatically handles temporal alignment if the latents have different lengths. Use "Time Stretch" resize mode to match durations, or "Crop/Pad" to trim/extend.

### Example 14: Flux 2 Klein Noise Generation

```
[GenerateNoiseForFlux2Klein] → latent → [KSampler / Flux 2 Pipeline]
  (channels: 128, shape: BCHW, width: 1024, height: 1024)
```

Generate 128-channel noise at f16 spatial resolution for Flux 2 Klein workflows. The node automatically applies the correct downscale factor (f16 for 128 channels). For legacy SD1.5/SDXL workflows, simply select 4 channels to use standard f8 downsampling. Optionally connect a model and sigmas for variance-scaled noise.

### Example 15: Audio Export to MP3

```
[Audio Generation Node] → audio → [SaveAudioAsMP3_Custom]
                                   (quality: 192k, filename: "my_audio")
```

Export generated audio from text-to-speech or music generation models directly to MP3 format. Choose quality preset from 64k to 320k based on your needs. Batch audio is automatically processed and saved with index numbers (e.g., `my_audio_001.mp3`, `my_audio_002.mp3`). Supports custom output paths and automatic overwrite protection.

### Example 16: Sequential Folder Processing with Per-Image Filenames

```
[DirectoryImageIterator]
  folder_path: "D:\MyImages"    ── image    → [Megapixel Resize] ──────────────→ [SaveImage]
  start_index: 0                                                                      ↑
  image_limit: 0                ── filename → [Iterator Current Filename] ── filename_prefix
```

Processes every image in a folder one-by-one and saves each result named after its source file (e.g., `photo_001.png`). The **Iterator Current Filename** node is the essential bridge: it accepts the full filename list from the iterator, strips the file extension, and forwards exactly one clean string per step to `filename_prefix`. Without it, connecting `filename` directly causes `"expected string or bytes-like object, got 'list'"`.

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

### v2.5.1 (2026-02-22)
- **Directory Image Iterator** — Added interactive pagination controls
  - ◀ / ▶ navigation arrows below the preview image for browsing all loaded images after execution
  - Wrap-around navigation (past last → first, before first → last)
  - Page counter between buttons showing current position (e.g., "3 / 10")
  - Hover highlight feedback on navigation buttons
  - Mouse events consumed by buttons to prevent accidental node dragging

### v2.5.0 (2026-02-22)
- Added **Directory Image Iterator** (`DirectoryImageIterator`) for sequential folder-based image processing
  - Ingests a sorted, deterministically sliced subset of images from any local directory
  - `OUTPUT_IS_LIST` paradigm: iterates one image at a time through the downstream graph — no batch-dimension crashes on mixed resolutions
  - Cryptographic SHA-256 directory hashing in `IS_CHANGED` for smart cache invalidation (re-executes only when the slice actually changes)
  - Path traversal protection via `os.path.realpath` sanitization
  - Live thumbnail preview painted directly onto the LiteGraph canvas with automatic aspect-ratio-correct node resizing
  - Thumbnail state persisted through `app.nodeOutputs` for within-session recovery after graph reloads
  - Lightweight JPEG thumbnails (max 512×512) saved to ComfyUI temp directory with secure random prefixes
- Added **Iterator Current Filename** (`IteratorCurrentFilename`) helper node
  - Bridges `DirectoryImageIterator.filename` to `SaveImage.filename_prefix` without type errors
  - Accepts the full filename list via `INPUT_IS_LIST = True`, strips file extensions, re-emits via `OUTPUT_IS_LIST = (True,)`
  - Fixes `"expected string or bytes-like object, got 'list'"` when saving iterated images by name
- **Total Node Count:** 24 nodes organized across 6 modules

### v2.4.0 (2026-02-16)
- Added **Generate Noise (Flux 2 Klein)** (`GenerateNoiseForFlux2Klein`) for parameterized noise generation
  - Supports Flux 2 Klein 128-channel architecture with f16 spatial downsampling
  - Backward compatible with SD1.5/SDXL (4ch) and SD3/Qwen (16ch)
  - Multiple tensor shapes: BCHW (image), BCTHW/BTCHW (video)
  - Optional sigma-based variance scaling, normalization, and constant batch noise
  - Deterministic seed-based generation for reproducibility
- **Total Node Count:** 22 nodes organized across 6 modules

### v2.3.0 (2026-02-06)
- Added **ACE Latent Blend 1.5** (`ACELatentBlend`) for blending ACE-Step 1.5 audio latents
  - Four blend modes: Linear, Slerp, Add, Multiply
  - Automatic temporal alignment with Crop/Pad or Time Stretch
  - Batch size alignment via repetition
  - Fine-grained blend strength control (0.01 steps)
- **Total Node Count:** 21 nodes organized across 6 modules

### v2.2.0 (2026-02-05)
- Added **Save Audio as MP3 (Custom)** (`SaveAudioAsMP3_Custom`) for audio export functionality
  - Export audio to MP3 format with quality control (64k-320k bitrate)
  - Batch processing with automatic file naming and overwrite protection
  - Custom output path support with automatic directory creation
  - Handles mono and stereo audio with proper format conversion
- **New Module:** `audio_nodes.py` - Audio processing and export
- **Dependencies:** Added `requirements.txt` with pydub package requirement
- **Total Node Count:** 20 nodes organized across 6 modules

### v2.1.0 (2026-02-04)
- Added **VAE Decode Audio (Tiled)** (`VAEDecodeAudioTiled`) for memory-efficient audio latent decoding
  - Tiled processing with Hann window overlap blending
  - CPU buffer accumulation to avoid VRAM overflow
  - Compatible with ACE-Step 1.5 audio models
- **Total Node Count:** 19 nodes organized across 5 modules

### v1.8.0 (2026)
- Added **Size Switch** (`mxSizeSwitch`) node for easy toggling between two resolution pairs with customizable labels.

### v1.7.0 (2026)
- Added **Empty Qwen Latent** (`EmptyQwen2512LatentImage`) for Qwen-Image-2512 model support with 16-channel latents.

### v1.6.0 (2026)
- Added **Batch Logic Switch** (`BatchLogicSwitch`) node for splitting batches and assigning different parameters to groups.

### v1.5.0 (2026)
- Replaced **SaveImageWithSidecarTxt** with **SaveImageWithSidecarTxt_V2**
- Added support for logging up to 3 separate sampler passes (Sampler, Scheduler, Steps, Seed) in the sidecar text file

### v1.4.0 (2025)
- Added **SaveImageWithSidecarTxt** node for saving images with detailed metadata text files
- Supports PNG, JPG, JPEG, and WEBP formats
- Custom output path support

### v1.3.0 (2025)
- Added **Input Switch** (`mxInputSwitch`) node for routing between two Any-type inputs
- Visual toggle switches with automatic mutual exclusion
- Customizable input labels for better workflow organization
- Supports all ComfyUI data types (images, models, latents, etc.)

### v1.2.0 (2025)
- Added **Model Sampling Float** (`mxModelSamplingFloat`) node for advanced sampling control
- Extended value range (0.00-15.00) for model sampling parameters
- Compact single-slider design with high precision

### v1.1.0 (2025)
- Added **Float 4** (`mxFloat4`) node with higher precision (0.01 steps)
- Enhanced slider controls with editable labels
- Improved documentation with detailed use cases

### v1.0.0 (2025)
- Initial release
- 9 custom nodes with JavaScript UI integration
- RGBA to RGB lossless converter
- Interactive slider controls with customizable properties
- Multi-value input nodes
- Comprehensive documentation

---

**Made with ❤️ for the ComfyUI community**
