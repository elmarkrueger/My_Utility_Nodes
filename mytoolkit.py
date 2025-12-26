# ComfyUI - mytoolkit - Elmar Krüger - 2025
import nodes
import torch


class AnyType(str):
    def __ne__(self, __value: object) -> bool:
        return False

any = AnyType("*")

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
    CATEGORY = 'utils/slider'

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
                "Xf": ("FLOAT", {"default": 512, "min": -4294967296, "max": 4294967296}),
                "Yi": ("INT", {"default": 512, "min": -4294967296, "max": 4294967296}),
                "Yf": ("FLOAT", {"default": 512, "min": -4294967296, "max": 4294967296}),
                "isfloatX": ("INT", {"default": 0, "min": 0, "max": 1}),
                "isfloatY": ("INT", {"default": 0, "min": 0, "max": 1}),
            },
        }

    RETURN_TYPES = (any, any,)
    RETURN_NAMES = ("X","Y",)

    FUNCTION = "main"
    CATEGORY = 'utils/slider'

    def main(self, Xi, Xf, isfloatX, Yi, Yf, isfloatY):
        if isfloatX > 0:
            outX = Xf
        else:
            outX = Xi
        if isfloatY > 0:
            outY = Yf
        else:
            outY = Yi
        return (outX, outY,)


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
    CATEGORY = 'utils/slider'

    def main(self, F1, F2, F3, F4, F5):
        return (F1, F2, F3, F4, F5,)

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
            #... (Ellipsis) steht für "alle vorherigen Dimensionen" (hier B, H, W).
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
            #.repeat(1, 1, 1, 3) repliziert den Kanal 3x, um RGB zu simulieren.
            # Dimensionen: Batch(1) * Height(1) * Width(1) * Channels(3)
            rgb_image = image.repeat(1, 1, 1, 3)
            return (rgb_image,)

        else:
            # FEHLERFALL: Unbekannte Kanalanzahl (z.B. 2 oder >4)
            # Wir geben das Original zurück, könnten hier aber auch einen Error raisen.
            print(f"Warnung: RGBA_to_RGB_Lossless erhielt Bild mit {channels} Kanälen. Keine Konvertierung möglich.")
            return (image,)

class mxCFGGuider:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "cfg": ("FLOAT", {"default": 7.0, "min": 0.0, "max": 100.0, "step": 0.1}),
            },
        }

    RETURN_TYPES = ("FLOAT",)
    RETURN_NAMES = ("FLOAT",)

    FUNCTION = "main"
    CATEGORY = 'utils/slider'

    def main(self, cfg):
        return (cfg,)

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
    CATEGORY = 'utils/multiInteger'

    def main(self, I1, I2, I3):
        return (I1, I2, I3,)

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
    CATEGORY = 'utils/multiString'

    def main(self, S1, S2, S3):
        return (S1, S2, S3,)

NODE_CLASS_MAPPINGS = {
    "mxSlider": mxSlider,
    "mxSlider2D": mxSlider2D,
    "mxFloat5": mxFloat5,
    "RGBA_to_RGB_Lossless": RGBA_to_RGB_Lossless,
    "mxCFGGuider": mxCFGGuider,
    "mxInt3": mxInt3,
    "mxString3": mxString3
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "mxSlider": "Slider",
    "mxSlider2D": "Slider 2D",
    "mxFloat5": "Float 5",
    "RGBA_to_RGB_Lossless": "RGBA zu RGB (Verlustfrei)",
    "mxCFGGuider": "CFG Guider",
    "mxInt3": "Int 3",
    "mxString3": "String 3"
}
