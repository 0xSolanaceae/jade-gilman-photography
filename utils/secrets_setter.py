import json
import os
import re

def is_valid_url(url):
    regex = re.compile(
        r'^(?:http|ftp)s?://'  # http:// or https://
        r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|'  # domain...
        r'localhost|'  # localhost...
        r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}|'  # ...or ipv4
        r'\[?[A-F0-9]*:[A-F0-9:]+\]?)'  # ...or ipv6
        r'(?::\d+)?'  # optional port
        r'(?:/?|[/?]\S+)$', re.IGNORECASE)
    return re.match(regex, url) is not None

def add_gallery_secret(file_path, gallery_name, password, download_link):
    if not os.path.exists(file_path):
        print(f"File {file_path} does not exist.")
        return

    with open(file_path, 'r') as file:
        secrets = json.load(file)

    if gallery_name in secrets:
        print(f"Gallery {gallery_name} already exists in the secrets file.")
        print(f"Existing content: {secrets[gallery_name]}")
        overwrite = input("Do you want to overwrite it? (yes/no): ").strip().lower()
        if overwrite != 'yes':
            print("Operation cancelled.")
            return

    if not is_valid_url(download_link):
        print("Invalid download link.")
        return

    secrets[gallery_name] = {
        "password": password,
        "downloadLink": download_link
    }

    with open(file_path, 'w') as file:
        json.dump(secrets, file, indent=4)
    print(f"Added {gallery_name} to {file_path}")

if __name__ == "__main__":
    file_path = os.path.join('public', 'secrets.json')
    print("\nWe will now generate metadata for a new gallery:")
    gallery_name = input("Enter the gallery name: ")
    password = input("Enter the password for the gallery: ")
    download_link = input("Enter the download link: ")

    add_gallery_secret(file_path, gallery_name, password, download_link)