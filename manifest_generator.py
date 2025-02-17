import os
import json

def generate_manifest(directory):
    for root, dirs, files in os.walk(directory):
        for subdir in dirs:
            subdir_path = os.path.join(root, subdir)
            images = [f for f in os.listdir(subdir_path) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif'))]
            manifest_path = os.path.join(subdir_path, 'manifest.json')
            with open(manifest_path, 'w') as manifest_file:
                json.dump(images, manifest_file, indent=4)
            print(f"Generated {manifest_path}")

if __name__ == "__main__":
    images_directory = os.path.join('public', 'images')
    generate_manifest(images_directory)