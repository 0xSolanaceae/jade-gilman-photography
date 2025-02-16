// app.js
const passcodes = {
    'Winter-Wonderland': '1',
    'Cartoon-Creatures': '2'
};

let currentGallery = null;
let currentPhotos = [];
let currentPhotoIndex = 0;
let currentZip = null;

// Password Handling
function promptPassword(album) {
    currentGallery = album;
    const modal = document.getElementById('passwordModal');
    modal.style.display = 'flex';
    document.getElementById('albumPasscodeInput').value = '';
    document.getElementById('passwordError').textContent = '';
}

function closePasswordPrompt() {
    document.getElementById('passwordModal').style.display = 'none';
}

function checkAlbumPasscode() {
    const passcode = document.getElementById('albumPasscodeInput').value;
    const errorElement = document.getElementById('passwordError');

    if (passcodes[currentGallery] === passcode) {
        loadGallery(currentGallery);
        closePasswordPrompt();
    } else {
        errorElement.textContent = 'Incorrect passcode. Please try again.';
        document.getElementById('albumPasscodeInput').classList.add('error');
        setTimeout(() => {
            document.getElementById('albumPasscodeInput').classList.remove('error');
        }, 2000);
    }
}

// Gallery Management
function loadGallery(album) {
    const photos = album === 'Winter-Wonderland' ? [
        'a_snow_covered_houses_and_a_street_light.png',
        'a_snow_covered_mountain_top.jpg',
        'a_snowy_landscape_with_trees_and_a_light_on_it.jpg'
    ] : [
        'a_black_and_white_drawing_of_a_horse.png',
        'a_cartoon_of_a_bug.png',
        'a_cartoon_of_a_deer_with_a_bunch_of_worms.png',
        'a_drawing_of_snakes_on_a_blue_background.png',
        'a_group_of_cartoon_animals_with_green_tentacles.png'
    ];

    currentPhotos = photos.map(photo => `images/${album}/${photo}`);

    const galleryHTML = `
        <section class="gallery">
            <header class="gallery-header">
                <button class="btn back-btn" onclick="exitGallery()">
                    <i class="fas fa-arrow-left"></i> Back to Collections
                </button>
                <h2>${album.replace(/-/g, ' ')}</h2>
                <button class="btn btn-primary" onclick="downloadZip('${album}')">
                    <i class="fas fa-download"></i> Download All
                </button>
            </header>
            <div class="photo-grid">
                ${photos.map((photo, index) => `
                    <div class="photo-item" onclick="openLightbox(${index})">
                        <img src="images/${album}/${photo}" alt="${photo}" loading="lazy">
                    </div>
                `).join('')}
            </div>
            <div class="progress-bar" id="progress-${album}"><div class="progress"></div></div>
        </section>
    `;

    document.getElementById('galleryContainer').innerHTML = galleryHTML;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.addEventListener('keydown', handleKeyboardNavigation);
}

function exitGallery() {
    if (confirm('Are you sure you want to exit this gallery?')) {
        document.getElementById('galleryContainer').innerHTML = '';
        document.removeEventListener('keydown', handleKeyboardNavigation);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Lightbox Functions
function openLightbox(index) {
    currentPhotoIndex = index;
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'flex';
    document.getElementById('lightboxImage').src = currentPhotos[currentPhotoIndex];
}

function closeModal() {
    document.getElementById('lightbox').style.display = 'none';
}

function navigatePhoto(direction) {
    currentPhotoIndex = (currentPhotoIndex + direction + currentPhotos.length) % currentPhotos.length;
    document.getElementById('lightboxImage').src = currentPhotos[currentPhotoIndex];
}

function handleKeyboardNavigation(e) {
    if (document.getElementById('lightbox').style.display === 'flex') {
        switch(e.key) {
            case 'ArrowLeft':
                navigatePhoto(-1);
                break;
            case 'ArrowRight':
                navigatePhoto(1);
                break;
            case 'Escape':
                closeModal();
                break;
        }
    }
}

// ZIP Download
async function downloadZip(album) {
    const zip = new JSZip();
    const progressBar = document.querySelector(`#progress-${album} .progress`);
    const photos = document.querySelectorAll(`.photo-item img`);
    
    progressBar.style.width = '0%';
    
    try {
        for (const [index, img] of Array.from(photos).entries()) {
            const response = await fetch(img.src);
            if (!response.ok) throw new Error('Failed to fetch image');
            const blob = await response.blob();
            zip.file(img.src.split('/').pop(), blob);
            progressBar.style.width = `${(index + 1) / photos.length * 100}%`;
        }

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${album}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        alert('Error downloading photos: ' + error.message);
        progressBar.style.width = '0%';
    }
}

// Event Listeners
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('lightbox')) {
        closeModal();
    }
});

// Initialize
document.getElementById('albumPasscodeInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') checkAlbumPasscode();
});