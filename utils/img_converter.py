from PIL import Image
import os

def convert_images_to_webp(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(('.png', '.jpg', '.jpeg')):
                file_path = os.path.join(root, file)
                webp_path = os.path.splitext(file_path)[0] + '.webp'
                with Image.open(file_path) as img:
                    img.save(webp_path, 'webp', quality=100)
                os.remove(file_path)
                print(f"Converted {file_path} --> {webp_path}")

if __name__ == "__main__":
    images_directory = os.path.join('public', 'images')
    convert_images_to_webp(images_directory)