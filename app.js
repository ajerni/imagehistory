// ==================== //
// Configuration
// ==================== //

const API_CONFIG = {
    // Option 1: Use direct PHP file (works without .htaccess)
    url: '/api-images.php',
    
    // Option 2: Use URL rewriting (requires .htaccess working)
    // url: '/api/images',
    
    headers: {},  // Headers are handled by the proxy
    useDemoData: false,  // Set to false when webhook returns image URLs (see README.md)
    imageBaseUrl: 'https://n8n.ernilabs.com/webhook/8dae343b-3828-4970-b696-61ec762a8833'
};

// ==================== //
// State Management
// ==================== //

let allImages = [];
let filteredImages = [];
let currentLightboxIndex = 0;
let currentCarouselIndex = 0;
let currentView = 'grid'; // 'grid' or 'carousel'

// ==================== //
// DOM Elements
// ==================== //

const elements = {
    loading: document.getElementById('loading'),
    galleryGrid: document.getElementById('gallery-grid'),
    galleryContainer: document.getElementById('gallery-container'),
    carouselContainer: document.getElementById('carousel-container'),
    imageCount: document.getElementById('image-count'),
    dateFilter: document.getElementById('date-filter'),
    customDateRange: document.getElementById('custom-date-range'),
    dateFrom: document.getElementById('date-from'),
    dateTo: document.getElementById('date-to'),
    applyDateFilter: document.getElementById('apply-date-filter'),
    sortOrder: document.getElementById('sort-order'),
    gridViewBtn: document.getElementById('grid-view'),
    carouselViewBtn: document.getElementById('carousel-view'),
    lightbox: document.getElementById('lightbox'),
    lightboxOverlay: document.getElementById('lightbox-overlay'),
    lightboxImage: document.getElementById('lightbox-image'),
    lightboxDate: document.getElementById('lightbox-date'),
    lightboxSize: document.getElementById('lightbox-size'),
    lightboxClose: document.getElementById('lightbox-close'),
    lightboxPrev: document.getElementById('lightbox-prev'),
    lightboxNext: document.getElementById('lightbox-next'),
    carouselImage: document.getElementById('carousel-image'),
    carouselDate: document.getElementById('carousel-date'),
    carouselCounter: document.getElementById('carousel-counter'),
    carouselPrev: document.getElementById('carousel-prev'),
    carouselNext: document.getElementById('carousel-next'),
    carouselThumbnails: document.getElementById('carousel-thumbnails')
};

// ==================== //
// API Functions
// ==================== //

async function fetchImages() {
    try {
        // If using demo data, load from local file
        if (API_CONFIG.useDemoData) {
            const response = await fetch('/n8n_example_output.json');
            if (!response.ok) {
                throw new Error(`Failed to load demo data: ${response.status}`);
            }
            const data = await response.json();
            return data;
        }
        
        // Otherwise, use the real API
        const response = await fetch(API_CONFIG.url, {
            method: 'GET',
            headers: API_CONFIG.headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching images:', error);
        elements.loading.innerHTML = `
            <div style="color: #ef4444;">
                <p style="font-size: 1.5rem; margin-bottom: 1rem;">⚠️ Error loading images</p>
                <p>${error.message}</p>
                <p style="margin-top: 1rem; font-size: 0.9rem;">
                    ${API_CONFIG.useDemoData 
                        ? 'Make sure n8n_example_output.json exists in the project directory.' 
                        : 'Check if the n8n webhook is active and the API URL is correct.'}
                </p>
            </div>
        `;
        return [];
    }
}

// ==================== //
// Utility Functions
// ==================== //

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatFileSize(bytes) {
    const kb = bytes / 1024;
    if (kb < 1024) {
        return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
}

function getImageUrl(image) {
    // In demo mode, use placeholder images
    if (API_CONFIG.useDemoData) {
        // Use picsum.photos with a seed based on the key for consistent images
        const seed = image.Key ? image.Key.substring(0, 8) : 'default';
        return `https://picsum.photos/seed/${seed}/800/800`;
    }
    
    // Check for various URL field names that n8n might use
    // AWS S3 node outputs: presignedUrl
    // Custom code might output: ImageUrl, imageUrl, url
    const urlFields = [
        'presignedUrl',   // AWS S3 Get Presigned URL node
        'ImageUrl',       // Custom field name (uppercase)
        'imageUrl',       // Custom field name (lowercase)
        'url',            // Generic field name
        'signedUrl'       // Alternative name
    ];
    
    for (const field of urlFields) {
        if (image[field]) {
            return image[field];
        }
    }
    
    // Fallback: try to fetch via proxy (if n8n webhook has a separate image endpoint)
    return `/api/image/${image.Key}`;
}

function isDateInRange(date, rangeType, customFrom = null, customTo = null) {
    const imageDate = new Date(date);
    const now = new Date();
    
    switch (rangeType) {
        case 'all':
            return true;
        
        case 'today':
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            return imageDate >= today;
        
        case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return imageDate >= weekAgo;
        
        case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return imageDate >= monthAgo;
        
        case 'custom':
            if (!customFrom || !customTo) return true;
            const fromDate = new Date(customFrom);
            const toDate = new Date(customTo);
            toDate.setHours(23, 59, 59, 999);
            return imageDate >= fromDate && imageDate <= toDate;
        
        default:
            return true;
    }
}

function sortImages(images, order) {
    return [...images].sort((a, b) => {
        const dateA = new Date(a.LastModified);
        const dateB = new Date(b.LastModified);
        return order === 'newest' ? dateB - dateA : dateA - dateB;
    });
}

function filterAndSortImages() {
    const filterType = elements.dateFilter.value;
    const sortOrder = elements.sortOrder.value;
    
    let filtered = allImages.filter(img => {
        if (filterType === 'custom') {
            return isDateInRange(
                img.LastModified,
                filterType,
                elements.dateFrom.value,
                elements.dateTo.value
            );
        }
        return isDateInRange(img.LastModified, filterType);
    });
    
    filteredImages = sortImages(filtered, sortOrder);
    updateImageCount();
    
    if (currentView === 'grid') {
        renderGalleryGrid();
    } else {
        renderCarousel();
    }
}

function updateImageCount() {
    const count = filteredImages.length;
    const total = allImages.length;
    elements.imageCount.textContent = count === total 
        ? `${count} image${count !== 1 ? 's' : ''}`
        : `${count} of ${total} image${total !== 1 ? 's' : ''}`;
}

// ==================== //
// Render Functions
// ==================== //

function renderGalleryGrid() {
    elements.galleryGrid.innerHTML = '';
    
    if (filteredImages.length === 0) {
        elements.galleryGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-secondary);">
                <p style="font-size: 1.5rem; margin-bottom: 1rem;">📭</p>
                <p>No images found matching your filters</p>
            </div>
        `;
        return;
    }
    
    filteredImages.forEach((image, index) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `
            <img src="${getImageUrl(image)}" 
                 alt="Image ${index + 1}" 
                 loading="lazy"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 400%22%3E%3Crect fill=%22%231e293b%22 width=%22400%22 height=%22400%22/%3E%3Ctext fill=%22%2394a3b8%22 font-family=%22Arial%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EImage unavailable%3C/text%3E%3C/svg%3E'">
            <div class="gallery-item-overlay">
                <div class="gallery-item-date">${formatDate(image.LastModified)}</div>
                <div class="gallery-item-size">${formatFileSize(parseInt(image.Size))}</div>
            </div>
        `;
        
        item.addEventListener('click', () => openLightbox(index));
        elements.galleryGrid.appendChild(item);
    });
}

function renderCarousel() {
    if (filteredImages.length === 0) {
        elements.carouselContainer.innerHTML = `
            <div class="container" style="text-align: center; padding: 4rem; color: var(--text-secondary);">
                <p style="font-size: 1.5rem; margin-bottom: 1rem;">📭</p>
                <p>No images found matching your filters</p>
            </div>
        `;
        return;
    }
    
    currentCarouselIndex = Math.min(currentCarouselIndex, filteredImages.length - 1);
    updateCarouselImage();
    renderCarouselThumbnails();
}

function updateCarouselImage() {
    const image = filteredImages[currentCarouselIndex];
    if (!image) return;
    
    elements.carouselImage.src = getImageUrl(image);
    elements.carouselDate.textContent = formatDate(image.LastModified);
    elements.carouselCounter.textContent = `${currentCarouselIndex + 1} / ${filteredImages.length}`;
    
    elements.carouselPrev.disabled = currentCarouselIndex === 0;
    elements.carouselNext.disabled = currentCarouselIndex === filteredImages.length - 1;
    
    // Update active thumbnail
    document.querySelectorAll('.carousel-thumbnail').forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentCarouselIndex);
    });
    
    // Scroll active thumbnail into view
    const activeThumbnail = elements.carouselThumbnails.children[currentCarouselIndex];
    if (activeThumbnail) {
        activeThumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
}

function renderCarouselThumbnails() {
    elements.carouselThumbnails.innerHTML = '';
    
    filteredImages.forEach((image, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'carousel-thumbnail';
        if (index === currentCarouselIndex) {
            thumb.classList.add('active');
        }
        
        thumb.innerHTML = `
            <img src="${getImageUrl(image)}" 
                 alt="Thumbnail ${index + 1}"
                 loading="lazy">
        `;
        
        thumb.addEventListener('click', () => {
            currentCarouselIndex = index;
            updateCarouselImage();
        });
        
        elements.carouselThumbnails.appendChild(thumb);
    });
}

// ==================== //
// Lightbox Functions
// ==================== //

function openLightbox(index) {
    currentLightboxIndex = index;
    updateLightboxImage();
    elements.lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    elements.lightbox.classList.remove('active');
    document.body.style.overflow = '';
}

function updateLightboxImage() {
    const image = filteredImages[currentLightboxIndex];
    if (!image) return;
    
    elements.lightboxImage.src = getImageUrl(image);
    elements.lightboxDate.textContent = `📅 ${formatDate(image.LastModified)}`;
    elements.lightboxSize.textContent = `📦 ${formatFileSize(parseInt(image.Size))} • Image ${currentLightboxIndex + 1} of ${filteredImages.length}`;
}

function navigateLightbox(direction) {
    currentLightboxIndex += direction;
    
    if (currentLightboxIndex < 0) {
        currentLightboxIndex = filteredImages.length - 1;
    } else if (currentLightboxIndex >= filteredImages.length) {
        currentLightboxIndex = 0;
    }
    
    updateLightboxImage();
}

function navigateCarousel(direction) {
    currentCarouselIndex += direction;
    
    if (currentCarouselIndex < 0) {
        currentCarouselIndex = 0;
    } else if (currentCarouselIndex >= filteredImages.length) {
        currentCarouselIndex = filteredImages.length - 1;
    }
    
    updateCarouselImage();
}

// ==================== //
// View Toggle Functions
// ==================== //

function switchView(view) {
    currentView = view;
    
    if (view === 'grid') {
        elements.galleryContainer.style.display = 'block';
        elements.carouselContainer.style.display = 'none';
        elements.gridViewBtn.classList.add('active');
        elements.carouselViewBtn.classList.remove('active');
        renderGalleryGrid();
    } else {
        elements.galleryContainer.style.display = 'none';
        elements.carouselContainer.style.display = 'block';
        elements.gridViewBtn.classList.remove('active');
        elements.carouselViewBtn.classList.add('active');
        renderCarousel();
    }
}

// ==================== //
// Event Listeners
// ==================== //

function setupEventListeners() {
    // Date filter
    elements.dateFilter.addEventListener('change', (e) => {
        if (e.target.value === 'custom') {
            elements.customDateRange.style.display = 'flex';
        } else {
            elements.customDateRange.style.display = 'none';
            filterAndSortImages();
        }
    });
    
    elements.applyDateFilter.addEventListener('click', filterAndSortImages);
    
    // Sort order
    elements.sortOrder.addEventListener('change', filterAndSortImages);
    
    // View toggle
    elements.gridViewBtn.addEventListener('click', () => switchView('grid'));
    elements.carouselViewBtn.addEventListener('click', () => switchView('carousel'));
    
    // Lightbox
    elements.lightboxClose.addEventListener('click', closeLightbox);
    elements.lightboxOverlay.addEventListener('click', closeLightbox);
    elements.lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
    elements.lightboxNext.addEventListener('click', () => navigateLightbox(1));
    
    // Carousel navigation
    elements.carouselPrev.addEventListener('click', () => navigateCarousel(-1));
    elements.carouselNext.addEventListener('click', () => navigateCarousel(1));
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (elements.lightbox.classList.contains('active')) {
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') navigateLightbox(-1);
            if (e.key === 'ArrowRight') navigateLightbox(1);
        } else if (currentView === 'carousel') {
            if (e.key === 'ArrowLeft') navigateCarousel(-1);
            if (e.key === 'ArrowRight') navigateCarousel(1);
        }
    });
}

// ==================== //
// Initialization
// ==================== //

async function init() {
    setupEventListeners();
    
    elements.loading.style.display = 'block';
    
    const images = await fetchImages();
    
    if (images && images.length > 0) {
        allImages = images;
        filteredImages = sortImages([...allImages], 'newest');
        
        elements.loading.style.display = 'none';
        updateImageCount();
        renderGalleryGrid();
    } else {
        elements.loading.innerHTML = `
            <div style="color: var(--text-secondary); padding: 4rem;">
                <p style="font-size: 1.5rem; margin-bottom: 1rem;">📭</p>
                <p>No images available</p>
            </div>
        `;
    }
}

// Start the application
init();

