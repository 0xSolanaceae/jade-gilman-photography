import os
import json

def generate_galleries_json(directory):
    galleries = []
    for folder in os.listdir(directory):
        folder_path = os.path.join(directory, folder)
        if os.path.isdir(folder_path):
            manifest_path = os.path.join(folder_path, 'manifest.json')
            if os.path.exists(manifest_path):
                with open(manifest_path, 'r') as manifest_file:
                    images = json.load(manifest_file)
                    cover_photo = images[0] if images else ''
                    galleries.append({
                        "name": folder,
                        "title": folder.replace('-', ' ').title(),
                        "coverPhoto": cover_photo,
                        "description": f"{folder.replace('-', ' ')} collection"
                    })
    galleries_json = {
        "galleries": galleries
    }
    with open(os.path.join(directory, 'galleries.json'), 'w') as json_file:
        json.dump(galleries_json, json_file, indent=4)
    print(f"Generated {os.path.join(directory, 'galleries.json')}")

if __name__ == "__main__":
    images_directory = os.path.join('public', 'images')
    generate_galleries_json(images_directory)