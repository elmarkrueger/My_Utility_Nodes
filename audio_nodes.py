import os

import folder_paths
import numpy as np
import torch
from pydub import AudioSegment


class SaveAudioAsMP3_Custom:
    def __init__(self):
        self.output_dir = folder_paths.get_output_directory()

    @classmethod
    def INPUT_TYPES(s):
        return {
            "required": {
                "audio": ("AUDIO",),
                "filename": ("STRING", {"default": "audio_output"}),
                "path": ("STRING", {"default": ""}),
                "quality": (["320k", "256k", "192k", "128k", "64k"], {"default": "192k"})
            }
        }

    RETURN_TYPES = ()
    FUNCTION = "save_audio"
    OUTPUT_NODE = True
    CATEGORY = "Audio/Custom"

    def save_audio(self, audio, filename, path, quality):
        # 1. Path Resolution
        if path.strip() == "":
            dest_dir = self.output_dir
        else:
            dest_dir = path
            
        if not os.path.exists(dest_dir):
            try:
                os.makedirs(dest_dir, exist_ok=True)
            except Exception as e:
                print(f" Error creating dir: {e}")
                return {}

        # 2. Data Extraction
        waveform = audio["waveform"]
        sample_rate = audio["sample_rate"]
        
        # 3. Batch Processing Loop
        # Waveform shape is (batch, channels, samples)
        batch_size = waveform.shape[0]
        
        for i in range(batch_size):
            # Extract single slice:
            audio_tensor = waveform[i]
            
            # Convert to CPU Numpy
            audio_np = audio_tensor.cpu().numpy()
            
            # 4. Format Conversion (Planar to Interleaved)
            channels = audio_np.shape[0]
            if channels == 2:
                # Interleave stereo
                audio_np = audio_np.T.flatten()
            else:
                audio_np = audio_np.flatten()
                
            # 5. Quantization (Float32 -> Int16)
            # Clip to prevent distortion
            audio_np = np.clip(audio_np, -1.0, 1.0)
            # Scale to 16-bit integer range
            audio_int16 = (audio_np * 32767).astype(np.int16)
            
            # 6. Pydub Object Creation
            segment = AudioSegment(
                audio_int16.tobytes(),
                frame_rate=sample_rate,
                sample_width=2,
                channels=channels
            )
            
            # 7. Filename Generation
            # Append batch index if batch > 1
            current_filename = filename
            if batch_size > 1:
                current_filename = f"{filename}_{i+1:03d}"
                
            # Overwrite protection
            full_path = os.path.join(dest_dir, f"{current_filename}.mp3")
            counter = 1
            base_name = current_filename
            while os.path.exists(full_path):
                full_path = os.path.join(dest_dir, f"{base_name}_{counter}.mp3")
                counter += 1
                
            # 8. Export
            print(f" Saving to: {full_path} at {quality}")
            segment.export(full_path, format="mp3", bitrate=quality)
            
        return {}


NODE_CLASS_MAPPINGS = {
    "SaveAudioAsMP3_Custom": SaveAudioAsMP3_Custom
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "SaveAudioAsMP3_Custom": "Save Audio as MP3 (Custom)"
}
