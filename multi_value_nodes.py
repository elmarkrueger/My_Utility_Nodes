# ComfyUI - Multi-Value Input Nodes - Elmar Krüger - 2025


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


NODE_CLASS_MAPPINGS = {
    "mxFloat5": mxFloat5,
    "mxFloat4": mxFloat4,
    "mxInt3": mxInt3,
    "mxString3": mxString3,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "mxFloat5": "Float 5",
    "mxFloat4": "Float 4",
    "mxInt3": "Int 3",
    "mxString3": "String 3",
}
