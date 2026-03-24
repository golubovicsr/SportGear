$(document).ready(function() {
    loadProducts();
    loadFilters();
    setupEventListeners();
    loadFooter();
});

// Globalne promenljive
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPage = 6;

// Učitavanje proizvoda
function loadProducts() {
    $.ajax({
        url: DATA_PATH + 'products.json',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            allProducts = data;
            filteredProducts = [...allProducts];
            displayProducts();
            setupSearchAndFilters();
        },
        error: function(error) {
            console.error('Greška pri učitavanju proizvoda:', error);
            $('#productsContainer').html('<div class="alert alert-danger">Greška pri učitavanju proizvoda</div>');
        }
    });
}

// Učitavanje filtera
function loadFilters() {
    $.ajax({
        url: DATA_PATH + 'filters.json',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            displayFilters(data);
        },
        error: function(error) {
            console.error('Greška pri učitavanju filtera:', error);
        }
    });
}

// Prikaz filtera
function displayFilters(filters) {
    let filterHtml = '';
    
    // Kategorije
    filterHtml += '<h5 class="mt-3">Kategorije</h5>';
    filters.categories.forEach(cat => {
        filterHtml += `
            <div class="form-check">
                <input class="form-check-input filter-checkbox" type="checkbox" value="${cat.id}" data-filter="category">
                <label class="form-check-label">${cat.name}</label>
            </div>
        `;
    });
    
    // Sportovi
    filterHtml += '<h5 class="mt-3">Sport</h5>';
    filters.sports.forEach(sport => {
        filterHtml += `
            <div class="form-check">
                <input class="form-check-input filter-checkbox" type="checkbox" value="${sport.id}" data-filter="sport">
                <label class="form-check-label">${sport.name}</label>
            </div>
        `;
    });
    
    // Brendovi
    filterHtml += '<h5 class="mt-3">Brend</h5>';
    filters.brands.forEach(brand => {
        filterHtml += `
            <div class="form-check">
                <input class="form-check-input filter-checkbox" type="checkbox" value="${brand.id}" data-filter="brand">
                <label class="form-check-label">${brand.name}</label>
            </div>
        `;
    });
    
    // Veličine
    filterHtml += '<h5 class="mt-3">Veličina</h5>';
    filters.sizes.forEach(size => {
        filterHtml += `
            <div class="form-check form-check-inline">
                <input class="form-check-input filter-checkbox" type="checkbox" value="${size.id}" data-filter="size">
                <label class="form-check-label">${size.name}</label>
            </div>
        `;
    });
    
    $('#filterContainer').html(filterHtml);
}

// Prikaz proizvoda
function displayProducts() {
    let start = (currentPage - 1) * itemsPerPage;
    let end = start + itemsPerPage;
    let productsToShow = filteredProducts.slice(start, end);
    
    let html = '';
    productsToShow.forEach(product => {
        html += generateProductCard(product);
    });
    
    $('#productsContainer').html(html);
    displayPagination();
    
    // Dodavanje event listenera za kartice
    $('.product-card').click(function() {
        let productId = $(this).data('id');
        showProductModal(productId);
    });
    
    $('.add-to-cart-btn').click(function(e) {
        e.stopPropagation();
        let productId = $(this).data('id');
        addToCart(productId);
    });
}

// Generisanje HTML-a za proizvod
function generateProductCard(product) {
    let priceHtml = '';
    if (product.price.old) {
        priceHtml = `
            <span class="old-price">${formatPrice(product.price.old)}</span>
            <span class="new-price">${formatPrice(product.price.new)}</span>
        `;
    } else {
        priceHtml = `<span class="regular-price">${formatPrice(product.price.new)}</span>`;
    }
    
    let badges = '';
    if (product.new) {
        badges += '<span class="badge-new">Novo</span>';
    }
    if (product.price.old) {
        let discount = Math.round(((product.price.old - product.price.new) / product.price.old) * 100);
        badges += `<span class="badge-discount">-${discount}%</span>`;
    }
    
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= product.stars) {
            stars += '<i class="fa-solid fa-star"></i>';
        } else {
            stars += '<i class="fa-regular fa-star"></i>';
        }
    }
    
    return `
        <div class="col-md-6 col-lg-4">
            <div class="product-card card" data-id="${product.id}">
                <div class="product-image">
                    <img src="${SRC_PATH + product.src}" alt="${product.description}" class="card-img-top">
                    ${badges}
                </div>
                <div class="card-body">
                    <span class="badge-sport">${product.brand}</span>
                    <h6 class="card-title">${product.description}</h6>
                    <div class="stars">${stars}</div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>${priceHtml}</div>
                        <button class="add-to-cart-btn btn btn-sm" data-id="${product.id}">
                            <i class="fa-solid fa-cart-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Prikaz modala sa detaljima proizvoda
function showProductModal(productId) {
    let product = allProducts.find(p => p.id == productId);
    if (!product) return;
    
    $('#modalTitle').text(product.description);
    
    let sizesHtml = '<p><strong>Dostupne veličine:</strong> ';
    product.sizes.forEach(size => {
        sizesHtml += `<span class="badge bg-secondary me-1">${size}</span>`;
    });
    sizesHtml += '</p>';
    
    $('#modalBody').html(`
        <img src="${SRC_PATH + product.src}" class="img-fluid mb-3" alt="${product.description}">
        <p><strong>Brend:</strong> ${product.brand}</p>
        <p><strong>Sport:</strong> ${product.sport}</p>
        <p><strong>Kategorija:</strong> ${product.category}</p>
        <p><strong>Cena:</strong> ${formatPrice(product.price.new)}</p>
        ${sizesHtml}
    `);
    
    $('#modalAddToCart').data('id', productId);
    $('#productModal').modal('show');
}

// Dodavanje u korpu
function addToCart(productId) {
    let product = allProducts.find(p => p.id == productId);
    if (!product) return;
    
    let cart = getFromLocalStorage('cart') || [];
    let price = product.price.new;
    
    cart.push({
        id: product.id,
        name: product.description,
        price: price,
        src: product.src,
        quantity: 1
    });
    
    setLocalStorage('cart', cart);
    updateCartInfo();
    
    // Toast poruka
    showToast('Proizvod dodat u korpu!');
    
    $('#productModal').modal('hide');
}

// Toast poruka (već postoji u main.js, ali ostavi za svaki slučaj)
function showToast(message) {
    if ($('#toastMessage').length === 0) {
        $('body').append('<div id="toastMessage" class="toast-success"></div>');
    }
    $('#toastMessage').text(message).fadeIn().delay(2000).fadeOut();
}

// Postavljanje event listenera za pretragu i filtere
function setupEventListeners() {
    $('#searchInput').on('keyup', function() {
        applyFilters();
    });
    
    $('#sortSelect').change(function() {
        applyFilters();
    });
    
    $(document).on('change', '.filter-checkbox', function() {
        applyFilters();
    });
}

// Primena filtera i sortiranja
function applyFilters() {
    let searchTerm = $('#searchInput').val().toLowerCase();
    let selectedCategories = [];
    let selectedSports = [];
    let selectedBrands = [];
    let selectedSizes = [];
    
    // Skupljanje selektovanih filtera
    $('.filter-checkbox:checked').each(function() {
        let filterType = $(this).data('filter');
        let value = $(this).val();
        
        switch(filterType) {
            case 'category':
                selectedCategories.push(value);
                break;
            case 'sport':
                selectedSports.push(value);
                break;
            case 'brand':
                selectedBrands.push(value);
                break;
            case 'size':
                selectedSizes.push(value);
                break;
        }
    });
    
    // Filtriranje
    filteredProducts = allProducts.filter(product => {
        // Pretraga po nazivu
        let matchesSearch = product.description.toLowerCase().includes(searchTerm);
        
        // Filtriranje po kategoriji
        let matchesCategory = selectedCategories.length === 0 || 
            selectedCategories.includes(product.category.toLowerCase());
        
        // Filtriranje po sportu
        let matchesSport = selectedSports.length === 0 || 
            selectedSports.includes(product.sport.toLowerCase());
        
        // Filtriranje po brendu
        let matchesBrand = selectedBrands.length === 0 || 
            selectedBrands.includes(product.brand.toLowerCase());
        
        // Filtriranje po veličini
        let matchesSize = selectedSizes.length === 0 || 
            product.sizes.some(size => selectedSizes.includes(size.toString().toLowerCase()));
        
        return matchesSearch && matchesCategory && matchesSport && matchesBrand && matchesSize;
    });
    
    // Sortiranje
    let sortType = $('#sortSelect').val();
    switch(sortType) {
        case '1': // Cena rastuće
            filteredProducts.sort((a, b) => a.price.new - b.price.new);
            break;
        case '2': // Cena opadajuće
            filteredProducts.sort((a, b) => b.price.new - a.price.new);
            break;
        case '3': // Naziv A-Š
            filteredProducts.sort((a, b) => a.description.localeCompare(b.description));
            break;
        case '4': // Naziv Š-A
            filteredProducts.sort((a, b) => b.description.localeCompare(a.description));
            break;
        case '5': // Popularnost (po zvezdicama)
            filteredProducts.sort((a, b) => b.stars - a.stars);
            break;
    }
    
    currentPage = 1;
    displayProducts();
}

// Prikaz paginacije
function displayPagination() {
    let totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    let paginationHtml = '';
    
    if (currentPage > 1) {
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${currentPage - 1}">Prethodna</a></li>`;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        paginationHtml += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
    }
    
    if (currentPage < totalPages) {
        paginationHtml += `<li class="page-item"><a class="page-link" href="#" data-page="${currentPage + 1}">Sledeća</a></li>`;
    }
    
    $('#pagination').html(paginationHtml);
    
    // Event listener za paginaciju
    $('.page-link').click(function(e) {
        e.preventDefault();
        currentPage = parseInt($(this).data('page'));
        displayProducts();
    });
}