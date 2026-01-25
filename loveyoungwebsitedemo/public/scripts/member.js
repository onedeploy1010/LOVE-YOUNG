// 会员中心专用JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeMemberCenter();
});

function initializeMemberCenter() {
    initializeMemberNavigation();
    initializeDashboard();
    initializeOrderManagement();
    initializePointsSystem();
    initializeDividendChart();
    initializeProfileManagement();
    initializeSettings();
}

// 会员导航
function initializeMemberNavigation() {
    const navItems = document.querySelectorAll('.member-nav .nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    navItems.forEach(navItem => {
        navItem.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('href').substring(1);
            
            // 更新导航状态
            navItems.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            
            // 显示对应内容
            contentSections.forEach(section => {
                if (section.id === targetSection) {
                    section.classList.add('active');
                    // 触发内容加载
                    loadSectionContent(targetSection);
                } else {
                    section.classList.remove('active');
                }
            });
            
            // 更新URL（可选）
            history.pushState(null, null, `#${targetSection}`);
        });
    });
    
    // 处理页面加载时的hash
    const hash = window.location.hash.substring(1);
    if (hash) {
        const targetNav = document.querySelector(`[href="#${hash}"]`);
        if (targetNav) {
            targetNav.click();
        }
    }
}

// 加载区块内容
function loadSectionContent(sectionId) {
    switch (sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'orders':
            loadOrdersData();
            break;
        case 'points':
            loadPointsData();
            break;
        case 'dividends':
            loadDividendsData();
            break;
        case 'benefits':
            loadBenefitsData();
            break;
        case 'profile':
            loadProfileData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

// 仪表板功能
function initializeDashboard() {
    // 统计数字动画
    animateStatNumbers();
    
    // 最近活动自动刷新
    setInterval(refreshRecentActivities, 30000); // 30秒刷新一次
}

function loadDashboardData() {
    // 模拟加载仪表板数据
    showLoadingSpinner('dashboard');
    
    setTimeout(() => {
        hideLoadingSpinner('dashboard');
        updateDashboardStats();
        updateRecentActivities();
        updateRecommendedProducts();
    }, 1000);
}

function updateDashboardStats() {
    const stats = {
        orders: 12,
        points: 2580,
        dividends: 24500,
        level: '创始'
    };
    
    document.querySelector('.dashboard-stats .stat-card:nth-child(1) .stat-number').textContent = stats.orders;
    document.querySelector('.dashboard-stats .stat-card:nth-child(2) .stat-number').textContent = stats.points.toLocaleString();
    document.querySelector('.dashboard-stats .stat-card:nth-child(3) .stat-number').textContent = `¥${stats.dividends.toLocaleString()}`;
    document.querySelector('.dashboard-stats .stat-card:nth-child(4) .stat-number').textContent = stats.level;
}

function animateStatNumbers() {
    const statNumbers = document.querySelectorAll('.dashboard-stats .stat-number');
    
    statNumbers.forEach(stat => {
        const finalValue = stat.textContent.replace(/[^\d]/g, '');
        if (finalValue) {
            animateNumber(stat, 0, parseInt(finalValue), 2000);
        }
    });
}

function animateNumber(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        
        const prefix = element.textContent.match(/[^\d]+/)?.[0] || '';
        element.textContent = prefix + Math.floor(current).toLocaleString();
    }, 16);
}

// 订单管理
function initializeOrderManagement() {
    const orderFilters = document.querySelectorAll('.order-filters .filter-btn');
    
    orderFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            orderFilters.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            
            filterOrders(this.textContent);
        });
    });
    
    // 订单操作按钮
    document.addEventListener('click', function(e) {
        if (e.target.matches('.order-actions .btn')) {
            handleOrderAction(e.target);
        }
    });
}

function loadOrdersData() {
    showLoadingSpinner('orders');
    
    // 模拟从服务器加载订单数据
    setTimeout(() => {
        hideLoadingSpinner('orders');
        renderOrders(getMockOrders());
    }, 1000);
}

function getMockOrders() {
    return [
        {
            id: 'LY2024011501',
            date: '2024-01-15',
            status: '已完成',
            products: [
                {
                    name: 'Love Young 尊享焕颜礼盒',
                    spec: '标准装',
                    price: 1999,
                    quantity: 1,
                    image: 'images/gift_box_product_20260125_202546.png'
                }
            ],
            total: 1999
        },
        {
            id: 'LY2024011202',
            date: '2024-01-12',
            status: '配送中',
            products: [
                {
                    name: '青春定格膳食套装',
                    spec: '30包装',
                    price: 899,
                    quantity: 2,
                    image: 'images/wellness_lifestyle_20260125_202546.png'
                }
            ],
            total: 1798
        }
    ];
}

function renderOrders(orders) {
    const ordersList = document.querySelector('.orders-list');
    ordersList.innerHTML = '';
    
    orders.forEach(order => {
        const orderElement = createOrderElement(order);
        ordersList.appendChild(orderElement);
    });
}

function createOrderElement(order) {
    const orderDiv = document.createElement('div');
    orderDiv.className = 'order-item';
    
    const statusClass = order.status === '已完成' ? 'completed' : 
                       order.status === '配送中' ? 'shipping' : 'pending';
    
    orderDiv.innerHTML = `
        <div class="order-header">
            <div class="order-info">
                <span class="order-number">订单号：${order.id}</span>
                <span class="order-date">${order.date}</span>
            </div>
            <div class="order-status ${statusClass}">${order.status}</div>
        </div>
        <div class="order-content">
            <div class="order-products">
                ${order.products.map(product => `
                    <div class="product-item">
                        <img src="${product.image}" alt="${product.name}" class="product-thumb">
                        <div class="product-details">
                            <h4 class="product-name">${product.name}</h4>
                            <p class="product-spec">规格：${product.spec}</p>
                            <div class="product-price">¥${product.price} × ${product.quantity}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-total">
                <span class="total-label">订单总额：</span>
                <span class="total-amount">¥${order.total}</span>
            </div>
        </div>
        <div class="order-actions">
            ${getOrderActions(order.status)}
        </div>
    `;
    
    return orderDiv;
}

function getOrderActions(status) {
    const baseActions = '<button class="btn btn-outline btn-sm" data-action="detail">查看详情</button>';
    
    switch (status) {
        case '已完成':
            return baseActions + 
                   '<button class="btn btn-outline btn-sm" data-action="rebuy">再次购买</button>' +
                   '<button class="btn btn-outline btn-sm" data-action="review">评价</button>';
        case '配送中':
            return '<button class="btn btn-outline btn-sm" data-action="track">查看物流</button>' +
                   '<button class="btn btn-primary btn-sm" data-action="confirm">确认收货</button>';
        case '待付款':
            return '<button class="btn btn-primary btn-sm" data-action="pay">立即付款</button>' +
                   '<button class="btn btn-outline btn-sm" data-action="cancel">取消订单</button>';
        default:
            return baseActions;
    }
}

function handleOrderAction(button) {
    const action = button.dataset.action;
    const orderItem = button.closest('.order-item');
    const orderNumber = orderItem.querySelector('.order-number').textContent;
    
    switch (action) {
        case 'detail':
            showOrderDetail(orderNumber);
            break;
        case 'track':
            showOrderTracking(orderNumber);
            break;
        case 'confirm':
            confirmOrder(orderNumber);
            break;
        case 'pay':
            payOrder(orderNumber);
            break;
        case 'cancel':
            cancelOrder(orderNumber);
            break;
        case 'rebuy':
            rebuyOrder(orderNumber);
            break;
        case 'review':
            reviewOrder(orderNumber);
            break;
    }
}

// 积分系统
function initializePointsSystem() {
    // 积分历史记录分页
    initializePointsPagination();
}

function loadPointsData() {
    showLoadingSpinner('points');
    
    setTimeout(() => {
        hideLoadingSpinner('points');
        updatePointsBalance();
        loadPointsHistory();
    }, 1000);
}

function updatePointsBalance() {
    const balance = 2580;
    document.querySelector('.points-balance .balance-amount').textContent = `${balance.toLocaleString()} YL`;
}

function loadPointsHistory() {
    const history = [
        { type: '购买产品', detail: '订单号：LY2024011501', points: 200, date: '2024-01-15 10:30' },
        { type: '积分兑换', detail: '兑换：专属礼品', points: -500, date: '2024-01-10 14:20' },
        { type: '推荐好友', detail: '好友：王女士', points: 500, date: '2024-01-08 16:45' }
    ];
    
    const historyList = document.querySelector('.history-list');
    historyList.innerHTML = '';
    
    history.forEach(item => {
        const historyDiv = document.createElement('div');
        historyDiv.className = 'history-item';
        historyDiv.innerHTML = `
            <div class="history-info">
                <h4>${item.type}</h4>
                <p>${item.detail}</p>
                <span class="history-time">${item.date}</span>
            </div>
            <div class="history-points ${item.points > 0 ? 'gain' : 'spend'}">
                ${item.points > 0 ? '+' : ''}${item.points}
            </div>
        `;
        historyList.appendChild(historyDiv);
    });
}

// 分红图表
function initializeDividendChart() {
    // 这里可以集成Chart.js或其他图表库
    createSimpleDividendChart();
}

function createSimpleDividendChart() {
    const chartContainer = document.querySelector('.chart-placeholder');
    if (!chartContainer) return;
    
    const data = [
        { month: '2023-09', amount: 1500 },
        { month: '2023-10', amount: 1800 },
        { month: '2023-11', amount: 2200 },
        { month: '2023-12', amount: 2000 },
        { month: '2024-01', amount: 2500 }
    ];
    
    const maxAmount = Math.max(...data.map(d => d.amount));
    
    chartContainer.innerHTML = data.map((item, index) => `
        <div class="chart-bar" style="height: ${(item.amount / maxAmount) * 100}%; left: ${index * 20}%">
            <div class="bar-value">¥${item.amount}</div>
            <div class="bar-label">${item.month}</div>
        </div>
    `).join('');
}

// 个人信息管理
function initializeProfileManagement() {
    const editBtn = document.querySelector('#profile .btn-outline');
    if (editBtn) {
        editBtn.addEventListener('click', toggleProfileEdit);
    }
}

function toggleProfileEdit() {
    const formInputs = document.querySelectorAll('#profile .form-input');
    const editBtn = document.querySelector('#profile .btn-outline');
    
    const isEditing = editBtn.textContent === '保存信息';
    
    if (isEditing) {
        // 保存信息
        formInputs.forEach(input => input.readOnly = true);
        editBtn.textContent = '编辑信息';
        showNotification('个人信息已保存', 'success');
    } else {
        // 开始编辑
        formInputs.forEach(input => input.readOnly = false);
        editBtn.textContent = '保存信息';
    }
}

// 设置管理
function initializeSettings() {
    const switches = document.querySelectorAll('.switch input');
    
    switches.forEach(switchInput => {
        switchInput.addEventListener('change', function() {
            const setting = this.name;
            const enabled = this.checked;
            updateUserSetting(setting, enabled);
        });
    });
}

function updateUserSetting(setting, enabled) {
    // 模拟保存设置到服务器
    setTimeout(() => {
        showNotification(`${setting} 设置已${enabled ? '开启' : '关闭'}`, 'success');
    }, 500);
}

// 工具函数
function showLoadingSpinner(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.innerHTML = '<div class="spinner"></div><p>加载中...</p>';
        section.appendChild(spinner);
    }
}

function hideLoadingSpinner(sectionId) {
    const section = document.getElementById(sectionId);
    const spinner = section?.querySelector('.loading-spinner');
    if (spinner) {
        spinner.remove();
    }
}

function filterOrders(filterType) {
    const orderItems = document.querySelectorAll('.order-item');
    
    orderItems.forEach(item => {
        const status = item.querySelector('.order-status').textContent;
        
        const shouldShow = filterType === '全部' || 
            (filterType === '待付款' && status.includes('待付款')) ||
            (filterType === '待发货' && status.includes('待发货')) ||
            (filterType === '待收货' && status.includes('配送中')) ||
            (filterType === '已完成' && status.includes('已完成'));
        
        item.style.display = shouldShow ? 'block' : 'none';
    });
}

function refreshRecentActivities() {
    // 模拟刷新最近活动
    const activities = document.querySelectorAll('.activity-item');
    if (activities.length > 0) {
        activities[0].classList.add('highlight');
        setTimeout(() => {
            activities[0].classList.remove('highlight');
        }, 2000);
    }
}

// 订单操作函数
function showOrderDetail(orderNumber) {
    showNotification(`查看订单详情：${orderNumber}`, 'info');
}

function showOrderTracking(orderNumber) {
    showNotification(`查看物流信息：${orderNumber}`, 'info');
}

function confirmOrder(orderNumber) {
    if (confirm('确认收货吗？')) {
        showNotification(`订单 ${orderNumber} 已确认收货`, 'success');
        // 更新订单状态
        setTimeout(() => {
            loadOrdersData();
        }, 1000);
    }
}

function payOrder(orderNumber) {
    showNotification(`跳转到支付页面：${orderNumber}`, 'info');
}

function cancelOrder(orderNumber) {
    if (confirm('确定要取消这个订单吗？')) {
        showNotification(`订单 ${orderNumber} 已取消`, 'success');
        setTimeout(() => {
            loadOrdersData();
        }, 1000);
    }
}

function rebuyOrder(orderNumber) {
    showNotification(`正在为您重新下单：${orderNumber}`, 'info');
}

function reviewOrder(orderNumber) {
    showNotification(`打开评价页面：${orderNumber}`, 'info');
}

// 积分分页
function initializePointsPagination() {
    // 实现积分历史分页功能
}

// 导出会员中心函数
window.MemberCenter = {
    loadSectionContent,
    filterOrders,
    updateUserSetting
};