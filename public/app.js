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
                    <div class="skeleton"></div>
                    <img id="cover-${gallery.name}" 
                         data-src="images/${gallery.name}/${gallery.coverPhoto}" 
                         alt="${gallery.description}" 
                         class="lazy-cover-img"
                         style="opacity: 0;">
                </div>
                <div class="card-content">
                    <h3>${gallery.title}</h3>
                    <button class="btn btn-outline" onclick="promptPassword('${gallery.name}')">
                        Access Collection <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </article>
        `).join('');
        
        // Initialize lazy loading for cover images
        initializeLazyLoading();
    } catch (error) {
        console.error('Error loading galleries:', error);
        alert('Failed to load galleries. Please try again.');
    }
}

// Improved Intersection Observer for lazy loading
function initializeLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.dataset.src;
                
                if (src) {
                    // Create a new image to preload
                    const tempImg = new Image();
                    tempImg.onload = () => {
                        img.src = src;
                        img.style.opacity = '1';
                        img.style.transition = 'opacity 0.3s ease-in';
                        // Remove skeleton loader
                        const skeleton = img.previousElementSibling;
                        if (skeleton && skeleton.classList.contains('skeleton')) {
                            skeleton.style.display = 'none';
                        }
                        img.classList.add('loaded');
                    };
                    tempImg.src = src;
                    observer.unobserve(img);
                }
            }
        });
    }, {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01
    });

    // Observe all lazy images
    document.querySelectorAll('.lazy-cover-img, .lazy-img').forEach(img => {
        imageObserver.observe(img);
    });
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

        // Use virtual scrolling for galleries with many images
        const useVirtualScrolling = photos.length > 50;

        if (useVirtualScrolling) {
            loadGalleryWithVirtualScrolling(album, photos, downloadLink);
        } else {
            loadGalleryNormal(album, photos, downloadLink);
        }
    } catch (error) {
        console.error('Error loading gallery:', error);
        alert('Failed to load gallery. Please try again.');
        closePasswordPrompt();
    }
}

function loadGalleryNormal(album, photos, downloadLink) {
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
                        <img src="" alt="${photo}" class="lazy-img" style="opacity: 0;">
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

    // Load images with data-src for lazy loading
    const imgElements = document.querySelectorAll('.photo-item img');
    imgElements.forEach((imgElement, index) => {
        imgElement.dataset.src = `images/${album}/${photos[index]}`;
    });
    
    // Initialize lazy loading for gallery images
    initializeLazyLoading();
}

function loadGalleryWithVirtualScrolling(album, photos, downloadLink) {
    const BATCH_SIZE = 20; // Render 20 images initially
    let renderedCount = 0;

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
            <div class="photo-grid" id="photoGrid"></div>
            <div class="progress-bar" id="progress-${album}"><div class="progress"></div></div>
        </section>
    `;

    document.getElementById('galleryContainer').innerHTML = galleryHTML;
    document.querySelector('.portfolio-section').style.display = 'none';
    document.querySelector('.gallery').scrollIntoView({ behavior: 'smooth' });
    document.addEventListener('keydown', handleKeyboardNavigation);

    const photoGrid = document.getElementById('photoGrid');

    // Function to render a batch of photos
    function renderBatch() {
        const fragment = document.createDocumentFragment();
        const end = Math.min(renderedCount + BATCH_SIZE, photos.length);

        for (let i = renderedCount; i < end; i++) {
            const div = document.createElement('div');
            div.className = 'photo-item';
            div.id = `photoItem-${i}`;
            div.onclick = () => openLightbox(i);
            
            div.innerHTML = `
                <div class="skeleton"></div>
                <img data-src="images/${album}/${photos[i]}" alt="${photos[i]}" class="lazy-img" style="opacity: 0;">
            `;
            fragment.appendChild(div);
        }

        photoGrid.appendChild(fragment);
        renderedCount = end;

        // Initialize lazy loading for new batch
        initializeLazyLoading();

        // Update progress
        const progress = (renderedCount / photos.length) * 100;
        const progressBar = document.querySelector(`#progress-${album} .progress`);
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    // Render initial batch
    renderBatch();

    // Set up scroll observer for infinite loading
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && renderedCount < photos.length) {
                renderBatch();
            }
        });
    }, {
        rootMargin: '200px' // Load next batch 200px before reaching the end
    });

    // Observe the last element
    const observeLastElement = () => {
        const lastItem = photoGrid.lastElementChild;
        if (lastItem && renderedCount < photos.length) {
            scrollObserver.observe(lastItem);
        }
    };

    // Start observing
    setTimeout(observeLastElement, 100);
    
    // Re-observe when new items are added
    const mutationObserver = new MutationObserver(() => {
        scrollObserver.disconnect();
        observeLastElement();
    });
    
    mutationObserver.observe(photoGrid, { childList: true });
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

// Lightbox Functions with debouncing
function openLightbox(index) {
    currentPhotoIndex = index;
    const lightbox = document.getElementById('lightbox');
    lightbox.style.display = 'flex';
    
    // Preload current and adjacent images
    preloadLightboxImages(index);
}

function preloadLightboxImages(index) {
    const lightboxImage = document.getElementById('lightboxImage');
    lightboxImage.src = currentPhotos[index];
    
    // Preload next and previous images
    const preloadIndices = [
        (index + 1) % currentPhotos.length,
        (index - 1 + currentPhotos.length) % currentPhotos.length
    ];
    
    preloadIndices.forEach(i => {
        const img = new Image();
        img.src = currentPhotos[i];
    });
}

function closeModal() {
    document.getElementById('lightbox').style.display = 'none';
}

// Debounce function to limit rapid calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

const debouncedNavigatePhoto = debounce((direction) => {
    currentPhotoIndex = (currentPhotoIndex + direction + currentPhotos.length) % currentPhotos.length;
    preloadLightboxImages(currentPhotoIndex);
}, 100);

function navigatePhoto(direction) {
    debouncedNavigatePhoto(direction);
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
});

// Initialize
document.getElementById('albumPasscodeInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') checkAlbumPasscode();
});