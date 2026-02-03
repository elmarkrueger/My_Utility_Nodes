# ComfyUI - Switch and Logic Nodes - Elmar Krüger - 2025
import torch
from comfy_execution.graph import ExecutionBlocker


class AnyType(str):
    def __ne__(self, __value: object) -> bool:
        return False


any = AnyType("*")


class SpecialAnyType(str):
    """
    Eine spezielle Klasse, die bei jedem Vergleich 'True' zurückgibt.
    Dies überlistet das Validierungssystem von ComfyUI und ermöglicht
    Verbindungen zwischen eigentlich inkompatiblen Typen.
    """

    def __ne__(self, __value: object) -> bool:
        return False

    def __eq__(self, __value: object) -> bool:
        return True


# Instanziierung des Wildcards für die Verwendung in INPUT_TYPES
ANY = SpecialAnyType("*")


class SCCAnyType(str):
    def __ne__(self, __value: object) -> bool: return False
    def __eq__(self, __value: object) -> bool: return True


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


class mxSizeSwitch:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "width_A": ("INT", {"default": 512, "min": 0, "max": 4294967296, "step": 8}),
                "height_A": ("INT", {"default": 512, "min": 0, "max": 4294967296, "step": 8}),
                "label_A": ("STRING", {"default": "Resolution A", "multiline": False}),
                "width_B": ("INT", {"default": 1024, "min": 0, "max": 4294967296, "step": 8}),
                "height_B": ("INT", {"default": 1024, "min": 0, "max": 4294967296, "step": 8}),
                "label_B": ("STRING", {"default": "Resolution B", "multiline": False}),
                "select": ("INT", {"default": 0, "min": 0, "max": 1}),
            },
        }

    RETURN_TYPES = ("INT", "INT")
    RETURN_NAMES = ("width", "height")

    FUNCTION = "main"
    CATEGORY = "utils/switch"

    def main(self, width_A, height_A, label_A, width_B, height_B, label_B, select):
        if select == 0:
            return (width_A, height_A)
        else:
            return (width_B, height_B)


class BatchLogicSwitch:
    """
    Eine Logik-Weiche, die einen Batch von Generationen in gleich große Gruppen aufteilt
    und jeder Gruppe unterschiedliche Parameter (A, B, C) zuweist.

    Ersetzt den komplexen Subgraphen aus IntDiv, IntMul und IfElif Nodes.
    """

    def __init__(self):
        pass

    @classmethod
    def INPUT_TYPES(s):
        """
        Definiert die Eingabeparameter der Node.
        'required': Zwingend notwendige Inputs/Widgets.
        'optional': Optionale Inputs, die auch 'None' sein können.
        """
        return {
            "required": {
                # Der steuernde Signalgeber (z.B. aktueller Seed oder Batch-Index)
                # Wir definieren min/max Grenzen, um Überläufe zu verhindern.
                "batch_index": (
                    "INT",
                    {"default": 0, "min": 0, "max": 0xFFFFFFFFFFFFFFFF},
                ),
                # Konfiguration der Aufteilung
                "total_batch_size": ("INT", {"default": 12, "min": 1}),
                "num_groups": ("INT", {"default": 3, "min": 1}),
            },
            "optional": {
                # Universelle Inputs - können Modelle, Prompts, Latents etc. sein.
                # Durch die Verwendung von 'ANY' akzeptiert das UI jede Verbindung.
                "input_A": (ANY,),
                "input_B": (ANY,),
                "input_C": (ANY,),
                # Optionale Erweiterung für Robustheit (falls num_groups > 3 gewählt wird)
                "fallback_input": (ANY,),
            },
        }

    # Der Output ist ebenfalls vom Typ "Any", nimmt also die Form des durchgeschleusten Objekts an.
    RETURN_TYPES = (ANY,)
    RETURN_NAMES = ("selected_context",)

    FUNCTION = "switch_logic"

    # Kategorie im Rechtsklick-Menü
    CATEGORY = "MyUtilityNodes/Logic"

    def switch_logic(
        self,
        batch_index,
        total_batch_size,
        num_groups,
        input_A=None,
        input_B=None,
        input_C=None,
        fallback_input=None,
    ):
        """
        Führt die Schaltlogik aus.
        """

        # 1. Sicherheitsprüfung: Division durch Null verhindern
        if num_groups <= 0:
            num_groups = 1

        # 2. Berechnung der Gruppengröße
        # Beispiel: 12 gesamt / 3 Gruppen = 4 Bilder pro Gruppe.
        # Wir nutzen Ganzzahldivision (//).
        group_size = total_batch_size // num_groups

        # Sicherheit: Falls die Gruppengröße 0 wäre (z.B. Batch 2, Gruppen 5), setzen wir sie auf 1.
        if group_size < 1:
            group_size = 1

        # 3. Bestimmung der aktuellen Gruppe
        # Index 0,1,2,3 // 4 = 0 (Gruppe A)
        # Index 4,5,6,7 // 4 = 1 (Gruppe B)
        # Index 8,9,10,11 // 4 = 2 (Gruppe C)
        current_group_idx = batch_index // group_size

        # 4. Routing des Inputs basierend auf dem Gruppenindex
        # Standardwert ist der Fallback oder None, falls nichts passt.
        selected_value = fallback_input

        if current_group_idx == 0:
            selected_value = input_A
        elif current_group_idx == 1:
            selected_value = input_B
        elif current_group_idx == 2:
            selected_value = input_C
        else:
            # Behandlung von Indizes außerhalb des erwarteten Bereichs (z.B. Index 12+)
            # Logik: Wenn kein expliziter Fallback definiert ist, nutzen wir den letzten
            # definierten Input (C), um Abstürze zu vermeiden ("Clamping").
            if fallback_input is None:
                selected_value = input_C
            else:
                selected_value = fallback_input

        # Debugging-Ausgabe in der Konsole (hilfreich bei der Ersteinrichtung)
        # print(f"BatchSwitch Debug: Index {batch_index} -> Gruppe {current_group_idx} -> Wähle Input")

        # Rückgabe muss immer ein Tupel sein, auch bei einem einzelnen Wert!
        return (selected_value,)


class SwitchCommandCenter:
    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "active_1": ("BOOLEAN", {"default": True, "label_on": "ON", "label_off": "OFF"}),
                "active_2": ("BOOLEAN", {"default": True, "label_on": "ON", "label_off": "OFF"}),
                "active_3": ("BOOLEAN", {"default": True, "label_on": "ON", "label_off": "OFF"}),
                "active_4": ("BOOLEAN", {"default": True, "label_on": "ON", "label_off": "OFF"}),
                "active_5": ("BOOLEAN", {"default": True, "label_on": "ON", "label_off": "OFF"}),
            },
            "optional": {
                "input_1": (SCCAnyType("*"),),
                "input_2": (SCCAnyType("*"),),
                "input_3": (SCCAnyType("*"),),
                "input_4": (SCCAnyType("*"),),
                "input_5": (SCCAnyType("*"),),
            }
        }

    RETURN_TYPES = (SCCAnyType("*"), SCCAnyType("*"), SCCAnyType("*"), SCCAnyType("*"), SCCAnyType("*"))
    RETURN_NAMES = ("out_1", "out_2", "out_3", "out_4", "out_5")
    FUNCTION = "switch"
    CATEGORY = "utils/flow_control"

    def switch(self, active_1, active_2, active_3, active_4, active_5,
               input_1=None, input_2=None, input_3=None, input_4=None, input_5=None):
        blocker = ExecutionBlocker(None)
        
        out_1 = input_1 if active_1 else blocker
        out_2 = input_2 if active_2 else blocker
        out_3 = input_3 if active_3 else blocker
        out_4 = input_4 if active_4 else blocker
        out_5 = input_5 if active_5 else blocker
        
        return (out_1, out_2, out_3, out_4, out_5)

    @classmethod
    def IS_CHANGED(s, **kwargs):
        # Force re-evaluation if any switch is toggled
        return float("NaN")


NODE_CLASS_MAPPINGS = {
    "mxInputSwitch": mxInputSwitch,
    "mxInputSwitch3": mxInputSwitch3,
    "mxSizeSwitch": mxSizeSwitch,
    "BatchLogicSwitch": BatchLogicSwitch,
    "SwitchCommandCenter": SwitchCommandCenter,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "mxInputSwitch": "Input Switch",
    "mxInputSwitch3": "Input Switch 3",
    "mxSizeSwitch": "Size Switch",
    "BatchLogicSwitch": "Batch Logic Switch",
    "SwitchCommandCenter": "Switch Command Center",
}
