// 产品页面专用JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeProductPage();
});

function initializeProductPage() {
    initializeProductFilters();
    initializeProductSort();
    initializeProductActions();
    initializeLoadMore();
    initializeQuickView();
}

// 产品筛选增强
function initializeProductFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const productCards = document.querySelectorAll('.product-card');
    
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // 更新按钮状态
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 筛选产品
            filterProducts(category);
        });
    });
}

// 筛选产品函数
function filterProducts(category) {
    const productCards = document.querySelectorAll('.product-card');
    let visibleCount = 0;
    
    productCards.forEach((card, index) => {
        const cardCategories = card.dataset.category || '';
        const shouldShow = category === 'all' || cardCategories.includes(category);
        
        if (shouldShow) {
            card.style.display = 'block';
            card.style.animationDelay = `${visibleCount * 0.1}s`;
            card.classList.add('fade-in');
            visibleCount++;
        } else {
            card.classList.remove('fade-in');
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
    
    // 更新结果计数
    updateResultCount(visibleCount);
}

// 更新结果计数
function updateResultCount(count) {
    let countElement = document.querySelector('.result-count');
    if (!countElement) {
        countElement = document.createElement('div');
        countElement.className = 'result-count';
        document.querySelector('.product-filters').appendChild(countElement);
    }
    countElement.textContent = `找到 ${count} 个产品`;
}

// 产品排序
function initializeProductSort() {
    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortType = this.value;
            sortProducts(sortType);
        });
    }
}

// 排序产品
function sortProducts(sortType) {
    const productsGrid = document.querySelector('.products-grid');
    const products = Array.from(productsGrid.querySelectorAll('.product-card'));
    
    products.sort((a, b) => {
        switch (sortType) {
            case 'price-low':
                return getProductPrice(a) - getProductPrice(b);
            case 'price-high':
                return getProductPrice(b) - getProductPrice(a);
            case 'popularity':
                return getProductPopularity(b) - getProductPopularity(a);
            case 'newest':
                return getProductNewness(b) - getProductNewness(a);
            default:
                return 0;
        }
    });
    
    // 重新排列产品
    products.forEach((product, index) => {
        product.style.order = index;
        product.style.animationDelay = `${index * 0.05}s`;
    });
}

// 获取产品价格
function getProductPrice(productCard) {
    const priceElement = productCard.querySelector('.current-price');
    if (priceElement) {
        return parseInt(priceElement.textContent.replace(/[^\d]/g, ''));
    }
    return 0;
}

// 获取产品人气度
function getProductPopularity(productCard) {
    const ratingElement = productCard.querySelector('.rating-count');
    if (ratingElement) {
        const match = ratingElement.textContent.match(/\((\d+)/);
        return match ? parseInt(match[1]) : 0;
    }
    return 0;
}

// 获取产品新旧程度（模拟）
function getProductNewness(productCard) {
    const badges = productCard.querySelectorAll('.product-badge');
    for (let badge of badges) {
        if (badge.textContent.includes('新品') || badge.textContent.includes('限定')) {
            return 1;
        }
    }
    return 0;
}

// 产品操作
function initializeProductActions() {
    // 快速预览按钮
    document.querySelectorAll('.btn-quick-view').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const productCard = this.closest('.product-card');
            showQuickView(productCard);
        });
    });
    
    // 添加到购物车按钮
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            addToCart(this);
        });
    });
    
    // 立即购买按钮
    document.querySelectorAll('.btn-product').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            buyNow(this);
        });
    });
    
    // 心愿单按钮
    document.querySelectorAll('.btn-wishlist').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleWishlist(this);
        });
    });
}

// 立即购买
function buyNow(button) {
    const productCard = button.closest('.product-card');
    const productName = productCard.querySelector('.product-name').textContent;
    
    // 模拟跳转到购买页面
    showNotification(`正在跳转到 ${productName} 购买页面...`, 'info');
    
    // 实际应用中应该跳转到购买页面
    setTimeout(() => {
        window.location.href = '#checkout';
    }, 1000);
}

// 加载更多功能
function initializeLoadMore() {
    const loadMoreBtn = document.querySelector('.load-more .btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            loadMoreProducts();
        });
    }
}

// 加载更多产品
function loadMoreProducts() {
    const loadMoreBtn = document.querySelector('.load-more .btn');
    const originalText = loadMoreBtn.textContent;
    
    loadMoreBtn.textContent = '加载中...';
    loadMoreBtn.disabled = true;
    
    // 模拟加载
    setTimeout(() => {
        // 这里应该从服务器获取更多产品
        const newProducts = generateMockProducts(6);
        appendProducts(newProducts);
        
        loadMoreBtn.textContent = originalText;
        loadMoreBtn.disabled = false;
        
        showNotification('已加载更多产品', 'success');
    }, 1500);
}

// 生成模拟产品数据
function generateMockProducts(count) {
    const mockProducts = [];
    const productNames = [
        '深海鱼胶精华',
        '有机燕窝套装',
        '胶原蛋白饮品',
        '美颜养生茶',
        '滋补汤品礼盒',
        '抗氧化精华液'
    ];
    
    for (let i = 0; i < count; i++) {
        mockProducts.push({
            name: productNames[i % productNames.length],
            price: Math.floor(Math.random() * 2000) + 500,
            originalPrice: Math.floor(Math.random() * 3000) + 1000,
            image: 'images/gift_box_product_20260125_202546.png',
            rating: Math.floor(Math.random() * 5) + 1,
            reviews: Math.floor(Math.random() * 200) + 10
        });
    }
    
    return mockProducts;
}

// 添加产品到页面
function appendProducts(products) {
    const productsGrid = document.querySelector('.products-grid');
    const loadMoreSection = document.querySelector('.load-more');
    
    products.forEach((product, index) => {
        const productCard = createProductCard(product);
        productCard.style.animationDelay = `${index * 0.1}s`;
        productCard.classList.add('fade-in');
        
        productsGrid.insertBefore(productCard, loadMoreSection);
    });
    
    // 重新初始化新产品的事件监听器
    initializeProductActions();
}

// 创建产品卡片
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.category = 'classic';
    
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.image}" alt="${product.name}">
            <div class="product-badge">新品</div>
            <div class="product-overlay">
                <button class="btn-quick-view">快速预览</button>
                <button class="btn-add-cart">加入购物车</button>
            </div>
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">精选原料，专业配方，为您的健康保驾护航</p>
            <div class="product-features">
                <span>✓ 天然无添加</span>
                <span>✓ 科学配方</span>
                <span>✓ 品质保证</span>
            </div>
            <div class="product-rating">
                <div class="stars">${'★'.repeat(product.rating)}${'☆'.repeat(5-product.rating)}</div>
                <span class="rating-count">(${product.reviews} 评价)</span>
            </div>
            <div class="product-price">
                <span class="current-price">¥${product.price}</span>
                <span class="original-price">¥${product.originalPrice}</span>
                <span class="discount">-${Math.round((1-product.price/product.originalPrice)*100)}%</span>
            </div>
            <div class="product-actions">
                <button class="btn btn-product">立即购买</button>
                <button class="btn-wishlist">♡</button>
            </div>
        </div>
    `;
    
    return card;
}

// 快速预览功能
function initializeQuickView() {
    // 创建快速预览模态框
    createQuickViewModal();
}

// 创建快速预览模态框
function createQuickViewModal() {
    const modal = document.createElement('div');
    modal.id = 'quickViewModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">产品详情</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="quick-view-content">
                    <div class="quick-view-image">
                        <img src="" alt="" id="quickViewImage">
                    </div>
                    <div class="quick-view-info">
                        <h4 id="quickViewName"></h4>
                        <p id="quickViewDescription"></p>
                        <div id="quickViewFeatures"></div>
                        <div id="quickViewPrice"></div>
                        <div class="quick-view-actions">
                            <button class="btn btn-primary" id="quickViewBuy">立即购买</button>
                            <button class="btn btn-outline" id="quickViewCart">加入购物车</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 绑定关闭事件
    modal.querySelector('.modal-close').addEventListener('click', closeQuickView);
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeQuickView();
        }
    });
}

// 显示快速预览
function showQuickView(productCard) {
    const modal = document.getElementById('quickViewModal');
    const name = productCard.querySelector('.product-name').textContent;
    const description = productCard.querySelector('.product-description').textContent;
    const image = productCard.querySelector('.product-image img').src;
    const price = productCard.querySelector('.product-price').innerHTML;
    const features = productCard.querySelector('.product-features').innerHTML;
    
    // 填充模态框内容
    document.getElementById('quickViewName').textContent = name;
    document.getElementById('quickViewDescription').textContent = description;
    document.getElementById('quickViewImage').src = image;
    document.getElementById('quickViewPrice').innerHTML = price;
    document.getElementById('quickViewFeatures').innerHTML = features;
    
    // 显示模态框
    modal.style.display = 'block';
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // 绑定按钮事件
    document.getElementById('quickViewBuy').onclick = () => {
        closeQuickView();
        buyNow(productCard.querySelector('.btn-product'));
    };
    
    document.getElementById('quickViewCart').onclick = () => {
        addToCart(productCard.querySelector('.btn-add-cart'));
        closeQuickView();
    };
}

// 关闭快速预览
function closeQuickView() {
    const modal = document.getElementById('quickViewModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// 产品比较功能
let compareList = [];

function addToCompare(productCard) {
    const productName = productCard.querySelector('.product-name').textContent;
    
    if (compareList.length >= 3) {
        showNotification('最多只能比较3个产品', 'warning');
        return;
    }
    
    if (compareList.some(item => item.name === productName)) {
        showNotification('该产品已在比较列表中', 'warning');
        return;
    }
    
    const product = {
        name: productName,
        price: productCard.querySelector('.current-price').textContent,
        image: productCard.querySelector('.product-image img').src,
        features: Array.from(productCard.querySelectorAll('.product-features span')).map(span => span.textContent)
    };
    
    compareList.push(product);
    updateCompareButton();
    showNotification(`${productName} 已添加到比较列表`, 'success');
}

function updateCompareButton() {
    let compareBtn = document.querySelector('.compare-btn');
    if (!compareBtn && compareList.length > 0) {
        compareBtn = document.createElement('button');
        compareBtn.className = 'compare-btn btn btn-secondary';
        compareBtn.innerHTML = `比较产品 (${compareList.length})`;
        compareBtn.onclick = showCompareModal;
        
        document.querySelector('.product-filters').appendChild(compareBtn);
    } else if (compareBtn) {
        compareBtn.innerHTML = `比较产品 (${compareList.length})`;
        if (compareList.length === 0) {
            compareBtn.remove();
        }
    }
}

// 显示比较模态框
function showCompareModal() {
    // 实现产品比较功能
    showNotification('产品比较功能开发中', 'info');
}

// 导出产品页面函数
window.ProductPage = {
    filterProducts,
    sortProducts,
    addToCompare,
    showQuickView
};