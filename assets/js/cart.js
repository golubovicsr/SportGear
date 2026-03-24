
$(document).ready(function() {
    displayCart();
    setupCartEvents();
    calculateDeliveryDate();
    loadFooter();
});

// Globalne promenljive
let allProducts = [];

// Učitavanje proizvoda za prikaz slika
$.ajax({
    url: DATA_PATH + 'products.json',
    method: 'GET',
    dataType: 'json',
    success: function(data) {
        allProducts = data;
        displayCart(); // Ponovo prikazujemo korpu sa slikama
    }
});

// Prikaz korpe
function displayCart() {
    let cart = getFromLocalStorage('cart') || [];
    
    if (cart.length === 0) {
        $('#cartContent').html(`
            <div class="text-center py-5">
                <i class="fa-solid fa-cart-shopping fa-4x text-muted mb-3"></i>
                <h3>Vaša korpa je prazna</h3>
                <p class="text-muted">Izgleda da još uvek niste dodali proizvode u korpu.</p>
                <a href="shop.html" class="btn btn-success mt-3">Nastavi kupovinu</a>
            </div>
        `);
        return;
    }
    
    let total = 0;
    let tableHtml = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead class="bg-light">
                    <tr>
                        <th scope="col">Proizvod</th>
                        <th scope="col">Cena</th>
                        <th scope="col">Količina</th>
                        <th scope="col">Ukupno</th>
                        <th scope="col"></th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    cart.forEach((item, index) => {
        // Pronađi sliku iz products.json ako postoji
        let product = allProducts.find(p => p.id == item.id);
        let imageSrc = product ? SRC_PATH + product.src : SRC_PATH + 'placeholder.jpg';
        let itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        tableHtml += `
            <tr data-index="${index}">
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${imageSrc}" alt="${item.name}" class="cart-item-image me-3">
                        <div>
                            <h6 class="mb-0">${item.name}</h6>
                            <small class="text-muted">ID: ${item.id}</small>
                        </div>
                    </div>
                </td>
                <td class="align-middle">${formatPrice(item.price)}</td>
                <td class="align-middle" style="width: 150px;">
                    <div class="input-group">
                        <button class="btn btn-outline-secondary decrease-qty" type="button">-</button>
                        <input type="number" class="form-control text-center item-qty" value="${item.quantity}" min="1" max="10" data-index="${index}">
                        <button class="btn btn-outline-secondary increase-qty" type="button">+</button>
                    </div>
                </td>
                <td class="align-middle item-total">${formatPrice(itemTotal)}</td>
                <td class="align-middle">
                    <button class="delete-item" data-index="${index}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tableHtml += `
                </tbody>
            </table>
        </div>
        
        <div class="row mt-4">
            <div class="col-md-6">
                <button class="btn btn-outline-danger" id="clearCart">
                    <i class="fa-solid fa-trash me-2"></i>Isprazni korpu
                </button>
                <a href="shop.html" class="btn btn-outline-success ms-2">
                    <i class="fa-solid fa-arrow-left me-2"></i>Nastavi kupovinu
                </a>
            </div>
            <div class="col-md-6">
                <div class="card bg-light">
                    <div class="card-body">
                        <h5 class="card-title">Ukupno za plaćanje</h5>
                        <h3 class="text-success" id="cartTotal">${formatPrice(total)}</h3>
                        <button class="btn btn-success w-100 mt-3" id="orderBtn" ${cart.length === 0 ? 'disabled' : ''}>
                            <i class="fa-solid fa-truck me-2"></i>Poruči
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('#cartContent').html(tableHtml);
    updateCartInfo(); // Ažuriraj info u header-u
}

// Postavljanje event listenera za korpu
function setupCartEvents() {
    // Smanjenje količine
    $(document).on('click', '.decrease-qty', function() {
        let input = $(this).siblings('.item-qty');
        let currentVal = parseInt(input.val());
        if (currentVal > 1) {
            input.val(currentVal - 1).trigger('change');
        }
    });
    
    // Povećanje količine
    $(document).on('click', '.increase-qty', function() {
        let input = $(this).siblings('.item-qty');
        let currentVal = parseInt(input.val());
        if (currentVal < 10) {
            input.val(currentVal + 1).trigger('change');
        }
    });
    
    // Promena količine
    $(document).on('change', '.item-qty', function() {
        let index = $(this).data('index');
        let newQty = parseInt($(this).val());
        
        if (newQty < 1) newQty = 1;
        if (newQty > 10) newQty = 10;
        $(this).val(newQty);
        
        let cart = getFromLocalStorage('cart');
        if (cart && cart[index]) {
            cart[index].quantity = newQty;
            setLocalStorage('cart', cart);
            
            // Ažuriraj total za ovaj red
            let itemTotal = cart[index].price * newQty;
            $(this).closest('tr').find('.item-total').text(formatPrice(itemTotal));
            
            // Ažuriraj ukupan iznos
            updateCartTotal();
            updateCartInfo();
        }
    });
    
    // Brisanje pojedinačnog proizvoda
    $(document).on('click', '.delete-item', function() {
        let index = $(this).data('index');
        let cart = getFromLocalStorage('cart');
        
        if (cart) {
            cart.splice(index, 1);
            setLocalStorage('cart', cart);
            displayCart();
            updateCartInfo();
            showToast('Proizvod uklonjen iz korpe');
        }
    });
    
    // Brisanje cele korpe - POPRAVLJENO!
    $(document).on('click', '#clearCart', function() {
        localStorage.removeItem('cart');
        displayCart();
        updateCartInfo();
        showToast('Korpa je ispražnjena');
});
    
    // Otvaranje modala za porudžbinu
    $(document).on('click', '#orderBtn', function() {
        $('#orderModal').modal('show');
    });
    
    // Slanje porudžbine
    $('#submitOrder').click(function() {
        if (validateForm()) {
            showToast('Porudžbina uspešno poslata!');
            localStorage.removeItem('cart');
            $('#orderModal').modal('hide');
            displayCart();
            updateCartInfo();
            
            $('#orderForm')[0].reset();
            $('.border-danger').removeClass('border-danger');
            $('.border-success').removeClass('border-success');
            $('small.text-danger').text('');
        }
    });
}

// Ažuriranje ukupne cene u korpi
function updateCartTotal() {
    let cart = getFromLocalStorage('cart') || [];
    let total = 0;
    
    cart.forEach(item => {
        total += item.price * item.quantity;
    });
    
    $('#cartTotal').text(formatPrice(total));
}

// Računanje datuma isporuke (trenutni datum + 3 dana)
function calculateDeliveryDate() {
    let today = new Date();
    let deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 3);
    
    let day = deliveryDate.getDate();
    let month = deliveryDate.getMonth() + 1;
    let year = deliveryDate.getFullYear();
    
    let formattedDate = `${day}.${month}.${year}.`;
    $('#deliveryDate').val(formattedDate);
}

// Regex validacija
const regexIme = /^[A-Z][a-z]{2,}$/;
const regexEmail = /^[a-z0-9]{3,}@(gmail\.com|yahoo\.com|edu\.rs)$/;
const regexTelefon = /^06[0-9]\/[0-9]{7}$/;

function validateForm() {
    let isValid = true;
    
    // Validacija imena
    let firstName = $('#firstName').val();
    if (!regexIme.test(firstName)) {
        $('#firstName').addClass('border-danger').removeClass('border-success');
        $('#firstName').next().text('Ime mora početi velikim slovom i imati bar 3 slova');
        isValid = false;
    } else {
        $('#firstName').removeClass('border-danger').addClass('border-success');
        $('#firstName').next().text('');
    }
    
    // Validacija prezimena
    let lastName = $('#lastName').val();
    if (!regexIme.test(lastName)) {
        $('#lastName').addClass('border-danger').removeClass('border-success');
        $('#lastName').next().text('Prezime mora početi velikim slovom i imati bar 3 slova');
        isValid = false;
    } else {
        $('#lastName').removeClass('border-danger').addClass('border-success');
        $('#lastName').next().text('');
    }
    
    // Validacija email-a
    let email = $('#email').val();
    if (!regexEmail.test(email)) {
        $('#email').addClass('border-danger').removeClass('border-success');
        $('#email').next().text('Format: example@gmail.com / yahoo.com / edu.rs');
        isValid = false;
    } else {
        $('#email').removeClass('border-danger').addClass('border-success');
        $('#email').next().text('');
    }
    
    // Validacija telefona
    let phone = $('#phone').val();
    if (!regexTelefon.test(phone)) {
        $('#phone').addClass('border-danger').removeClass('border-success');
        $('#phone').next().text('Format: 061/1234567');
        isValid = false;
    } else {
        $('#phone').removeClass('border-danger').addClass('border-success');
        $('#phone').next().text('');
    }
    
    // Validacija načina dostave
    if ($('#delivery').val() === '') {
        $('#delivery').addClass('border-danger').removeClass('border-success');
        $('#delivery').next().text('Izaberite način dostave');
        isValid = false;
    } else {
        $('#delivery').removeClass('border-danger').addClass('border-success');
        $('#delivery').next().text('');
    }
    
    return isValid;
}

// Toast poruka
function showToast(message) {
    if ($('#toastMessage').length === 0) {
        $('body').append('<div id="toastMessage" class="toast-success"></div>');
    }
    $('#toastMessage').text(message).fadeIn().delay(2000).fadeOut();
}