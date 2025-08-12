from PIL import Image
import os
from tqdm import tqdm

def resize_images(directory, size=(1200, 900)):
    files_to_resize = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')):
                files_to_resize.append(os.path.join(root, file))
    
    for file_path in tqdm(files_to_resize, desc="Resizing images", unit="file"):
        with Image.open(file_path) as img:
            img.thumbnail(size, Image.LANCZOS)
            img.save(file_path)

if __name__ == "__main__":
    base_directory = os.path.join('public', 'images')
    directories = [d for d in os.listdir(base_directory) if os.path.isdir(os.path.join(base_directory, d))]
    directories.sort()
    if not directories:
        print("No directories found.")
    else:
        print("Available directories:")
        for i, d in enumerate(directories, start=1):
            print(f"{i}. {d}")

        while True:
            choice = input("Enter the number of the directory you want to resize: ").strip()
            if not choice.isdigit():
                print("Please enter a valid number.")
                continue
            idx = int(choice)
            if 1 <= idx <= len(directories):
                chosen_directory = directories[idx - 1]
                break
            else:
                print(f"Please enter a number between 1 and {len(directories)}.")

        images_directory = os.path.join(base_directory, chosen_directory)
        resize_images(images_directory)