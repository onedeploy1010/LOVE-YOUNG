// Love Young 网站主要JavaScript功能

// 全局变量
let currentUser = null;
let cart = [];

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeScrollEffects();
    initializeForms();
    initializeFAQ();
    initializeProductFilters();
    initializeMemberCenter();
    initializeAnimations();
});

// 导航栏功能
function initializeNavigation() {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    // 滚动时导航栏样式变化
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
    
    // 移动端菜单切换
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // 平滑滚动到锚点
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 滚动效果
function initializeScrollEffects() {
    // 元素进入视口时的动画
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // 观察需要动画的元素
    document.querySelectorAll('.product-card, .testimonial-card, .value-item, .feature-item').forEach(el => {
        observer.observe(el);
    });
}

// 表单处理
function initializeForms() {
    // 联系表单
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // 预约表单
    const visitForm = document.getElementById('visitForm');
    if (visitForm) {
        visitForm.addEventListener('submit', handleVisitForm);
    }
    
    // 登录注册按钮
    const loginBtn = document.querySelector('.btn-login');
    const registerBtn = document.querySelector('.btn-register');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', showLoginModal);
    }
    
    if (registerBtn) {
        registerBtn.addEventListener('click', showRegisterModal);
    }
}

// 处理联系表单提交
function handleContactForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // 表单验证
    if (!validateContactForm(data)) {
        return;
    }
    
    // 显示提交中状态
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '提交中...';
    submitBtn.disabled = true;
    
    // 模拟提交
    setTimeout(() => {
        showNotification('咨询提交成功！我们将在24小时内与您联系。', 'success');
        e.target.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

// 处理预约表单提交
function handleVisitForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // 表单验证
    if (!data.name || !data.phone || !data.location || !data.date) {
        showNotification('请填写所有必填项', 'error');
        return;
    }
    
    // 显示提交中状态
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '提交中...';
    submitBtn.disabled = true;
    
    // 模拟提交
    setTimeout(() => {
        showNotification('预约提交成功！我们将尽快与您确认参观时间。', 'success');
        e.target.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 2000);
}

// 表单验证
function validateContactForm(data) {
    if (!data.name || data.name.trim().length < 2) {
        showNotification('请输入有效的姓名', 'error');
        return false;
    }
    
    if (!data.phone || !/^1[3-9]\d{9}$/.test(data.phone)) {
        showNotification('请输入有效的手机号', 'error');
        return false;
    }
    
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        showNotification('请输入有效的邮箱地址', 'error');
        return false;
    }
    
    if (!data.type) {
        showNotification('请选择咨询类型', 'error');
        return false;
    }
    
    if (!data.message || data.message.trim().length < 10) {
        showNotification('请详细描述您的需求（至少10个字符）', 'error');
        return false;
    }
    
    if (!data.agree) {
        showNotification('请同意隐私政策和服务条款', 'error');
        return false;
    }
    
    return true;
}

// FAQ功能
function initializeFAQ() {
    // FAQ分类切换
    const faqCategories = document.querySelectorAll('.faq-category');
    const faqLists = document.querySelectorAll('.faq-list');
    
    faqCategories.forEach(category => {
        category.addEventListener('click', function() {
            const targetCategory = this.dataset.category;
            
            // 更新分类按钮状态
            faqCategories.forEach(cat => cat.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应的FAQ列表
            faqLists.forEach(list => {
                if (list.dataset.category === targetCategory) {
                    list.style.display = 'block';
                } else {
                    list.style.display = 'none';
                }
            });
        });
    });
    
    // FAQ展开/收起
    document.querySelectorAll('.faq-question').forEach(question => {
        question.addEventListener('click', function() {
            const faqItem = this.parentElement;
            const answer = faqItem.querySelector('.faq-answer');
            const toggle = this.querySelector('.faq-toggle');
            
            if (faqItem.classList.contains('active')) {
                faqItem.classList.remove('active');
                answer.style.maxHeight = '0';
                toggle.textContent = '+';
            } else {
                // 关闭其他打开的FAQ
                document.querySelectorAll('.faq-item.active').forEach(item => {
                    item.classList.remove('active');
                    item.querySelector('.faq-answer').style.maxHeight = '0';
                    item.querySelector('.faq-toggle').textContent = '+';
                });
                
                faqItem.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
                toggle.textContent = '−';
            }
        });
    });
}

// 产品筛选功能
function initializeProductFilters() {
    const filterTabs = document.querySelectorAll('.filter-tab');
    const productCards = document.querySelectorAll('.product-card');
    const sortSelect = document.querySelector('.sort-select');
    
    // 分类筛选
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // 更新按钮状态
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 筛选产品
            productCards.forEach(card => {
                if (category === 'all' || card.dataset.category.includes(category)) {
                    card.style.display = 'block';
                    setTimeout(() => card.classList.add('show'), 10);
                } else {
                    card.classList.remove('show');
                    setTimeout(() => card.style.display = 'none', 300);
                }
            });
        });
    });
    
    // 排序功能
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            const sortType = this.value;
            sortProducts(sortType);
        });
    }
    
    // 产品卡片悬停效果
    productCards.forEach(card => {
        const overlay = card.querySelector('.product-overlay');
        if (overlay) {
            card.addEventListener('mouseenter', function() {
                overlay.style.opacity = '1';
            });
            
            card.addEventListener('mouseleave', function() {
                overlay.style.opacity = '0';
            });
        }
    });
    
    // 添加到购物车
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            addToCart(this);
        });
    });
    
    // 心愿单功能
    document.querySelectorAll('.btn-wishlist').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleWishlist(this);
        });
    });
}

// 产品排序
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
                return getProductRating(b) - getProductRating(a);
            case 'newest':
                return new Date(getProductDate(b)) - new Date(getProductDate(a));
            default:
                return 0;
        }
    });
    
    // 重新排列产品
    products.forEach(product => {
        productsGrid.appendChild(product);
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

// 获取产品评分
function getProductRating(productCard) {
    const ratingElement = productCard.querySelector('.rating-count');
    if (ratingElement) {
        return parseInt(ratingElement.textContent.match(/\d+/)[0]);
    }
    return 0;
}

// 获取产品日期（模拟）
function getProductDate(productCard) {
    return new Date(); // 实际应用中应该从数据中获取
}

// 会员中心功能
function initializeMemberCenter() {
    const memberNav = document.querySelectorAll('.member-nav .nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    // 侧边栏导航
    memberNav.forEach(navItem => {
        navItem.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('href').substring(1);
            
            // 更新导航状态
            memberNav.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应内容
            contentSections.forEach(section => {
                if (section.id === targetSection) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });
    
    // 订单筛选
    const orderFilters = document.querySelectorAll('.filter-btn');
    orderFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            orderFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            
            // 这里可以添加订单筛选逻辑
            filterOrders(this.textContent);
        });
    });
    
    // 开关按钮
    const switches = document.querySelectorAll('.switch input');
    switches.forEach(switchInput => {
        switchInput.addEventListener('change', function() {
            const setting = this.name;
            const enabled = this.checked;
            updateUserSetting(setting, enabled);
        });
    });
}

// 筛选订单
function filterOrders(filterType) {
    const orderItems = document.querySelectorAll('.order-item');
    
    orderItems.forEach(item => {
        const status = item.querySelector('.order-status').textContent;
        
        if (filterType === '全部' || 
            (filterType === '待付款' && status.includes('待付款')) ||
            (filterType === '待发货' && status.includes('待发货')) ||
            (filterType === '待收货' && status.includes('配送中')) ||
            (filterType === '已完成' && status.includes('已完成'))) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// 更新用户设置
function updateUserSetting(setting, enabled) {
    console.log(`设置 ${setting} 已${enabled ? '开启' : '关闭'}`);
    // 这里可以发送到服务器保存设置
}

// 动画效果
function initializeAnimations() {
    // 数字计数动画
    const counters = document.querySelectorAll('.stat-number');
    const counterObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    });
    
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

// 数字计数动画
function animateCounter(element) {
    const target = parseInt(element.textContent.replace(/[^\d]/g, ''));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += step;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        const prefix = element.textContent.match(/[^\d]+/g)?.[0] || '';
        const suffix = element.textContent.match(/[^\d]+/g)?.[1] || '';
        element.textContent = prefix + Math.floor(current).toLocaleString() + suffix;
    }, 16);
}

// 添加到购物车
function addToCart(button) {
    const productCard = button.closest('.product-card');
    const productName = productCard.querySelector('.product-name').textContent;
    const productPrice = productCard.querySelector('.current-price').textContent;
    
    // 添加到购物车数组
    cart.push({
        name: productName,
        price: productPrice,
        quantity: 1
    });
    
    // 显示成功提示
    showNotification(`${productName} 已添加到购物车`, 'success');
    
    // 更新购物车图标（如果有的话）
    updateCartIcon();
}

// 切换心愿单
function toggleWishlist(button) {
    const productCard = button.closest('.product-card');
    const productName = productCard.querySelector('.product-name').textContent;
    
    if (button.classList.contains('active')) {
        button.classList.remove('active');
        button.textContent = '♡';
        showNotification(`${productName} 已从心愿单移除`, 'info');
    } else {
        button.classList.add('active');
        button.textContent = '♥';
        showNotification(`${productName} 已添加到心愿单`, 'success');
    }
}

// 更新购物车图标
function updateCartIcon() {
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        const cartCount = cartIcon.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = cart.length;
            cartCount.style.display = cart.length > 0 ? 'block' : 'none';
        }
    }
}

// 显示登录模态框
function showLoginModal() {
    // 这里可以实现登录模态框
    showNotification('登录功能开发中', 'info');
}

// 显示注册模态框
function showRegisterModal() {
    // 这里可以实现注册模态框
    showNotification('注册功能开发中', 'info');
}

// 通知系统
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示动画
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 工具函数
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

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

// 导出全局函数（如果需要）
window.LoveYoung = {
    showNotification,
    addToCart,
    toggleWishlist
};