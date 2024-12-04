const passcodes = {
    gallery1: 'passcode1',
    gallery2: 'passcode2',
    gallery3: 'passcode3',
    gallery4: 'passcode4'
};

function checkPasscode() {
    const passcode = document.getElementById('passcodeInput').value;
    let validPasscode = false;
    for (const gallery in passcodes) {
        if (passcodes[gallery] === passcode) {
            document.getElementById('passcodePrompt').style.display = 'none';
            document.getElementById(gallery).classList.add('active');
            validPasscode = true;
        }
    }
    if (!validPasscode) {
        alert('Invalid passcode');
    }
}

function downloadPhotos(galleryId) {
    const gallery = document.getElementById(galleryId);
    const photos = gallery.querySelectorAll('.photos img');
    photos.forEach(photo => {
        const link = document.createElement('a');
        link.href = photo.src;
        link.download = photo.src.split('/').pop();
        link.click();
    });
}