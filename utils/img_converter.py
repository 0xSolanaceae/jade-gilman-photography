from PIL import Image
import os
from tqdm import tqdm

def convert_images_to_webp(directory):
    files_to_convert = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                files_to_convert.append(os.path.join(root, file))
    
    for file_path in tqdm(files_to_convert, desc="Converting images", unit="file"):
        webp_path = os.path.splitext(file_path)[0] + '.webp'
        with Image.open(file_path) as img:
            img.save(webp_path, 'webp', quality=100)
        os.remove(file_path)

if __name__ == "__main__":
    base_directory = os.path.join('public', 'images')
    print("Available directories:")
    for dir_name in os.listdir(base_directory):
        if os.path.isdir(os.path.join(base_directory, dir_name)):
            print(dir_name)
    
    chosen_directory = input("Please enter the name of the directory you want to convert: ")
    images_directory = os.path.join(base_directory, chosen_directory)
    
    if os.path.exists(images_directory) and os.path.isdir(images_directory):
        convert_images_to_webp(images_directory)
    else:
        print(f"The directory {images_directory} does not exist.")