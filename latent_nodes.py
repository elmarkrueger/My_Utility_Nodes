# ComfyUI - Latent Space Nodes - Elmar Krüger - 2025
import torch


class EmptyQwen2512LatentImage:
    """
    Eine spezialisierte ComfyUI Node zur Initialisierung leerer Latents für das
    Qwen-Image-2512 Modell.
    Features:
    - 16-Kanal-Architektur Support
    - Optimierte Qwen-Auflösungen (Dropdown)
    - Skalierungs-Slider (1.0 - 2.0)
    - Automatische Rundung auf 16px Alignment
    """

    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        # Definition der unterstützten Auflösungen gemäß Research [1, 8]
        # Das Format ist "Label: (Breite, Höhe)"
        # Dies erleichtert die Auswahl im Dropdown
        s.ratios = {
            "1:1 (1328x1328)": (1328, 1328),
            "16:9 (1664x928)": (1664, 928),
            "9:16 (928x1664)": (928, 1664),
            "4:3 (1472x1104)": (1472, 1104),
            "3:4 (1104x1472)": (1104, 1472),
            "3:2 (1584x1056)": (1584, 1056),
            "2:3 (1056x1584)": (1056, 1584),
        }

        return {
            "required": {
                # Das Dropdown-Menü (COMBO)
                "resolution": (list(s.ratios.keys()), {"default": "16:9 (1664x928)"}),
                # Der Skalierungs-Slider
                # ComfyUI stellt FLOAT inputs mit min/max/step automatisch als Slider dar
                "size_multiplier": (
                    "FLOAT",
                    {
                        "default": 1.0,
                        "min": 1.0,
                        "max": 2.0,
                        "step": 0.25,
                        "display": "slider",
                    },
                ),
                # Das Integer-Feld für die Batch Size
                "batch_size": ("INT", {"default": 1, "min": 1, "max": 64, "step": 1}),
            }
        }

    # Definition der drei Ausgänge: Latent, Breite, Höhe
    RETURN_TYPES = ("LATENT", "INT", "INT")
    RETURN_NAMES = ("latent", "width", "height")

    # Name der Funktion, die ausgeführt wird
    FUNCTION = "generate"

    # Kategorie im Menü (My_Utility_Nodes Pack)
    CATEGORY = "My_Utility_Nodes/Qwen"

    def generate(self, resolution, size_multiplier, batch_size):
        # 1. Basis-Auflösung aus dem Dictionary extrahieren
        base_width, base_height = self.ratios[resolution]

        # 2. Skalierung anwenden
        # Wir multiplizieren mit dem Slider-Wert
        scaled_width = base_width * size_multiplier
        scaled_height = base_height * size_multiplier

        # 3. Sicherheits-Rundung (Alignment)
        # Um sicherzustellen, dass die Dimensionen sauber durch 16 teilbar sind (für VAE und Patches),
        # runden wir das skalierte Ergebnis auf das nächste Vielfache von 16.
        # Beispiel: 928 * 1.25 = 1160. 1160 / 16 = 72.5. Round -> 72 * 16 = 1152.
        width = int(round(scaled_width / 16) * 16)
        height = int(round(scaled_height / 16) * 16)

        # 4. Technische Konstanten für Qwen-Image-2512
        # Das Modell nutzt einen 16-Kanal VAE [5]
        latent_channels = 16
        # Der Downsampling-Faktor beträgt 8
        downscale_factor = 8

        # 5. Berechnung der latenten Dimensionen
        # Integer Division (//) stellt sicher, dass wir ganze Zahlen erhalten
        latent_width = width // downscale_factor
        latent_height = height // downscale_factor

        # 6. Initialisierung des Tensors
        # Shape:
        # Wir nutzen torch.zeros, da der Sampler das Noise hinzufügt
        latent = torch.zeros([batch_size, latent_channels, latent_height, latent_width])

        # 7. Rückgabe
        # ComfyUI erwartet Latents in einem Dictionary mit Key "samples"
        # Wir geben zudem die berechneten (skalierten) Integer-Werte für Breite und Höhe zurück
        return ({"samples": latent}, width, height)


class LatentNoiseBlender:
    """
    A custom node for ComfyUI to blend a latent image with latent noise.
    Features a visual slider for blend percentage.
    """
    
    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        """
        Defines the input schema.
        - latent_image: The base latent structure.
        - latent_noise: The noise latent to blend in.
        - blend_percentage: 0-100 visual slider.
        """
        return {
            "required": {
                "latent_image": ("LATENT",),
                "latent_noise": ("LATENT",),
                "blend_percentage": ("INT", {
                    "default": 50, 
                    "min": 0, 
                    "max": 100, 
                    "step": 1,
                    "display": "slider" 
                }),
            }
        }

    RETURN_TYPES = ("LATENT",)
    RETURN_NAMES = ("blended_latent",)
    FUNCTION = "blend"
    CATEGORY = "Latent/Noise"

    def blend(self, latent_image, latent_noise, blend_percentage):
        # Extract sample tensors from the dictionaries
        img_samples = latent_image["samples"]
        noise_samples = latent_noise["samples"]
        
        # 1. Shape Compatibility Check
        # If the noise dimensions don't match the image, resize the noise.
        # This handles cases where noise source might be different resolution.
        if img_samples.shape[2:] != noise_samples.shape[2:]:
            print(f"LatentNoiseBlender: Resizing noise from {noise_samples.shape} to {img_samples.shape}")
            noise_samples = torch.nn.functional.interpolate(
                noise_samples, 
                size=(img_samples.shape[2], img_samples.shape[3]), 
                mode="bicubic"
            )
            
        # 2. Batch Compatibility Check (Broadcasting)
        # If noise batch size is 1 and image is N, PyTorch broadcasts automatically.
        # If noise is N and image is 1, we let it process (output will be batch N).
        
        # 3. Calculate Alpha
        # Convert integer percentage (0-100) to float (0.0-1.0)
        alpha = float(blend_percentage) / 100.0
        
        # 4. Perform Blending
        # Formula: (1 - alpha) * Image + alpha * Noise
        # We perform the operation on the device (GPU/CPU) where img_samples resides.
        # We must clone img_samples to ensure we don't mutate the input.
        
        # Ensure noise is on the same device as the image
        if noise_samples.device != img_samples.device:
            noise_samples = noise_samples.to(img_samples.device)
            
        blended_samples = (1.0 - alpha) * img_samples.clone() + alpha * noise_samples
        
        # 5. Construct Output
        # Deep copy the dictionary structure to preserve masks/metadata
        result_latent = latent_image.copy()
        result_latent["samples"] = blended_samples
        
        return (result_latent,)

from comfy_api.latest import IO, UI, ComfyExtension


class VAEDecodeAudioTiled(IO.ComfyNode):
    @classmethod
    def define_schema(cls):
        return IO.Schema(
            node_id="VAEDecodeAudioTiled",
            display_name="VAE Decode Audio (Tiled)",
            category="latent/audio",
            inputs=[
                IO.Latent.Input("samples"),
                IO.Vae.Input("vae"),
                IO.Int.Input("tile_size", default=512, min=128, max=4096),
                IO.Int.Input("overlap", default=64, min=16, max=512),
            ],
            outputs=[IO.Audio.Output()],
        )

    @classmethod
    def execute(cls, vae, samples, tile_size, overlap) -> IO.NodeOutput:
        latents = samples["samples"]
        batch_size, channels, total_steps = latents.shape
        upscale_ratio = 1920 # ACE-Step 1.5 constant
        
        # Calculate output size
        total_samples = total_steps * upscale_ratio
        
        # Allocate CPU buffer
        output_buffer = torch.zeros((batch_size, 2, total_samples), dtype=torch.float32, device="cpu")
        weight_buffer = torch.zeros((batch_size, 2, total_samples), dtype=torch.float32, device="cpu")
        
        stride = tile_size - overlap
        
        # Window function (Hann)
        # Note: Window needs to be generated per tile size if last tile is smaller
        
        for start_idx in range(0, total_steps, stride):
            end_idx = min(start_idx + tile_size, total_steps)
            tile_latent = latents[:, :, start_idx:end_idx]
            
            # Decode on GPU
            # Auto-move to GPU handled by comfy model management or manual.to()
            gpu_latent = tile_latent.to(vae.device)
            decoded_tile = vae.decode(gpu_latent).movedim(-1, 1) #
            
            # Move to CPU
            cpu_tile = decoded_tile.cpu()
            
            # Create Window
            current_audio_len = cpu_tile.shape[-1]
            window = torch.hann_window(current_audio_len, device="cpu").view(1, 1, -1)
            
            # Calculate buffer placement
            sample_start = start_idx * upscale_ratio
            sample_end = sample_start + current_audio_len
            
            # Accumulate
            output_buffer[:, :, sample_start:sample_end] += cpu_tile * window
            weight_buffer[:, :, sample_start:sample_end] += window
            
            # VRAM Cleanup
            del gpu_latent, decoded_tile
            torch.cuda.empty_cache() # Optional, aggressive cleanup

        # Normalize weights
        mask = weight_buffer > 1e-6
        output_buffer[mask] /= weight_buffer[mask]
        
        # Global STD Normalization (on CPU)
        std = torch.std(output_buffer, dim=(1, 2), keepdim=True) * 5.0
        std[std < 1.0] = 1.0
        output_buffer /= std
        
        vae_sample_rate = getattr(vae, "audio_sample_rate", 44100)
        return IO.NodeOutput({"waveform": output_buffer, "sample_rate": vae_sample_rate})


NODE_CLASS_MAPPINGS = {
    "EmptyQwen2512LatentImage": EmptyQwen2512LatentImage,
    "LatentNoiseBlender": LatentNoiseBlender,
    "VAEDecodeAudioTiled": VAEDecodeAudioTiled,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "EmptyQwen2512LatentImage": "Empty Qwen-2512 Latent Image",
    "LatentNoiseBlender": "Latent Noise Blender",
    "VAEDecodeAudioTiled": "VAE Decode Audio (Tiled)",
}
