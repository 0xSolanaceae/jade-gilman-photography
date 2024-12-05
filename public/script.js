const passcodes = {
    'Winter Wonderland': '1',
    'Cartoon Creatures': '2'
};

function checkPasscode() {
    const passcode = document.getElementById('passcodeInput').value;
    let validPasscode = false;
    for (const gallery in passcodes) {
        if (passcodes[gallery] === passcode) {
            document.getElementById('passcodePrompt').style.display = 'none';
            document.getElementById('galleries').style.display = 'block';
            
            document.querySelectorAll('.gallery').forEach(galleryElement => {
                galleryElement.classList.remove('active');
            });
            
            document.getElementById(gallery.replace(/\s+/g, '-')).classList.add('active');
            document.getElementById('backButton').style.display = 'block';
            validPasscode = true;
        }
    }
    if (!validPasscode) {
        alert('Invalid passcode');
    }
}

function goBack() {
    if (confirm('If you go back to the home page, you will have to re-enter your password. Do you want to continue?')) {
        document.getElementById('passcodePrompt').style.display = 'block';
        document.getElementById('galleries').style.display = 'none';
        document.getElementById('backButton').style.display = 'none';
    }
}

function openModal(src) {
    const modal = document.getElementById('photoModal');
    const modalImg = document.getElementById('modalImage');
    modal.style.display = 'flex';
    modalImg.src = src;
}

function closeModal() {
    const modal = document.getElementById('photoModal');
    modal.style.display = 'none';
}

function downloadPhoto(button) {
    const img = button.previousElementSibling;
    const link = document.createElement('a');
    link.href = img.src;
    link.download = img.src.split('/').pop();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadPhotos(galleryId) {
    const gallery = document.getElementById(galleryId);
    const photos = gallery.querySelectorAll('.photos img');
    const zip = new JSZip();
    const folder = zip.folder(galleryId);
    const progressBar = document.getElementById(`progress-${galleryId}`);
    progressBar.style.display = 'block';
    progressBar.value = 0;

    const totalSteps = photos.length + 1;

    const updateProgress = (step) => {
        progressBar.value = (step / totalSteps) * 100;
    };

    photos.forEach((photo, index) => {
        const filename = photo.src.split('/').pop();
        fetch(photo.src)
            .then(response => response.blob())
            .then(blob => {
                folder.file(filename, blob);
                updateProgress(index + 1);
            });
    });

    zip.generateAsync({ type: 'blob' }, (metadata) => {
        updateProgress(photos.length + metadata.percent / 100);
    }).then(content => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${galleryId}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        progressBar.style.display = 'none';
    });
}

function loadPhotos(galleryId, photoFilenames) {
    const photosContainer = document.getElementById(`photos-${galleryId}`);
    photoFilenames.forEach(filename => {
        const photoContainer = document.createElement('div');
        photoContainer.classList.add('photo-container');
        
        const img = document.createElement('img');
        img.src = `images/${galleryId}/${filename}`;
        img.alt = filename;
        
        photoContainer.appendChild(img);
        photosContainer.appendChild(photoContainer);

        img.addEventListener('click', () => openModal(img.src));
    });
}

document.getElementById('galleries').style.display = 'none';

loadPhotos('Winter-Wonderland', ['a_mountain_with_snow_and_clouds.jpg', 'a_snow_covered_houses_and_a_street_light.png', 'a_snow_covered_mountain_top.jpg', 'a_snowy_landscape_with_trees_and_a_light_on_it.jpg']);
loadPhotos('Cartoon-Creatures', ['a_black_and_orange_drawing_of_a_bug.png', 'a_black_and_white_drawing_of_a_horse.png', 'a_cartoon_of_a_bug.png', 'a_cartoon_of_a_deer_with_a_bunch_of_worms.png', 'a_drawing_of_snakes_on_a_blue_background.png', 'a_group_of_cartoon_animals_with_green_tentacles.png']);