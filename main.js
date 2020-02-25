document.addEventListener('DOMContentLoaded', () => {
    CART.init();
    getProducts();
});

let PRODUCTS = [];

let SORTED_PRODUCTS = [];

const ITEMS_PER_PAGE = 15;

let CURRENT_PAGE = 1;

const CART = {
    key: 'myshopkey',
    addedProducts: [],
    init() {
        let lsProds = localStorage.getItem(CART.key);
        if (lsProds) CART.addedProducts = JSON.parse(lsProds);
        CART.showQuantity();
    },
    showQuantity() {
        let qnt = document.querySelector('.cart__quantity');
        if (CART.addedProducts.length > 0) {
            qnt.innerText = CART.addedProducts.reduce((sum, item) => sum + item.quantity, 0);
        }
        else qnt.innerText = '0';
    },
    makeCheckout(close = true) {
        let container = document.querySelector('.cart__checkout');
        container.innerHTML = '';
        CART.addedProducts.forEach(item => {
            let prodCard = document.createElement('div');
            prodCard.classList.add('checkout__card');
            let prodTitle = document.createElement('span');
            prodTitle.innerText = item.title;
            let prodPrice = document.createElement('span');
            prodPrice.innerText = item.price + ' руб.';
            let prodQuantity = document.createElement('span');
            prodQuantity.innerText = item.quantity + ' шт.';
            let prodInfo = document.createElement('div');
            prodInfo.classList.add('checkout__card__info');
            [prodTitle, prodPrice, prodQuantity].forEach(elem => prodInfo.appendChild(elem));
            let prodTotal = document.createElement('span');
            let totalPrice = item.quantity * item.price;
            prodTotal.innerText = totalPrice + ' руб.';
            let prodRemove = document.createElement('button');
            prodRemove.classList.add('control__remove');
            prodRemove.innerText = 'Удалить';
            prodRemove.setAttribute('data-id', item.id);
            prodRemove.addEventListener('click', CART.remove);
            let prodControl = document.createElement('div');
            prodControl.classList.add('checkout__card__control');
            [prodTotal, prodRemove].forEach(item => prodControl.appendChild(item));
            [prodInfo, prodControl].forEach(item => prodCard.appendChild(item));
            container.appendChild(prodCard);
        });
        let total = document.createElement('span');
        total.innerText = 'Всего: ' + CART.sum() + ' руб.';
        container.appendChild(total);
        if (close) container.classList.toggle('hidden');
    },
    async addToLS() {
        let prods = JSON.stringify(CART.addedProducts);
        await localStorage.setItem(CART.key, prods);
        CART.showQuantity();
        showProducts();
    },
    add(id) {
        if (CART.addedProducts.findIndex(item => item.id == id) > -1) CART.increase(id);
        else {
            let prod = PRODUCTS.find(item => item.id == id);
            CART.addedProducts.push({
                id: prod.id,
                title: prod.title,
                price: prod.price,
                quantity: 1
            });
            CART.addToLS();
        }
        CART.makeCheckout(false);
    },
    increase(id) {
        CART.addedProducts.forEach(item => {
            if (item.id == id) item.quantity += 1;
        });
        CART.addToLS();
    },
    remove(event) {
        event.preventDefault();
        let id = parseInt(event.target.getAttribute('data-id'));
        CART.addedProducts = CART.addedProducts.filter(item => {
            return item.id != id ? true : false;
        });
        CART.addToLS();
        if (CART.addedProducts.length < 1) CART.makeCheckout(false);
        else CART.makeCheckout();
    },
    sum() {
        return CART.addedProducts.reduce((res, item) => res + item.price * item.quantity, 0);
    }
}

async function getProducts() {
    PRODUCTS = await fetchProducts();
    showProducts('all');
}

async function fetchProducts() {
    return new Promise((resolve, reject) => {
        let prods = [];
        for (let i = 1; i <= 3000; i++) {
            prods.push({
                id: i,
                title: `Стул ${i}`,
                image: 'https://d37kg2ecsrm74.cloudfront.net/web/ikea4/images/382/0238233_PE377690_S5.jpg',
                descr: 'Супер стул',
                price: 300,
                available: Math.random() >= 0.3
            })
        }
        resolve(prods);
    })
}

function sortProducts(field) {
    SORTED_PRODUCTS = PRODUCTS;
    switch (field) {
        case 'title':
            let col = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
            SORTED_PRODUCTS.sort(col.compare).reverse();
            break;
        case 'price':
            SORTED_PRODUCTS.sort((a, b) => a.price - b.price).reverse();
            break;
        case 'available':
            SORTED_PRODUCTS = SORTED_PRODUCTS.filter(item => item.available);
            break;
    }
}

function showProducts(sort) {
    if (sort) sortProducts(sort);

    let SHOWING_PRODUCTS = SORTED_PRODUCTS.slice((CURRENT_PAGE - 1) * ITEMS_PER_PAGE, CURRENT_PAGE * ITEMS_PER_PAGE);
    const prodList = document.querySelector('.products__list');
    prodList.innerHTML = '';

    SHOWING_PRODUCTS.forEach(item => {
        let quantity = CART.addedProducts.find(prod => prod.id === item.id);
        if (quantity) quantity = quantity.quantity;
        let div = document.createElement('div');
        let img = document.createElement('img');
        let title = document.createElement('span');
        let descr = document.createElement('span');
        let price = document.createElement('span');
        let button = document.createElement('button');
        img.src = item.image;
        title.innerText = item.title;
        descr.innerText = item.descr;
        price.innerText = item.price + ' руб.';
        button.innerText = (quantity) ? `Добавить в корзину (${quantity})` : 'Добавить в корзину';
        button.setAttribute('data-id', item.id);
        div.classList.add('card');
        img.classList.add('card__image');
        title.classList.add('card__title');
        descr.classList.add('card__descr');
        price.classList.add('card__price');
        if (item.available) {
            button.classList.add('card__button');
            button.addEventListener('click', addToCart);
        }
        else button.classList.add('card__button-disabled');
        [img, title, descr, price, button].forEach(item => div.appendChild(item));
        prodList.appendChild(div);
    })
    
    showPagination();
}

function showPagination() {
    let pagesNumber = Math.ceil(SORTED_PRODUCTS.length / ITEMS_PER_PAGE);
    let pagination = document.querySelector('.pagination');
    pagination.innerHTML = '';

    if (CURRENT_PAGE <= 3) {
        for (let i = 1; i <= 4; i++) {
            let pageDiv = document.createElement('div');
            pageDiv.classList.add('pagination__item');
            if (i === CURRENT_PAGE) pageDiv.classList.add('active');
            pageDiv.innerText = i;
            pageDiv.addEventListener('click', (event) => {
                event.preventDefault();
                changePage(+event.target.innerText);
            })
            pagination.appendChild(pageDiv);
        }

        let threeDots = document.createElement('div');
        threeDots.classList.add('pagination__item', 'pagination__item-3dts');
        threeDots.innerText = '...';
        pagination.appendChild(threeDots);

        let lastPage = document.createElement('div');
        lastPage.classList.add('pagination__item');
        lastPage.innerText = pagesNumber;
        lastPage.addEventListener('click', (event) => {
            event.preventDefault();
            changePage(+event.target.innerText);
        })
        pagination.appendChild(lastPage);
    }

    if ((CURRENT_PAGE > 3) && (CURRENT_PAGE < (pagesNumber - 2))) {
        let firstPage = document.createElement('div');
        firstPage.classList.add('pagination__item');
        firstPage.innerText = '1';
        firstPage.addEventListener('click', (event) => {
            event.preventDefault();
            changePage(+event.target.innerText);
        })
        pagination.appendChild(firstPage);

        let threeDots = document.createElement('div');
        threeDots.classList.add('pagination__item', 'pagination__item-3dts');
        threeDots.innerText = '...';
        pagination.appendChild(threeDots);

        for (let i = CURRENT_PAGE - 1; i <= CURRENT_PAGE + 1; i++) {
            let pageDiv = document.createElement('div');
            pageDiv.classList.add('pagination__item');
            if (i === CURRENT_PAGE) pageDiv.classList.add('active');
            pageDiv.innerText = i;
            pageDiv.addEventListener('click', (event) => {
                event.preventDefault();
                changePage(+event.target.innerText);
            })
            pagination.appendChild(pageDiv);
        }

        let threeDots2 = document.createElement('div');
        threeDots2.classList.add('pagination__item', 'pagination__item-3dts');
        threeDots2.innerText = '...';
        pagination.appendChild(threeDots2);

        let lastPage = document.createElement('div');
        lastPage.classList.add('pagination__item');
        lastPage.innerText = pagesNumber;
        lastPage.addEventListener('click', (event) => {
            event.preventDefault();
            changePage(+event.target.innerText);
        })
        pagination.appendChild(lastPage);
    }

    if (CURRENT_PAGE >= (pagesNumber - 2)) {
        let firstPage = document.createElement('div');
        firstPage.classList.add('pagination__item');
        firstPage.innerText = '1';
        firstPage.addEventListener('click', (event) => {
            event.preventDefault();
            changePage(+event.target.innerText);
        })
        pagination.appendChild(firstPage);

        let threeDots = document.createElement('div');
        threeDots.classList.add('pagination__item', 'pagination__item-3dts');
        threeDots.innerText = '...';
        pagination.appendChild(threeDots);

        for (let i = pagesNumber - 3; i <= pagesNumber; i++) {
            let pageDiv = document.createElement('div');
            pageDiv.classList.add('pagination__item');
            if (i === CURRENT_PAGE) pageDiv.classList.add('active');
            pageDiv.innerText = i;
            pageDiv.addEventListener('click', (event) => {
                event.preventDefault();
                changePage(+event.target.innerText);
            })
            pagination.appendChild(pageDiv);
        }
    }
}

function changePage(n) {
    CURRENT_PAGE = n;
    showProducts();
}

function addToCart(event) {
    event.preventDefault();
    let prodId = parseInt(event.target.getAttribute('data-id'));
    CART.add(prodId);
}
