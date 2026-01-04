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


class SaveImageWithSidecarTxt:
    """
    Eine Custom Node für ComfyUI, die Bilder speichert und simultan eine 
    detaillierte Textdatei mit identischem Dateinamen erzeugt.
    Features: 
    - Benutzerdefinierter Ausgabepfad
    - Formatwahl (PNG, JPG, JPEG, WEBP)
    - Automatische Formatierung von Sampler-Listen (Semikolon -> Zeilenumbruch)
    """
    
    def __init__(self):
        self.output_dir = folder_paths.get_output_directory()
        self.type = "output"
        self.prefix_append = ""
        self.compress_level = 4

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "images": ("IMAGE", ),
                "filename_prefix": ("STRING", {"default": "ComfyUI"}),
                # Neues Dropdown für Dateiformate
                "file_format": (["PNG", "JPG", "JPEG", "WEBP"], {"default": "PNG"}),
            },
            "optional": {
                "output_path": ("STRING", {"default": "", "multiline": False, "placeholder": "C:\\Mein\\Pfad (optional)"}),
                
                # ForceInput erzwingt, dass diese Werte von anderen Nodes kommen
                "positive_prompt": ("STRING", {"forceInput": True, "multiline": True, "default": ""}),
                "negative_prompt": ("STRING", {"forceInput": True, "multiline": True, "default": ""}),
                "model_name": ("STRING", {"forceInput": True, "default": "Unknown Model"}),
                "clip_name": ("STRING", {"forceInput": True, "default": "Unknown CLIP"}),
                "vae_name": ("STRING", {"forceInput": True, "default": "Unknown VAE"}),
                "sampler_details": ("STRING", {"forceInput": True, "multiline": True, "default": ""}),
            },
            "hidden": {"prompt": "PROMPT", "extra_pnginfo": "EXTRA_PNGINFO"},
        }

    RETURN_TYPES = ()
    FUNCTION = "save_images_and_text"
    OUTPUT_NODE = True
    CATEGORY = "Custom_Research/IO"

    def save_images_and_text(self, images, filename_prefix="ComfyUI", file_format="PNG", output_path="",
                             positive_prompt="", negative_prompt="", 
                             model_name="Unknown Model", clip_name="Unknown CLIP", 
                             vae_name="Unknown VAE", sampler_details="", 
                             prompt=None, extra_pnginfo=None):
        
        # 1. Bestimmen des Basis-Ausgabeverzeichnisses
        if output_path and output_path.strip():
            base_output_dir = output_path.strip()
            try:
                if not os.path.exists(base_output_dir):
                    os.makedirs(base_output_dir, exist_ok=True)
            except Exception as e:
                print(f"Fehler beim Erstellen des Ordners '{base_output_dir}': {e}")
                base_output_dir = self.output_dir
        else:
            base_output_dir = self.output_dir

        # 2. Zugriff auf die zentrale Pfad-Logik von ComfyUI
        full_output_folder, filename, counter, subfolder, filename_prefix = \
            folder_paths.get_save_image_path(filename_prefix, base_output_dir, images.shape[2], images.shape[1])
        
        results = list()
        
        # Dateiendung normalisieren
        extension = file_format.lower()
        if extension == "jpeg": 
            extension = "jpg" 

        # 3. Sampler Details formatieren (Neu: Semikolon zu Zeilenumbruch)
        # Teilt den String am Semikolon, entfernt Leerzeichen und fügt ihn mit Zeilenumbrüchen wieder zusammen
        formatted_sampler_details = ""
        if sampler_details:
            # Split am Semikolon, strip whitespace, filter leere Strings
            parts = [s.strip() for s in sampler_details.split(";") if s.strip()]
            formatted_sampler_details = "\n".join(parts)

        for image in images:
            # 4. Bildverarbeitung (Tensor -> PIL Image)
            i = 255. * image.cpu().numpy()
            img = Image.fromarray(np.clip(i, 0, 255).astype(np.uint8))
            
            # Format-spezifische Anpassungen (Transparenz entfernen für JPG)
            if file_format in ["JPG", "JPEG"]:
                if img.mode == 'RGBA':
                    img = img.convert('RGB')
            
            # 5. Metadaten für das Bild selbst (nur relevant für PNG/WEBP)
            metadata = None
            if file_format == "PNG": 
                metadata = PngInfo()
                if prompt is not None:
                    metadata.add_text("prompt", json.dumps(prompt))
                if extra_pnginfo is not None:
                    for x in extra_pnginfo:
                        metadata.add_text(x, json.dumps(extra_pnginfo[x]))

            # 6. Dateinamen generieren (Atomare Benennung)
            file_base = f"{filename}_{counter:05}_"
            file_img = f"{file_base}.{extension}"
            file_txt = f"{file_base}.txt"
            
            image_path = os.path.join(full_output_folder, file_img)
            txt_path = os.path.join(full_output_folder, file_txt)
            
            # 7. Bild speichern
            if file_format == "PNG":
                img.save(image_path, pnginfo=metadata, compress_level=self.compress_level)
            elif file_format in ["JPG", "JPEG"]:
                img.save(image_path, quality=95) 
            elif file_format == "WEBP":
                img.save(image_path, quality=95, lossless=False)

            # 8. Inhalt der Textdatei formatieren (mit formatiertem Sampler Detail)
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
            
            # 9. Textdatei schreiben
            try:
                with open(txt_path, "w", encoding="utf-8") as f:
                    f.write(txt_content)
            except Exception as e:
                print(f"Error writing sidecar text file: {e}")
                
            results.append({
                "filename": file_img,
                "subfolder": subfolder,
                "type": self.type
            })
            
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
    "SaveImageWithSidecarTxt": SaveImageWithSidecarTxt,
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
    "SaveImageWithSidecarTxt": "Bild mit Sidecar TXT speichern",
}
