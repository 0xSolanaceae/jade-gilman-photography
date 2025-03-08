import os
import json

# generates galleries.json file for each subdirectory to add galleries
def generate_galleries_json(directory):
    galleries = []
    existing_galleries = {}

    # Load existing galleries.json if it exists
    galleries_json_path = os.path.join(directory, 'galleries.json')
    if os.path.exists(galleries_json_path):
        with open(galleries_json_path, 'r') as existing_file:
            existing_data = json.load(existing_file)
            existing_galleries = {gallery['name']: gallery for gallery in existing_data.get('galleries', [])}

    for root, dirs, files in os.walk(directory):
        for folder in dirs:
            folder_path = os.path.join(root, folder)
            manifest_path = os.path.join(folder_path, 'manifest.json')
            if os.path.exists(manifest_path):
                with open(manifest_path, 'r') as manifest_file:
                    images = json.load(manifest_file)
                    cover_photo = existing_galleries.get(folder, {}).get('coverPhoto', images[0] if images else '')
                    title = existing_galleries.get(folder, {}).get('title', folder.replace('-', ' ').title())
                    galleries.append({
                        "name": os.path.relpath(folder_path, directory).replace(os.sep, '-'),
                        "title": title,
                        "coverPhoto": cover_photo,
                        "description": f"{folder.replace('-', ' ')} collection"
                    })
    galleries_json = {
        "galleries": galleries
    }
    with open(galleries_json_path, 'w') as json_file:
        json.dump(galleries_json, json_file, indent=4)
    print(f"Generated {galleries_json_path}")

if __name__ == "__main__":
    images_directory = os.path.join('public', 'images')
    generate_galleries_json(images_directory)