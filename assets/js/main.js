const DATA_PATH = 'assets/data/';
const SRC_PATH = 'assets/img/';

function formatPrice(price) {
    return price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + ' RSD';
}
$(document).ready(function() {
    console.log('SportGear sajt učitan');

    loadNavigation();
    updateCartInfo();
    loadFooter();
});
function loadNavigation() {
    $.ajax({
        url: DATA_PATH + 'navigation.json',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            let menuHtml = '';
            let currentPage = window.location.pathname.split('/').pop();
            
            data.menu.forEach(item => {
                let activeClass = (item.href === currentPage) ? 'active' : '';
                menuHtml += `<li class="nav-item">
                    <a class="nav-link ${activeClass}" href="${item.href}">${item.name}</a>
                </li>`;
            });
            $('#dynamicMenu').html(menuHtml);
        },
        error: function(error) {
            $('#dynamicMenu').html('<li class="nav-item"><span class="nav-link text-danger">Greška u navigaciji</span></li>');
        }
    });
}
function setLocalStorage(name, data) {
    localStorage.setItem(name, JSON.stringify(data));
}

function getFromLocalStorage(name) {
    let data = localStorage.getItem(name);
    return data ? JSON.parse(data) : null;
}
function updateCartInfo() {
    let cart = getFromLocalStorage('cart') || [];
    $('#cartCount').text(cart.length);
    let total = 0;
    cart.forEach(item => {
        total += parseFloat(item.price) * (item.quantity || 1);
    });
    $('#totalPrice').text(formatPrice(total));
}
let path = window.location.pathname;
if (path.includes('index.html') || path.endsWith('/SportGear/') || path.endsWith('/SportGear')) {
    loadIndexData();
}

function loadIndexData() {
    $.ajax({
        url: DATA_PATH + 'products.json',
        method: 'GET',
        dataType: 'json',
        success: function(products) {
            displayCarousel();
            displayNewArrivals(products);
            displayBestSellers(products);
        },
        error: function(error) {
            console.error('Greška pri učitavanju proizvoda:', error);
            showUserError('Došlo je do greške pri učitavanju proizvoda.');
        }
    });

    $.ajax({
        url: DATA_PATH + 'benefits.json',
        method: 'GET',
        dataType: 'json',
        success: function(benefits) {
            displayBenefits(benefits);
        },
        error: function(error) {
            console.error('Greška pri učitavanju benefita:', error);
        }
    });
    $.ajax({
        url: DATA_PATH + 'customers.json',
        method: 'GET',
        dataType: 'json',
        success: function(customers) {
            displayCustomers(customers);
        },
        error: function(error) {
            console.error('Greška pri učitavanju kupaca:', error);
        }
    });

    loadFooter();
}
function displayCarousel() {
    let slides = [
        {
            src: 'slide1.jpg',
            alt: 'Sportska oprema',
            title: 'Vrhunski kvalitet',
            text: 'Oprema za sve sportove'
        },
        {
            src: 'slide2.jpg',
            alt: 'Patike',
            title: 'Najbolji brendovi',
            text: 'Nike, Adidas, Puma'
        },
        {
            src: 'slide3.jpg',
            alt: 'Dresovi',
            title: 'Za prave šampione',
            text: 'Original dresovi'
        }
    ];

    let carouselInner = $('#carouselInner');
    let indicators = $('.carousel-indicators');
    
    indicators.empty();
    carouselInner.empty();

    slides.forEach((slide, index) => {
        indicators.append(`
            <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="${index}" 
                ${index === 0 ? 'class="active"' : ''}>
            </button>
        `);

        carouselInner.append(`
            <div class="carousel-item ${index === 0 ? 'active' : ''}">
                <img src="${SRC_PATH + slide.src}" class="d-block w-100" alt="${slide.alt}" style="height: 500px; object-fit: cover;">
                <div class="carousel-caption d-none d-md-block bg-dark bg-opacity-50 p-3 rounded">
                    <h3>${slide.title}</h3>
                    <p>${slide.text}</p>
                </div>
            </div>
        `);
    });
}
function displayBenefits(benefits) {
    let html = '';
    benefits.forEach(benefit => {
        html += `
            <div class="col-md-3 mb-3">
                <div class="benefit-item">
                    <i class="${benefit.icon}"></i>
                    <h5>${benefit.title}</h5>
                    <p class="text-muted">${benefit.description}</p>
                </div>
            </div>
        `;
    });
    $('#benefitsContainer').html(html);
}
function displayNewArrivals(products) {
    let newProducts = products.filter(p => p.new === true).slice(0, 4);
    let html = '';
    
    newProducts.forEach(product => {
        html += generateProductCardSimple(product);
    });
    
    $('#newArrivals').html(html);
    
    $('.product-card').click(function() {
        let productId = $(this).data('id');
        showSimpleProductModal(productId, products);
    });
}
function displayBestSellers(products) {
    let bestSellers = [...products].sort((a, b) => b.stars - a.stars).slice(0, 4);
    let html = '';
    
    bestSellers.forEach(product => {
        html += generateProductCardSimple(product);
    });
    
    $('#bestSellers').html(html);
    
    $('.product-card').click(function() {
        let productId = $(this).data('id');
        showSimpleProductModal(productId, products);
    });
}
function generateProductCardSimple(product) {
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
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= product.stars) {
            stars += '<i class="fa-solid fa-star"></i>';
        } else {
            stars += '<i class="fa-regular fa-star"></i>';
        }
    }
    
    return `
        <div class="col-md-3 col-sm-6 mb-4">
            <div class="product-card card h-100" data-id="${product.id}">
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
                        <button class="add-to-cart-btn-index btn btn-sm" data-id="${product.id}">
                            <i class="fa-solid fa-cart-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
function showSimpleProductModal(productId, products) {
    let product = products.find(p => p.id == productId);
    if (!product) return;
    
    if ($('#productModalIndex').length === 0) {
        $('body').append(`
            <div class="modal fade" id="productModalIndex" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"></h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body"></div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Zatvori</button>
                            <button type="button" class="btn btn-success" id="modalAddToCartIndex">Dodaj u korpu</button>
                        </div>
                    </div>
                </div>
            </div>
        `);
    }
    
    $('#productModalIndex .modal-title').text(product.description);
    
    let sizesHtml = '<p><strong>Dostupne veličine:</strong> ';
    product.sizes.forEach(size => {
        sizesHtml += `<span class="badge bg-secondary me-1">${size}</span>`;
    });
    sizesHtml += '</p>';
    
    $('#productModalIndex .modal-body').html(`
        <img src="${SRC_PATH + product.src}" class="img-fluid mb-3" alt="${product.description}">
        <p><strong>Brend:</strong> ${product.brand}</p>
        <p><strong>Sport:</strong> ${product.sport}</p>
        <p><strong>Cena:</strong> ${formatPrice(product.price.new)}</p>
        ${sizesHtml}
    `);
    
    $('#modalAddToCartIndex').data('id', productId);
    $('#productModalIndex').modal('show');
    
    $('#modalAddToCartIndex').off('click').on('click', function() {
        addToCartFromIndex(productId, products);
    });
}
function addToCartFromIndex(productId, products) {
    let product = products.find(p => p.id == productId);
    if (!product) return;
    
    let cart = getFromLocalStorage('cart') || [];
    
    cart.push({
        id: product.id,
        name: product.description,
        price: product.price.new,
        src: product.src,
        quantity: 1
    });
    
    setLocalStorage('cart', cart);
    updateCartInfo();
    showToast('Proizvod dodat u korpu!');
    
    $('#productModalIndex').modal('hide');
}
$(document).on('click', '.add-to-cart-btn-index', function(e) {
    e.stopPropagation();
    let productId = $(this).data('id');
    
    $.ajax({
        url: DATA_PATH + 'products.json',
        method: 'GET',
        dataType: 'json',
        success: function(products) {
            addToCartFromIndex(productId, products);
        }
    });
});
function displayCustomers(customers) {
    let html = '';
    customers.forEach(customer => {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= customer.stars) {
                stars += '<i class="fa-solid fa-star text-warning"></i>';
            } else {
                stars += '<i class="fa-regular fa-star text-warning"></i>';
            }
        }
        
        html += `
            <div class="col-md-4 mb-4">
                <div class="card h-100 text-center p-3">
                    <img src="${SRC_PATH + customer.img}" class="rounded-circle mx-auto mb-3" alt="${customer.name}" style="width: 100px; height: 100px; object-fit: cover;">
                    <h5>${customer.name}</h5>
                    <div class="stars mb-2">${stars}</div>
                    <p class="text-muted fst-italic">"${customer.comment}"</p>
                </div>
            </div>
        `;
    });
    $('#customersContainer').html(html);
}
$(document).ready(function() {
    $('#readMoreBtn').click(function() {
        $('#hiddenText').slideToggle(500);
        
        if ($(this).text() === 'Read More') {
            $(this).text('Read Less');
        } else {
            $(this).text('Read More');
        }
    });
});
function loadFooter() {
    $.ajax({
        url: DATA_PATH + 'footer.json',
        method: 'GET',
        dataType: 'json',
        success: function(data) {
            displayFooter(data);
        },
        error: function(error) {
            console.error('Greška pri učitavanju footer-a:', error);
        }
    });
}

function displayFooter(data) {
    let html = `
        <div class="row">
            <div class="col-lg-4 mb-4">
                <h5>SportGear</h5>
                <p>Vaš pouzdani partner za sportsku opremu i rekvizite.</p>
                <div class="social-links">
    `;
    
    data.social.forEach(social => {
        html += `<a href="${social.href}" class="text-light me-2 fs-5" target="_blank"><i class="${social.icon}"></i></a>`;
    });
    
    html += `
                </div>
            </div>
            <div class="col-lg-4 mb-4">
                <h5>Kategorije proizvoda</h5>
                <ul class="list-unstyled">
    `;
    
    data.products.forEach(product => {
        html += `<li><a href="shop.html" class="footer-link">${product}</a></li>`;
    });
    
    html += `
                </ul>
            </div>
            <div class="col-lg-4 mb-4">
                <h5>Kontakt</h5>
                <ul class="list-unstyled">
    `;
    
    data.contact.forEach(contact => {
        html += `<li><i class="${contact.icon} me-2"></i>${contact.text}</li>`;
    });
    
    let year = new Date().getFullYear();
    html += `
                </ul>
            </div>
        </div>
        <div class="text-center py-3 border-top border-secondary">
            <p class="mb-0">&copy; ${year} SportGear. Sva prava zadržana. 
                <a href="autor.html" class="footer-link">O autoru</a> | 
                <a href="documentation.pdf" class="footer-link">Dokumentacija</a>
            </p>
        </div>
    `;
    
    $('#footerContent').html(html);
}
function showToast(message) {
    // Proveri da li već postoji toast element
    if ($('#toastMessage').length === 0) {
        $('body').append('<div id="toastMessage" class="toast-success"></div>');
    }
    $('#toastMessage').text(message).fadeIn().delay(2000).fadeOut();
}
function showUserError(message) {
    let toast = `
        <div style="position: fixed; top: 20px; right: 20px; z-index: 9999;">
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        </div>
    `;
    $('body').append(toast);
    
    setTimeout(() => {
        $('.alert').alert('close');
    }, 5000);
}
function safelyParseJSON(jsonString) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Greška pri parsiranju JSON-a:', error);
        showUserError('Došlo je do greške pri obradi podataka.');
        return null;
    }
}
function formatDate(date) {
    let day = date.getDate().toString().padStart(2, '0');
    let month = (date.getMonth() + 1).toString().padStart(2, '0');
    let year = date.getFullYear();
    return `${day}.${month}.${year}.`;
}
