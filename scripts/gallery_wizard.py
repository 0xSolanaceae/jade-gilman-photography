import json
import os
from pathlib import Path
from typing import Any, Dict, List

import yaml
from PIL import Image
from tqdm import tqdm

ROOT = Path(__file__).resolve().parent.parent
REGISTRY_PATH = ROOT / "data" / "galleries.yaml"
PUBLIC_IMAGES = ROOT / "public" / "images"
OUTPUT_JSON = PUBLIC_IMAGES / "galleries.json"
SECRETS_JSON = ROOT / "public" / "secrets.json"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp"}
RESIZE_TARGET = (1600, 1200)
ResamplingAttr = getattr(Image, "Resampling", None)
if ResamplingAttr:
    RESAMPLE: Any = getattr(ResamplingAttr, "LANCZOS", getattr(ResamplingAttr, "BICUBIC", getattr(ResamplingAttr, "NEAREST", 1)))
else:
    RESAMPLE: Any = getattr(Image, "LANCZOS", getattr(Image, "BICUBIC", getattr(Image, "NEAREST", 1)))


def load_registry() -> Dict:
    if not REGISTRY_PATH.exists():
        return {"galleries": []}
    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    data.setdefault("galleries", [])
    return data


def save_registry(data: Dict) -> None:
    REGISTRY_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(REGISTRY_PATH, "w", encoding="utf-8") as f:
        yaml.safe_dump(data, f, sort_keys=False, allow_unicode=False)


def prompt(text: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    value = input(f"{text}{suffix}: ").strip()
    return value or default


def list_galleries(registry: Dict) -> None:
    if not registry["galleries"]:
        print("No galleries yet. Add a new one.")
        return
    print("\nExisting galleries:")
    for idx, g in enumerate(registry["galleries"], 1):
        print(f" {idx}. {g.get('name', g.get('title', 'Untitled'))}")


def choose_gallery(registry: Dict) -> Dict:
    list_galleries(registry)
    total = len(registry["galleries"])
    choice = input("\nEnter number to edit, or 'n' to add a new gallery: ").strip().lower()
    if choice == "n" or not registry["galleries"]:
        return {
            "name": "",
            "folder": "",
            "title": "",
            "cover": "",
            "password": "",
            "download_link": "",
        }
    if not choice.isdigit():
        print("Invalid choice; starting a new gallery.")
        return {
            "name": "",
            "folder": "",
            "title": "",
            "cover": "",
            "password": "",
            "download_link": "",
        }
    idx = int(choice)
    if 1 <= idx <= total:
        return registry["galleries"][idx - 1].copy()
    print("Out of range; starting a new gallery.")
    return {
        "name": "",
        "folder": "",
        "title": "",
        "cover": "",
        "password": "",
        "download_link": "",
    }


def ensure_folder(folder_name: str) -> Path:
    folder_path = PUBLIC_IMAGES / folder_name
    if folder_path.exists():
        return folder_path
    create = input(f"Create folder '{folder_path}'? (y/n) ").strip().lower()
    if create == "y":
        folder_path.mkdir(parents=True, exist_ok=True)
        return folder_path
    raise SystemExit("Folder missing. Please add images first.")


def find_images(folder: Path) -> List[str]:
    photos = [f for f in os.listdir(folder) if Path(f).suffix.lower() in IMAGE_EXTS]
    photos.sort()
    return photos


def already_resized(folder: Path) -> bool:
    photos = find_images(folder)
    if not photos:
        return False
    for file_name in photos:
        file_path = folder / file_name
        try:
            with Image.open(file_path) as img:
                w, h = img.size
                if w > RESIZE_TARGET[0] or h > RESIZE_TARGET[1]:
                    return False
        except OSError:
            return False
    return True


def resize_images(folder: Path) -> None:
    photos = find_images(folder)
    if not photos:
        print("No images to resize.")
        return
    print("\nResizing images (this overwrites the files).")
    for file_name in tqdm(photos, desc="Resizing", unit="file"):
        file_path = folder / file_name
        with Image.open(file_path) as img:
            img.thumbnail(RESIZE_TARGET, RESAMPLE)
            img.save(file_path)


def choose_cover(photos: List[str], current_cover: str) -> str:
    if not photos:
        return ""
    default_cover = current_cover if current_cover in photos else photos[0]
    print("\nPick a cover photo (type a filename). Examples:")
    for sample in photos[:5]:
        print(f" - {sample}")
    chosen = prompt("Cover photo", default_cover)
    if chosen in photos:
        return chosen
    print("Not found; using default.")
    return default_cover


def update_entry(entry: Dict) -> Dict:
    name = prompt("Gallery name (display)", entry.get("name", ""))
    folder = prompt("Folder name under public/images", entry.get("folder", name))
    title = prompt("Title", entry.get("title", name or folder))

    folder_path = ensure_folder(folder)
    photos = find_images(folder_path)
    if not photos:
        print("Warning: this folder has no images yet.")

    if already_resized(folder_path):
        print("Images are already at or below the web size target; skipping resize.")
    else:
        resize_choice = input("Resize images for web? (recommended) (y/n) ").strip().lower() or "y"
        if resize_choice == "y":
            resize_images(folder_path)
            photos = find_images(folder_path)

    cover = choose_cover(photos, entry.get("cover", ""))
    password = prompt("Passcode (visible to users)", entry.get("password", ""))
    download_link = prompt("Download link (public)", entry.get("download_link", ""))

    return {
        "name": name or folder,
        "folder": folder or name,
        "title": title or name or folder,
        "cover": cover,
        "password": password,
        "download_link": download_link,
    }


def persist_entry(registry: Dict, updated: Dict) -> None:
    existing = {g.get("name"): i for i, g in enumerate(registry["galleries"])}
    key = updated.get("name")
    if key in existing:
        registry["galleries"][existing[key]] = updated
    else:
        registry["galleries"].append(updated)
    registry["galleries"] = sorted(registry["galleries"], key=lambda g: g.get("title", g.get("name", "")))


def build_public_payload(registry: Dict) -> Dict:
    payload = {"galleries": []}
    for entry in registry["galleries"]:
        folder_path = PUBLIC_IMAGES / entry.get("folder", entry.get("name", ""))
        photos = find_images(folder_path) if folder_path.exists() else []
        cover = entry.get("cover") or (photos[0] if photos else "")
        if cover and cover not in photos:
            print(f"Cover '{cover}' not found in {folder_path}; using first image.")
            cover = photos[0] if photos else ""
        payload["galleries"].append({
            "name": entry.get("name"),
            "title": entry.get("title"),
            "coverPhoto": cover,
            "password": entry.get("password", ""),
            "downloadLink": entry.get("download_link", ""),
            "photos": photos,
        })
    return payload


def write_public_files(payload: Dict) -> None:
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    secrets = {g["name"]: {"password": g.get("password", ""), "downloadLink": g.get("downloadLink", "")} for g in payload.get("galleries", [])}
    with open(SECRETS_JSON, "w", encoding="utf-8") as f:
        json.dump(secrets, f, indent=2)


def main():
    print("\nGallery Wizard (interactive)")
    registry = load_registry()
    entry = choose_gallery(registry)
    updated_entry = update_entry(entry)
    persist_entry(registry, updated_entry)
    save_registry(registry)
    payload = build_public_payload(registry)
    write_public_files(payload)
    print(f"\nDone. Updated registry: {REGISTRY_PATH}")
    print(f"Updated public data: {OUTPUT_JSON}")
    print(f"Secrets (public): {SECRETS_JSON}")
    print("You can now deploy.")


if __name__ == "__main__":
    main()
