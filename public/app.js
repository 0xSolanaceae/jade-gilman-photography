let passcodes = {};
let currentGallery = null;
let currentPhotos = [];
let currentPhotoIndex = 0;
let currentZip = null;

async function loadPasscodes() {
    try {
      const response = await fetch('secrets.json');
      if (!response.ok) throw new Error('Failed to load passcodes');
      passcodes = await response.json();
    } catch (error) {
      console.error('Security Error:', error);
      alert('Authentication system unavailable. Please try later.');
        }
    }

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
    if (Object.keys(passcodes).length === 0) {
      alert('Initializing... Please try again in a moment.');
      return;
    }
  
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
async function loadGallery(album) {
    try {
        const response = await fetch(`images/${album}/manifest.json`);
        if (!response.ok) throw new Error('Manifest not found');
        const photos = await response.json();

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
                <div class="photo-grid" id="photoGrid">
                    ${photos.map((photo, index) => `
                        <div class="photo-item" id="photoItem-${index}" onclick="openLightbox(${index})">
                            <img src="" alt="${photo}" loading="lazy">
                        </div>
                    `).join('')}
                </div>
                <div class="progress-bar" id="progress-${album}"><div class="progress"></div></div>
            </section>
        `;

        document.getElementById('galleryContainer').innerHTML = galleryHTML;
        document.querySelector('.portfolio-section').style.display = 'none';
        document.querySelector('.gallery').scrollIntoView({ behavior: 'smooth' });
        document.addEventListener('keydown', handleKeyboardNavigation);

        // Load images and add loaded class
        const imgElements = document.querySelectorAll('.photo-item img');
        imgElements.forEach((imgElement, index) => {
            imgElement.src = `images/${album}/${photos[index]}`;
            imgElement.onload = () => {
                imgElement.classList.add('loaded');
            };
        });
    } catch (error) {
        console.error('Error loading gallery:', error);
        alert('Failed to load gallery. Please try again.');
        closePasswordPrompt();
    }
}

function exitGallery() {
    const modalHTML = `
        <div class="exit-modal" id="exitModal">
            <div class="exit-modal-dialog">
                <div class="exit-modal-header">
                    <h3>Exit Gallery</h3>
                    <button class="icon-btn" onclick="closeExitModal()">&times;</button>
                </div>
                <div class="exit-modal-body">
                    <p>Are you sure you want to exit this gallery?</p>
                </div>
                <div class="exit-modal-footer">
                    <button class="btn btn-outline" onclick="closeExitModal()">Cancel</button>
                    <button class="btn btn-primary" onclick="confirmExitGallery()">Exit</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('exitModal').style.display = 'flex';
}

function closeExitModal() {
    const modal = document.getElementById('exitModal');
    if (modal) {
        modal.remove();
    }
}

function confirmExitGallery() {
    document.getElementById('galleryContainer').innerHTML = '';
    document.removeEventListener('keydown', handleKeyboardNavigation);

    // Show the portfolio section again
    const portfolioSection = document.querySelector('.portfolio-section');
    if (portfolioSection) portfolioSection.style.display = '';

    portfolioSection.scrollIntoView({ behavior: 'smooth' });
    closeExitModal();
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

document.addEventListener('DOMContentLoaded', async () => {
    const albums = ['Winter-Wonderland', 'Cartoon-Creatures'];
    await loadPasscodes();

    albums.forEach(async (album) => {
        try {
            const response = await fetch(`images/${album}/manifest.json`);
            if (!response.ok) throw new Error('Manifest not found');
            const photos = await response.json();
            const coverPhoto = photos.find(photo => photo.includes('cover'));
            if (coverPhoto) {
                document.getElementById(`cover-${album}`).src = `images/${album}/${coverPhoto}`;
            }
        } catch (error) {
            console.error(`Error loading cover for ${album}:`, error);
        }
    });
});

// Initialize
document.getElementById('albumPasscodeInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') checkAlbumPasscode();
});