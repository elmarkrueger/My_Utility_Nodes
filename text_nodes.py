# ComfyUI - Text Processing Nodes - Elmar Krüger - 2025


class LLMPromptSplitter:
    """Splits structured LLM output into separate positive and negative prompts.

    Expects the input text to contain two paragraphs separated by a blank line:
    the first paragraph is the positive prompt, the second is the negative prompt.
    """

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "llm_output": ("STRING", {"forceInput": True}),
            },
        }

    RETURN_TYPES = ("STRING", "STRING")
    RETURN_NAMES = ("positive", "negative")

    FUNCTION = "main"
    CATEGORY = "utils/text"

    def main(self, llm_output):
        text = llm_output.strip()

        # Split on the first blank line (double newline)
        parts = text.split("\n\n", 1)

        positive = parts[0].strip() if len(parts) > 0 else ""
        negative = parts[1].strip() if len(parts) > 1 else ""

        return (positive, negative)


NODE_CLASS_MAPPINGS = {
    "LLMPromptSplitter": LLMPromptSplitter,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "LLMPromptSplitter": "LLM Prompt Splitter",
}
