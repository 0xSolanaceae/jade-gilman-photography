import subprocess
import os

def run_script(script_path):
    if os.path.exists(script_path):
        try:
            subprocess.run(["python", script_path], check=True)
            print(f"{script_path} ran successfully.")
        except subprocess.CalledProcessError as e:
            print(f"Error running {script_path}:\n{e}")
    else:
        print(f"{script_path} not found.")

if __name__ == "__main__":
    idiot_check = input("Please confirm you have uploaded the full resolution gallery to the file hosting site (github) prior to running this script. \nYour images are about to be irreversably compressed for website hosting. (yes/no): ")
    if idiot_check.lower() != 'yes':
        print("Make good decisions.")
        exit()
    scripts = [
        'utils/img_resizer.py',
        'utils/gallery_generator.py',
        'utils/manifest_generator.py',
        'utils/secrets_setter.py'
    ]

    for script in scripts:
        run_script(script)