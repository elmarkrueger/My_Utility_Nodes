# ComfyUI - Slider and Parameter Nodes - Elmar Krüger - 2025

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


class mxFluxMaxShift:
    """
    Calculates the max_shift value for the ModelSamplingFlux node.
    Replaces the Chroma Radiance subgraph with a single node.
    Formula: max_shift = (width * height * multiplier) / divisor
    """

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "width": ("INT", {"default": 1024, "min": 1, "max": 16384, "step": 1, "forceInput": True, "tooltip": "Image width in pixels"}),
                "height": ("INT", {"default": 1024, "min": 1, "max": 16384, "step": 1, "forceInput": True, "tooltip": "Image height in pixels"}),
                "multiplier": ("FLOAT", {"default": 1.00, "min": 0.01, "max": 5.00, "step": 0.01, "tooltip": "Scaling multiplier applied to the pixel count"}),
                "divisor": ("INT", {"default": 1000000, "min": 1, "max": 100000000, "step": 1, "tooltip": "Divisor for the final value (default: 1M pixels)"}),
            },
        }

    RETURN_TYPES = ("FLOAT",)
    RETURN_NAMES = ("max_shift",)

    FUNCTION = "calculate"
    CATEGORY = "utils/sampling"

    def calculate(self, width, height, multiplier, divisor):
        max_shift = (width * height * multiplier) / divisor
        return (max_shift,)


NODE_CLASS_MAPPINGS = {
    "mxSlider": mxSlider,
    "mxSlider2D": mxSlider2D,
    "mxCFGGuider": mxCFGGuider,
    "mxModelSamplingFloat": mxModelSamplingFloat,
    "mxFluxMaxShift": mxFluxMaxShift,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "mxSlider": "Slider",
    "mxSlider2D": "Slider 2D",
    "mxCFGGuider": "CFG Guider",
    "mxModelSamplingFloat": "Model Sampling Float",
    "mxFluxMaxShift": "Flux Max Shift",
}
