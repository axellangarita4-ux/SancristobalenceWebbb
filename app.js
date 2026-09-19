// ==========================================
// CONFIGURACIÓN DE JSONBIN (Pon tus credenciales aquí)
// ==========================================
const BIN_ID = 6aaea510ffd5d1605319a9a1;
const API_KEY = $2a$10$1S.qtJVmmXqnFXhX2AsjUuyFwfabnb8BF0QZZmX8.R0ThT9mpD0ZK;

let products = [];
let cart = [];
let currentFilter = 'todos';

// 1. CARGAR PRODUCTOS DESDE LA NUBE (Para ti y para todos los clientes)
async function loadProducts() {
    try {
        let response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
            headers: {
                'X-Master-Key': API_KEY
            }
        });
        let data = await response.json();
        products = data.record.products || window.initialProducts || [];
        renderProducts();
        renderAdminProducts();
    } catch (error) {
        console.error("Error cargando de la nube, usando respaldo local:", error);
        products = window.initialProducts || [];
        renderProducts();
        renderAdminProducts();
    }
}

// 2. GUARDAR PRODUCTOS EN LA NUBE (Cuando edites algo desde el Admin)
async function saveProductsToCloud() {
    try {
        let response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': API_KEY
            },
            body: JSON.stringify({ products: products })
        });
        
        if (response.ok) {
            alert("¡Cambios guardados en la nube y reflejados para todos los clientes!");
            loadProducts(); // Recargar catálogo actualizado
        } else {
            alert("Hubo un error al guardar en la nube.");
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("Error de red al intentar guardar.");
    }
}

// 3. RENDERIZAR PRODUCTOS EN EL CATÁLOGO CLIENTE
function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    let filtered = products;
    if (currentFilter !== 'todos') {
        filtered = products.filter(p => p.category === currentFilter);
    }

    if (filtered.length === 0) {
        grid.innerHTML = `<p class="text-slate-500 col-span-full text-center py-8">No hay productos en esta categoría.</p>`;
        return;
    }

    grid.innerHTML = filtered.map(p => `
        <div class="bg-white rounded-2xl shadow-md overflow-hidden border border-amber-100 flex flex-col justify-between transition hover:shadow-lg">
            <div>
                <img src="${p.image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500'}" alt="${p.name}" class="w-full h-48 object-cover">
                <div class="p-4">
                    <span class="text-xs font-bold text-amber-700 uppercase tracking-wider">${p.category}</span>
                    <h3 class="font-bold text-lg text-slate-800 mt-1 mb-1">${p.name}</h3>
                    <p class="text-slate-600 text-xs line-clamp-2">${p.description || ''}</p>
                </div>
            </div>
            <div class="p-4 pt-0 flex items-center justify-between mt-2">
                <span class="text-xl font-black text-amber-900">$${Number(p.price).toFixed(2)}</span>
                <button onclick="addToCart(${p.id})" class="bg-amber-700 hover:bg-amber-800 text-white px-3 py-2 rounded-xl text-sm font-bold shadow transition flex items-center">
                    <i class="fa-solid fa-plus mr-1"></i> Agregar
                </button>
            </div>
        </div>
    `).join('');
}

// 4. FILTRAR POR CATEGORÍA
function filterCategory(cat) {
    currentFilter = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.remove('bg-amber-700', 'text-white');
        btn.classList.add('bg-white', 'text-amber-800');
    });
    event.target.classList.remove('bg-white', 'text-amber-800');
    event.target.classList.add('bg-amber-700', 'text-white');
    renderProducts();
}

// 5. FUNCIONES DEL CARRITO
function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.classList.toggle('hidden');
}

function addToCart(id) {
    let prod = products.find(p => p.id === id);
    let existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...prod, qty: 1 });
    }
    updateCartUI();
}

function updateCartUI() {
    let counter = document.getElementById('cart-counter');
    let totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    counter.innerText = totalItems;

    let container = document.getElementById('cart-items');
    if (cart.length === 0) {
        container.innerHTML = `<p class="text-slate-500 text-center py-8">Tu carrito está vacío</p>`;
        document.getElementById('cart-total').innerText = '$0.00';
        return;
    }

    container.innerHTML = cart.map(item => `
        flex justify-between items-center bg-amber-50 p-3 rounded-xl border border-amber-200">
            <div>
                <h4 class="font-bold text-sm text-slate-800">${item.name}</h4>
                <p class="text-xs text-amber-700">$${Number(item.price).toFixed(2)} c/u</p>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="changeQty(${item.id}, -1)" class="bg-slate-200 px-2 py-1 rounded text-xs font-bold">-</button>
                <span class="text-sm font-bold">${item.qty}</span>
                <button onclick="changeQty(${item.id}, 1)" class="bg-slate-200 px-2 py-1 rounded text-xs font-bold">+</button>
            </div>
        </div>
    `).join('');

    let total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    document.getElementById('cart-total').innerText = `$${total.toFixed(2)}`;
}

function changeQty(id, delta) {
    let item = cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    updateCartUI();
}

// 6. ENVIAR PEDIDO POR WHATSAPP (Ajustado con tu número y nombre con C)
function sendWhatsAppOrder() {
    let name = document.getElementById('client-name').value.trim();
    let delivery = document.getElementById('delivery-method').value;
    let address = document.getElementById('client-address').value.trim();
    let payment = document.getElementById('payment-method').value;

    if (!name) {
        alert("Por favor ingresa tu nombre y apellido.");
        return;
    }
    if (cart.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    let message = `🍞 *NUEVO PEDIDO - LA SAN CRISTÓBALENSE* 🍞\n\n`;
    message += `👤 *Cliente:* ${name}\n`;
    message += `🚚 *Método:* ${delivery}\n`;
    if (delivery === 'Delivery a Domicilio') {
        message += `📍 *Dirección:* ${address || 'No especificada'}\n`;
    }
    message += `💳 *Pago:* ${payment}\n\n`;
    message += `🛒 *Detalle del pedido:*\n`;

    cart.forEach(item => {
        message += `- ${item.qty}x ${item.name} ($${(item.price * item.qty).toFixed(2)})\n`;
    });

    let total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    message += `\n💰 *TOTAL A PAGAR:* $${total.toFixed(2)}`;

    let phone = "584248787471";
    let url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// 7. PANEL DE ADMINISTRACIÓN
function openAdminLogin() {
    let pass = prompt("Contraseña de Administrador:");
    if (pass === "1234") { // Puedes cambiar la contraseña aquí si quieres
        document.getElementById('admin-modal').classList.remove('hidden');
        renderAdminProducts();
    } else if (pass !== null) {
        alert("Contraseña incorrecta");
    }
}

function closeAdmin() {
    document.getElementById('admin-modal').classList.add('hidden');
    resetAdminForm();
}

function renderAdminProducts() {
    const list = document.getElementById('admin-products-list');
    if (!list) return;

    if (products.length === 0) {
        list.innerHTML = `<p class="text-slate-500 text-sm">No hay productos registrados.</p>`;
        return;
    }

    list.innerHTML = products.map(p => `
        <div class="flex justify-between items-center bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
            <div class="flex items-center space-x-3">
                <img src="${p.image}" class="w-10 h-10 object-cover rounded-lg">
                <div>
                    <h5 class="font-bold text-sm text-slate-800">${p.name}</h5>
                    <p class="text-xs text-amber-700">$${Number(p.price).toFixed(2)} - <span class="capitalize">${p.category}</span></p>
                </div>
            </div>
            <div class="flex space-x-2">
                <button onclick="editProduct(${p.id})" class="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1 rounded-lg text-xs font-bold">Editar</button>
                <button onclick="deleteProduct(${p.id})" class="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-xs font-bold">Eliminar</button>
            </div>
        </div>
    `).join('');
}

function saveProduct() {
    let id = document.getElementById('edit-product-id').value;
    let name = document.getElementById('prod-name').value.trim();
    let price = parseFloat(document.getElementById('prod-price').value);
    let category = document.getElementById('prod-cat').value;
    let image = document.getElementById('prod-img').value.trim();
    let description = document.getElementById('prod-desc').value.trim();

    if (!name || isNaN(price)) {
        alert("Por favor completa al menos el nombre y el precio.");
        return;
    }

    if (id) {
        // Editar existente
        let prod = products.find(p => p.id == id);
        if (prod) {
            prod.name = name;
            prod.price = price;
            prod.category = category;
            prod.image = image || prod.image;
            prod.description = description;
        }
    } else {
        // Crear nuevo
        let newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({
            id: newId,
            name,
            price,
            category,
            image: image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500',
            description
        });
    }

    saveProductsToCloud(); // Sincroniza y guarda en JSONBin
    resetAdminForm();
}

function editProduct(id) {
    let p = products.find(prod => prod.id === id);
    if (!p) return;

    document.getElementById('edit-product-id').value = p.id;
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-price').value = p.price;
    document.getElementById('prod-cat').value = p.category;
    document.getElementById('prod-img').value = p.image;
    document.getElementById('prod-desc').value = p.description || '';
    document.getElementById('admin-form-title').innerText = "Editar Producto";
}

function deleteProduct(id) {
    if (confirm("¿Seguro que deseas eliminar este producto?")) {
        products = products.filter(p => p.id !== id);
        saveProductsToCloud(); // Sincroniza y guarda en JSONBin
    }
}

function resetAdminForm() {
    document.getElementById('edit-product-id').value = '';
    document.getElementById('prod-name').value = '';
    document.getElementById('prod-price').value = '';
    document.getElementById('prod-img').value = '';
    document.getElementById('prod-desc').value = '';
    document.getElementById('admin-form-title').innerText = "Agregar Nuevo Producto";
}

// INICIALIZAR AL CARGAR LA PÁGINA
window.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});