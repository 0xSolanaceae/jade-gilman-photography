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
    print("Available directories:")
    for dir_name in os.listdir(base_directory):
        if os.path.isdir(os.path.join(base_directory, dir_name)):
            print(dir_name)
    
    chosen_directory = input("Please enter the name of the directory you want to resize: ")
    images_directory = os.path.join(base_directory, chosen_directory)
    
    if os.path.exists(images_directory) and os.path.isdir(images_directory):
        resize_images(images_directory)
    else:
        print(f"The directory {images_directory} does not exist.")