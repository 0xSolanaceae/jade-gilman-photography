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

async function loadGalleries() {
    try {
        const response = await fetch('images/galleries.json');
        if (!response.ok) throw new Error('Failed to load galleries');
        const data = await response.json();
        const albumsGrid = document.getElementById('albumsGrid');
        albumsGrid.innerHTML = data.galleries.map(gallery => `
            <article class="card" data-album="${gallery.name}">
                <div class="card-image">
                    <div class="image-overlay"></div>
                    <img id="cover-${gallery.name}" src="images/${gallery.name}/${gallery.coverPhoto}" alt="${gallery.description}" loading="lazy">
                </div>
                <div class="card-content">
                    <h3>${gallery.title}</h3>
                    <button class="btn btn-outline" onclick="promptPassword('${gallery.name}')">
                        Access Collection <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Error loading galleries:', error);
        alert('Failed to load galleries. Please try again.');
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

    if (passcodes[currentGallery]?.password === passcode) {
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

async function loadGallery(album) {
    try {
        const response = await fetch(`images/${album}/manifest.json`);
        if (!response.ok) throw new Error('Manifest not found');
        const photos = await response.json();

        const downloadLink = passcodes[album]?.downloadLink || '#';

        currentPhotos = photos.map(photo => `images/${album}/${photo}`);

        const galleryHTML = `
            <section class="gallery">
                <header class="gallery-header">
                    <button class="btn back-btn" onclick="exitGallery()">
                        <i class="fas fa-arrow-left"></i> Back to Collections
                    </button>
                    <h2>${album.replace(/-/g, ' ')}</h2>
                    <a class="btn btn-primary btn-download" href="${downloadLink}">
                        <i class="fas fa-download"></i> Download All
                    </a>
                </header>
                <div class="photo-grid" id="photoGrid">
                    ${photos.map((photo, index) => `
                        <div class="photo-item" id="photoItem-${index}" onclick="openLightbox(${index})">
                            <div class="skeleton"></div>
                            <img src="" alt="${photo}" loading="lazy" class="lazy-img">
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
                imgElement.previousElementSibling.remove(); // Remove skeleton
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

// Event Listeners
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('lightbox')) {
        closeModal();
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    await loadPasscodes();
    await loadGalleries();

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('.lazy-img').forEach(img => {
        observer.observe(img);
    });

    setTimeout(() => {
        document.getElementById('albumPasscodeInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') checkAlbumPasscode();
        });

        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('lightbox')) {
                closeModal();
            }
        });
    },);
});

// Initialize
document.getElementById('albumPasscodeInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') checkAlbumPasscode();
});