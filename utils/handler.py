import os
import sys
import json
from typing import List

# Preflight: check dependencies for resizing step and provide a friendly hint if missing
def _check_dependencies():
    missing = []
    try:
        import PIL  # noqa: F401
    except Exception:
        missing.append("pillow")
    try:
        import tqdm  # noqa: F401
    except Exception:
        missing.append("tqdm")
    if missing:
        print("\nRequired Python packages are missing: " + ", ".join(missing))
        print("Please install them by running: pip install -r requirements.txt")
        input("\nPress Enter to continue anyway (the resize step may fail), or Ctrl+C to exit...")


def _read_int(prompt: str, min_v: int, max_v: int) -> int:
    while True:
        raw = input(prompt).strip()
        if raw.isdigit():
            val = int(raw)
            if min_v <= val <= max_v:
                return val
        print(f"Please enter a number between {min_v} and {max_v}.")


def _list_galleries(base_dir: str) -> List[str]:
    if not os.path.isdir(base_dir):
        return []
    dirs = [d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))]
    dirs.sort()
    return dirs


def _choose_gallery(base_dir: str) -> str:
    dirs = _list_galleries(base_dir)
    if not dirs:
        print("\nNo gallery folders found in 'public/images'.")
        print("Create a folder inside public/images (e.g. public/images/Alice & Bob) and add photos, then re-run.")
        sys.exit(1)

    print("\nSelect the gallery folder you want to prepare:")
    for i, d in enumerate(dirs, start=1):
        print(f"  {i}. {d}")
    idx = _read_int(f"Enter 1-{len(dirs)}: ", 1, len(dirs))
    return dirs[idx - 1]


def _resize_images(gallery_path: str):
    print("\nStep 1/4: Resizing images for faster web performance…")
    from utils.img_resizer import resize_images
    resize_images(gallery_path)
    print("Images resized.")


def _write_manifest(gallery_path: str):
    print("\nStep 2/4: Generating manifest.json for this gallery…")
    exts = ('.png', '.jpg', '.jpeg', '.gif', '.webp')
    images = [f for f in os.listdir(gallery_path) if os.path.isfile(os.path.join(gallery_path, f)) and f.lower().endswith(exts)]
    images.sort()
    manifest_path = os.path.join(gallery_path, 'manifest.json')
    with open(manifest_path, 'w') as manifest_file:
        json.dump(images, manifest_file, indent=4)
    print(f"Wrote {manifest_path} ({len(images)} images)")
    return images


def _choose_cover_photo(gallery_path: str, default_cover: str, gallery_label: str) -> str:
    try:
        # Reuse the robust chooser from gallery_generator if available
        from utils.gallery_generator import _choose_cover_photo_interactively  # type: ignore
        return _choose_cover_photo_interactively(gallery_path, default_cover, gallery_label)
    except Exception:
        # Simple fallback: accept default or typed filename
        while True:
            entered = input(f"Enter the cover photo filename for {gallery_label} (leave blank to keep '{default_cover}'):").strip()
            if not entered:
                return default_cover
            candidate = entered if os.path.splitext(entered)[1] else f"{entered}.jpg"
            candidate_path = os.path.join(gallery_path, candidate)
            if os.path.exists(candidate_path):
                return candidate
            print(f"'{candidate}' not found. Please try again.")


def _update_galleries_json(images_root: str, gallery_folder: str, images: List[str]):
    print("\nStep 3/4: Updating images/galleries.json …")
    galleries_json_path = os.path.join(images_root, 'galleries.json')
    existing = {"galleries": []}
    if os.path.exists(galleries_json_path):
        with open(galleries_json_path, 'r') as f:
            existing = json.load(f) or existing

    galleries = existing.get('galleries', [])
    folder_path = os.path.join(images_root, gallery_folder)

    # Prepare fields
    default_cover = images[0] if images else ''
    title_default = gallery_folder.replace('-', ' ').title()
    print(f"Default title: {title_default}")
    custom_title = input("Enter a custom title or press Enter to accept default: ").strip()
    title = custom_title or title_default

    cover = default_cover
    if images:
        manual = input(f"Pick a specific cover image for '{gallery_folder}'? (yes/no): ").strip().lower()
        if manual == 'yes':
            cover = _choose_cover_photo(folder_path, default_cover, gallery_folder)

    # Compute JSON name consistent with existing generator
    json_name = os.path.relpath(folder_path, images_root).replace(os.sep, '-')

    new_entry = {
        "name": json_name,
        "title": title,
        "coverPhoto": cover,
        "description": f"{gallery_folder.replace('-', ' ')} collection"
    }

    # Upsert
    replaced = False
    for i, g in enumerate(galleries):
        if g.get('name') == json_name:
            galleries[i] = new_entry
            replaced = True
            break
    if not replaced:
        galleries.append(new_entry)

    with open(galleries_json_path, 'w') as f:
        json.dump({"galleries": galleries}, f, indent=4)
    print(f"Updated {galleries_json_path}")


def _update_secrets(public_dir: str, gallery_name: str):
    print("\nStep 4/4: Add or update gallery password and download link…")
    secrets_path = os.path.join(public_dir, 'secrets.json')
    from utils.secrets_setter import add_gallery_secret

    password = input("Enter the password your client will use: ").strip()
    download_link = input("Enter the download link (e.g., GitHub Releases URL): ").strip()
    add_gallery_secret(secrets_path, gallery_name, password, download_link)


def main():
    print("\nWelcome! This wizard will help you add a new gallery.")
    print("You'll need: images in public/images/<Gallery Name> and the full-res download link ready.")
    confirm = input("Have you uploaded the full-resolution gallery to your file host (e.g., GitHub Releases)? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("Please upload your full-resolution gallery first, then re-run this wizard.")
        return

    _check_dependencies()

    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    public_dir = os.path.join(repo_root, 'public')
    images_root = os.path.join(public_dir, 'images')

    gallery_folder = _choose_gallery(images_root)
    gallery_path = os.path.join(images_root, gallery_folder)

    _resize_images(gallery_path)
    images = _write_manifest(gallery_path)
    _update_galleries_json(images_root, gallery_folder, images)
    _update_secrets(public_dir, gallery_folder)

    print("\nAll steps complete! Next:")
    print("- Open the site in your browser and verify the new gallery appears with the correct cover image.")
    print("- Test the password and the download button.")
    print("If anything looks off, you can re-run this wizard to update.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nCancelled by user.")