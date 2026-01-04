# ComfyUI - mytoolkit - Elmar Krüger - 2025
import json
import os

import folder_paths
import nodes
import numpy as np
import torch
from PIL import Image
from PIL.PngImagePlugin import PngInfo


class AnyType(str):
    def __ne__(self, __value: object) -> bool:
        return False


any = AnyType("*")


# --------------------------------------------------------------------------------
# Node 2: V2 Version (Separate Inputs für 3 Sampler Passes)
# --------------------------------------------------------------------------------
class SaveImageWithSidecarTxt_V2:
    def __init__(self):
        self.output_dir = folder_paths.get_output_directory()
        self.type = "output"
        self.compress_level = 4

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "images": ("IMAGE", ),
                "filename_prefix": ("STRING", {"default": "ComfyUI"}),
                "file_format": (["PNG", "JPG", "JPEG", "WEBP"], {"default": "PNG"}),
            },
            "optional": {
                "output_path": ("STRING", {"default": "", "multiline": False, "placeholder": "C:\\Mein\\Pfad (optional)"}),
                "positive_prompt": ("STRING", {"forceInput": True, "multiline": True, "default": ""}),
                "negative_prompt": ("STRING", {"forceInput": True, "multiline": True, "default": ""}),
                "model_name": ("STRING", {"forceInput": True, "default": "Unknown Model"}),
                "clip_name": ("STRING", {"forceInput": True, "default": "Unknown CLIP"}),
                "vae_name": ("STRING", {"forceInput": True, "default": "Unknown VAE"}),
                
                # --- Pass 1 ---
                "p1_sampler": ("STRING", {"forceInput": True}),
                "p1_scheduler": ("STRING", {"forceInput": True}),
                "p1_steps": ("INT", {"forceInput": True}),
                "p1_seed": ("INT", {"forceInput": True}),
                
                # --- Pass 2 ---
                "p2_sampler": ("STRING", {"forceInput": True}),
                "p2_scheduler": ("STRING", {"forceInput": True}),
                "p2_steps": ("INT", {"forceInput": True}),
                "p2_seed": ("INT", {"forceInput": True}),
                
                # --- Pass 3 ---
                "p3_sampler": ("STRING", {"forceInput": True}),
                "p3_scheduler": ("STRING", {"forceInput": True}),
                "p3_steps": ("INT", {"forceInput": True}),
                "p3_seed": ("INT", {"forceInput": True}),
            },
            "hidden": {"prompt": "PROMPT", "extra_pnginfo": "EXTRA_PNGINFO"},
        }

    RETURN_TYPES = ()
    FUNCTION = "save_images_and_text_v2"
    OUTPUT_NODE = True
    CATEGORY = "Custom_Research/IO"

    def save_images_and_text_v2(self, images, filename_prefix="ComfyUI", file_format="PNG", output_path="",
                                positive_prompt="", negative_prompt="", 
                                model_name="Unknown Model", clip_name="Unknown CLIP", vae_name="Unknown VAE",
                                p1_sampler=None, p1_scheduler=None, p1_steps=None, p1_seed=None,
                                p2_sampler=None, p2_scheduler=None, p2_steps=None, p2_seed=None,
                                p3_sampler=None, p3_scheduler=None, p3_steps=None, p3_seed=None,
                                prompt=None, extra_pnginfo=None):
        
        # 1. Pfad-Logik (identisch zu V1)
        if output_path and output_path.strip():
            base_output_dir = output_path.strip()
            try:
                if not os.path.exists(base_output_dir): os.makedirs(base_output_dir, exist_ok=True)
            except: base_output_dir = self.output_dir
        else:
            base_output_dir = self.output_dir

        full_output_folder, filename, counter, subfolder, filename_prefix = \
            folder_paths.get_save_image_path(filename_prefix, base_output_dir, images.shape[2], images.shape[1])
        
        extension = file_format.lower()
        if extension == "jpeg": extension = "jpg"

        # 2. Sampler String Konstruktion (Das Herzstück von V2)
        sampler_lines = []
        
        # Pass 1
        if p1_sampler or p1_steps:
            s_name = p1_sampler if p1_sampler else "N/A"
            sched = p1_scheduler if p1_scheduler else "N/A"
            st = p1_steps if p1_steps is not None else "N/A"
            sd = p1_seed if p1_seed is not None else "N/A"
            sampler_lines.append(f"First Sampler: --> {s_name}, First Scheduler: --> {sched}, Steps first Sampler: --> {st}, Seed first Sampler: --> {sd}")

        # Pass 2
        if p2_sampler or p2_steps:
            s_name = p2_sampler if p2_sampler else "N/A"
            sched = p2_scheduler if p2_scheduler else "N/A"
            st = p2_steps if p2_steps is not None else "N/A"
            sd = p2_seed if p2_seed is not None else "N/A"
            sampler_lines.append(f"Second Sampler: --> {s_name}, Second Scheduler: --> {sched}, Steps second Sampler: --> {st}, Seed second Sampler: --> {sd}")

        # Pass 3
        if p3_sampler or p3_steps:
            s_name = p3_sampler if p3_sampler else "N/A"
            sched = p3_scheduler if p3_scheduler else "N/A"
            st = p3_steps if p3_steps is not None else "N/A"
            sd = p3_seed if p3_seed is not None else "N/A"
            sampler_lines.append(f"Third Sampler: --> {s_name}, Third Scheduler: --> {sched}, Steps third Sampler: --> {st}, Seed third Sampler: --> {sd}")

        formatted_sampler_details = "\n".join(sampler_lines)

        results = list()
        for image in images:
            # Bild speichern (identisch zu V1)
            i = 255. * image.cpu().numpy()
            img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8))
            if file_format in ["JPG", "JPEG"] and img.mode == 'RGBA': img = img.convert('RGB')
            
            metadata = None
            if file_format == "PNG":
                metadata = PngInfo()
                if prompt is not None: metadata.add_text("prompt", json.dumps(prompt))
                if extra_pnginfo is not None: 
                    for x in extra_pnginfo: metadata.add_text(x, json.dumps(extra_pnginfo[x]))

            file_base = f"{filename}_{counter:05}_"
            file_img = f"{file_base}.{extension}"
            file_txt = f"{file_base}.txt"
            
            image_path = os.path.join(full_output_folder, file_img)
            txt_path = os.path.join(full_output_folder, file_txt)
            
            if file_format == "PNG": img.save(image_path, pnginfo=metadata, compress_level=self.compress_level)
            elif file_format in ["JPG", "JPEG"]: img.save(image_path, quality=95)
            elif file_format == "WEBP": img.save(image_path, quality=95, lossless=False)

            # Text speichern
            txt_content = f"""FILENAME INFORMATION
Filename: {file_img}
Filepath: {image_path}
Format:   {file_format}

==================================================
MODEL DETAILS
==================================================
Diffusion Model: {model_name}
Clip Model:      {clip_name}
VAE Model:       {vae_name}

==================================================
PROMPTS
==================================================
[Positive Prompt]
{positive_prompt}

[Negative Prompt]
{negative_prompt}

==================================================
SAMPLING PROCESS (Seeds & Steps)
==================================================
{formatted_sampler_details}
"""
            try:
                with open(txt_path, "w", encoding="utf-8") as f: f.write(txt_content)
            except Exception as e: print(f"Error: {e}")
                
            results.append({"filename": file_img, "subfolder": subfolder, "type": self.type})
            counter += 1

        return {"ui": {"images": results}}


class mxSlider:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "Xi": ("INT", {"default": 20, "min": -4294967296, "max": 4294967296}),
                "Xf": ("FLOAT", {"default": 20, "min": -4294967296, "max": 4294967296}),
                "isfloatX": ("INT", {"default": 0, "min": 0, "max": 1}),
            },
        }

    RETURN_TYPES = (any,)
    RETURN_NAMES = ("X",)

    FUNCTION = "main"
    CATEGORY = "utils/slider"

    def main(self, Xi, Xf, isfloatX):
        if isfloatX > 0:
            out = Xf
        else:
            out = Xi
        return (out,)


class mxSlider2D:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "Xi": ("INT", {"default": 512, "min": -4294967296, "max": 4294967296}),
                "Xf": (
                    "FLOAT",
                    {"default": 512, "min": -4294967296, "max": 4294967296},
                ),
                "Yi": ("INT", {"default": 512, "min": -4294967296, "max": 4294967296}),
                "Yf": (
                    "FLOAT",
                    {"default": 512, "min": -4294967296, "max": 4294967296},
                ),
                "isfloatX": ("INT", {"default": 0, "min": 0, "max": 1}),
                "isfloatY": ("INT", {"default": 0, "min": 0, "max": 1}),
            },
        }

    RETURN_TYPES = (
        any,
        any,
    )
    RETURN_NAMES = (
        "X",
        "Y",
    )

    FUNCTION = "main"
    CATEGORY = "utils/slider"

    def main(self, Xi, Xf, isfloatX, Yi, Yf, isfloatY):
        if isfloatX > 0:
            outX = Xf
        else:
            outX = Xi
        if isfloatY > 0:
            outY = Yf
        else:
            outY = Yi
        return (
            outX,
            outY,
        )


class mxFloat5:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "F1": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 1.0, "step": 0.1}),
                "F2": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 1.0, "step": 0.1}),
                "F3": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 1.0, "step": 0.1}),
                "F4": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 1.0, "step": 0.1}),
                "F5": ("FLOAT", {"default": 0.0, "min": 0.0, "max": 1.0, "step": 0.1}),
            },
        }

    RETURN_TYPES = ("FLOAT", "FLOAT", "FLOAT", "FLOAT", "FLOAT")
    RETURN_NAMES = ("F1", "F2", "F3", "F4", "F5")

    FUNCTION = "main"
    CATEGORY = "utils/slider"

    def main(self, F1, F2, F3, F4, F5):
        return (
            F1,
            F2,
            F3,
            F4,
            F5,
        )


class mxFloat4:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "F1": (
                    "FLOAT",
                    {"default": 0.00, "min": 0.00, "max": 1.00, "step": 0.01},
                ),
                "F2": (
                    "FLOAT",
                    {"default": 0.00, "min": 0.00, "max": 1.00, "step": 0.01},
                ),
                "F3": (
                    "FLOAT",
                    {"default": 0.00, "min": 0.00, "max": 1.00, "step": 0.01},
                ),
                "F4": (
                    "FLOAT",
                    {"default": 0.00, "min": 0.00, "max": 1.00, "step": 0.01},
                ),
            },
        }

    RETURN_TYPES = ("FLOAT", "FLOAT", "FLOAT", "FLOAT")
    RETURN_NAMES = ("F1", "F2", "F3", "F4")

    FUNCTION = "main"
    CATEGORY = "utils/slider"

    def main(self, F1, F2, F3, F4):
        return (
            F1,
            F2,
            F3,
            F4,
        )


class RGBA_to_RGB_Lossless:
    """
    Eine spezialisierte ComfyUI Custom Node zur verlustfreien Konvertierung
    von RGBA-Bilddaten (4 Kanäle) in das RGB-Format (3 Kanäle).
    Diese Node entfernt den Alpha-Kanal durch Tensor-Slicing, ohne die
    Farbwerte neu zu berechnen oder zu komprimieren.
    """

    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        """
        Definiert die Schnittstelle zum ComfyUI Frontend.
        Erwartet wird ein Bild-Tensor.
        """
        return {
            "required": {
                # 'image' ist der interne Variablenname und das Label im GUI
                # ("IMAGE",) definiert den Datentyp und erzwingt Typensicherheit
                "image": ("IMAGE",),
            },
        }

    # Definition der Rückgabewerte
    # WICHTIG: Das Komma ist essenziell, um ein Python-Tupel zu erzeugen!
    RETURN_TYPES = ("IMAGE",)

    # Benutzerfreundliche Namen für die Ausgänge im GUI
    RETURN_NAMES = ("rgb_image",)

    # Verweis auf die Methode, die die Logik ausführt
    FUNCTION = "convert_rgba_to_rgb"

    # Gruppierung im Kontextmenü des Node-Graphen
    CATEGORY = "Bildverarbeitung/Konvertierung"

    def convert_rgba_to_rgb(self, image):
        """
        Führt die Konvertierung auf Tensor-Ebene durch.

        Args:
            image (torch.Tensor): Ein Tensor der Form.
                                  B=Batch, H=Höhe, W=Breite, C=Kanäle.

        Returns:
            tuple: Ein Tupel enthaltend den modifizierten Tensor.
        """

        # 1. Analyse der Tensor-Dimensionen
        # image.shape gibt ein torch.Size Objekt zurück, z.B.
        batch_size, height, width, channels = image.shape

        # 2. Bedingte Logik basierend auf der Kanal-Tiefe
        if channels == 4:
            # HAUPTFALL: RGBA Input
            # Wir nutzen Python Slicing (View-Operation).
            # ... (Ellipsis) steht für "alle vorherigen Dimensionen" (hier B, H, W).
            # :3 bedeutet "nimm die Indizes 0, 1, 2" (also R, G, B).
            # Der Alpha-Kanal (Index 3) wird ignoriert.
            rgb_image = image[..., :3]

            # Dies ist eine "Zero-Copy" Operation in PyTorch (View),
            # daher extrem speichereffizient und schnell.
            return (rgb_image,)

        elif channels == 3:
            # FALLBACK: Input ist bereits RGB
            # Wir geben das Bild unverändert weiter, um Fehler zu vermeiden.
            return (image,)

        elif channels == 1:
            # SONDERFALL: Graustufen (Grayscale)
            # Manche Masken kommen als 1-Kanal Bilder.
            # .repeat(1, 1, 1, 3) repliziert den Kanal 3x, um RGB zu simulieren.
            # Dimensionen: Batch(1) * Height(1) * Width(1) * Channels(3)
            rgb_image = image.repeat(1, 1, 1, 3)
            return (rgb_image,)

        else:
            # FEHLERFALL: Unbekannte Kanalanzahl (z.B. 2 oder >4)
            # Wir geben das Original zurück, könnten hier aber auch einen Error raisen.
            print(
                f"Warnung: RGBA_to_RGB_Lossless erhielt Bild mit {channels} Kanälen. Keine Konvertierung möglich."
            )
            return (image,)


class mxCFGGuider:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "cfg": (
                    "FLOAT",
                    {"default": 7.0, "min": 0.0, "max": 100.0, "step": 0.1},
                ),
            },
        }

    RETURN_TYPES = ("FLOAT",)
    RETURN_NAMES = ("FLOAT",)

    FUNCTION = "main"
    CATEGORY = "utils/slider"

    def main(self, cfg):
        return (cfg,)


class mxModelSamplingFloat:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "value": (
                    "FLOAT",
                    {"default": 1.00, "min": 0.00, "max": 15.00, "step": 0.01},
                ),
            },
        }

    RETURN_TYPES = ("FLOAT",)
    RETURN_NAMES = ("value",)

    FUNCTION = "main"
    CATEGORY = "utils/slider"

    def main(self, value):
        return (value,)


class mxInt3:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "I1": ("INT", {"default": 0, "min": 0, "max": 4294967296, "step": 1}),
                "I2": ("INT", {"default": 0, "min": 0, "max": 4294967296, "step": 1}),
                "I3": ("INT", {"default": 0, "min": 0, "max": 4294967296, "step": 1}),
            },
        }

    RETURN_TYPES = ("INT", "INT", "INT")
    RETURN_NAMES = ("I1", "I2", "I3")

    FUNCTION = "main"
    CATEGORY = "utils/multiInteger"

    def main(self, I1, I2, I3):
        return (
            I1,
            I2,
            I3,
        )


class mxString3:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "S1": ("STRING", {"default": ""}),
                "S2": ("STRING", {"default": ""}),
                "S3": ("STRING", {"default": ""}),
            },
        }

    RETURN_TYPES = ("STRING", "STRING", "STRING")
    RETURN_NAMES = ("S1", "S2", "S3")

    FUNCTION = "main"
    CATEGORY = "utils/multiString"

    def main(self, S1, S2, S3):
        return (
            S1,
            S2,
            S3,
        )


class mxInputSwitch:
    """
    A node that switches between two Any-type inputs using visual boolean toggles.
    Only one input can be active (True) at a time.
    The active input is routed to the output.
    """

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "select_A": ("INT", {"default": 1, "min": 0, "max": 1}),
                "select_B": ("INT", {"default": 0, "min": 0, "max": 1}),
            },
            "optional": {
                "input_A": (any,),
                "input_B": (any,),
            },
        }

    RETURN_TYPES = (any,)
    RETURN_NAMES = ("output",)

    FUNCTION = "main"
    CATEGORY = "utils/switch"

    def main(self, select_A, select_B, input_A=None, input_B=None):
        """
        Routes the selected input to the output.
        If select_A is True (1), return input_A.
        Otherwise, return input_B.
        """
        if select_A > 0:
            return (input_A,)
        else:
            return (input_B,)


class mxInputSwitch3:
    """
    A node that switches between three Any-type inputs using visual boolean toggles.
    Only one input can be active (True) at a time.
    The active input is routed to the output.
    """

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "select_A": ("INT", {"default": 1, "min": 0, "max": 1}),
                "select_B": ("INT", {"default": 0, "min": 0, "max": 1}),
                "select_C": ("INT", {"default": 0, "min": 0, "max": 1}),
            },
            "optional": {
                "input_A": (any,),
                "input_B": (any,),
                "input_C": (any,),
            },
        }

    RETURN_TYPES = (any,)
    RETURN_NAMES = ("output",)

    FUNCTION = "main"
    CATEGORY = "utils/switch"

    def main(
        self, select_A, select_B, select_C, input_A=None, input_B=None, input_C=None
    ):
        """
        Routes the selected input to the output.
        """
        if select_A > 0:
            return (input_A,)
        elif select_B > 0:
            return (input_B,)
        else:
            return (input_C,)


NODE_CLASS_MAPPINGS = {
    "mxSlider": mxSlider,
    "mxSlider2D": mxSlider2D,
    "mxFloat5": mxFloat5,
    "mxFloat4": mxFloat4,
    "RGBA_to_RGB_Lossless": RGBA_to_RGB_Lossless,
    "mxCFGGuider": mxCFGGuider,
    "mxModelSamplingFloat": mxModelSamplingFloat,
    "mxInt3": mxInt3,
    "mxString3": mxString3,
    "mxInputSwitch": mxInputSwitch,
    "mxInputSwitch3": mxInputSwitch3,
    "SaveImageWithSidecarTxt_V2": SaveImageWithSidecarTxt_V2,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "mxSlider": "Slider",
    "mxSlider2D": "Slider 2D",
    "mxFloat5": "Float 5",
    "mxFloat4": "Float 4",
    "RGBA_to_RGB_Lossless": "RGBA zu RGB (Verlustfrei)",
    "mxCFGGuider": "CFG Guider",
    "mxModelSamplingFloat": "Model Sampling Float",
    "mxInt3": "Int 3",
    "mxString3": "String 3",
    "mxInputSwitch": "Input Switch",
    "mxInputSwitch3": "Input Switch 3",
    "SaveImageWithSidecarTxt_V2": "Bild mit Sidecar TXT speichern V2",
}
