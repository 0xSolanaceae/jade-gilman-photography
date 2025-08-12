import os
import json
import difflib

def _ensure_jpg_extension(name: str) -> str:
    base, ext = os.path.splitext(name.strip())
    if not base:
        return ''
    if ext.lower() not in ('.jpg', '.jpeg'):
        return f"{base}.jpg"
    return f"{base}{ext}"

def _find_case_insensitive_file(folder_path: str, name: str):
    target = name.lower()
    for f in os.listdir(folder_path):
        if f.lower() == target:
            return f
    return None

def _jpg_files(folder_path: str):
    return [f for f in os.listdir(folder_path) if os.path.isfile(os.path.join(folder_path, f)) and f.lower().endswith(('.jpg', '.jpeg'))]

def _suggest_similar_file(folder_path: str, target_stem: str):
    files = _jpg_files(folder_path)
    if not files:
        print("No .jpg files found in this directory.")
        return None
    items = [(os.path.splitext(f)[0], f) for f in files]
    lower_to_file = {}
    for stem, fname in items:
        lower_to_file.setdefault(stem.lower(), fname)

    target = target_stem.lower()
    matches = difflib.get_close_matches(target, list(lower_to_file.keys()), n=5, cutoff=0.4)

    # Fallback to substring search if difflib returns nothing
    if not matches and target:
        matches = [stem.lower() for stem, _ in items if target in stem.lower()][:5]

    if not matches:
        print("No similar filenames found.")
        return None

    options = [lower_to_file[m] for m in matches]
    print("Choose a similar file:")
    for i, opt in enumerate(options, 1):
        print(f"{i}. {opt}")
    while True:
        sel = input(f"Enter a number 1-{len(options)} (or 0 to re-enter): ").strip()
        if sel == '0' or sel == '':
            return None
        if sel.isdigit():
            idx = int(sel)
            if 1 <= idx <= len(options):
                return options[idx - 1]
        print("Invalid selection. Try again.")

def _choose_cover_photo_interactively(folder_path: str, default_cover: str, gallery_label: str):
    while True:
        entered = input(f"Enter the cover photo filename for {gallery_label} (assumes .jpg, leave blank to keep default '{default_cover}'): ").strip()
        if not entered:
            return default_cover
        candidate = _ensure_jpg_extension(entered)
        found = _find_case_insensitive_file(folder_path, candidate)
        if found:
            return found
        print(f"'{candidate}' not found.")
        stem = os.path.splitext(entered)[0]
        choice = _suggest_similar_file(folder_path, stem)
        if choice:
            return choice
        print("No selection made. Please try again or leave blank to keep default.")

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
                    if folder in existing_galleries:
                        cover_photo = existing_galleries[folder].get('coverPhoto', images[0] if images else '')
                    else:
                        cover_photo = images[0] if images else ''
                        manual_entry = input(f"Do you want to manually enter the cover photo for {folder}? (yes/no): ").strip().lower()
                        if manual_entry == 'yes':
                            cover_photo = _choose_cover_photo_interactively(folder_path, cover_photo, folder)
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