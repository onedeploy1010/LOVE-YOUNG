// RWA页面专用JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeRWAPage();
});

function initializeRWAPage() {
    initializeRWAPlans();
    initializeInvestmentCalculator();
    initializeApplicationProcess();
    initializeSuccessStories();
    initializeFAQSystem();
    initializeRWADiagram();
}

// RWA计划卡片交互
function initializeRWAPlans() {
    const planCards = document.querySelectorAll('.plan-card');
    
    planCards.forEach(card => {
        // 悬停效果
        card.addEventListener('mouseenter', function() {
            this.classList.add('hover');
            animatePlanCard(this);
        });
        
        card.addEventListener('mouseleave', function() {
            this.classList.remove('hover');
        });
        
        // 点击咨询按钮
        const consultBtn = card.querySelector('.btn');
        consultBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const planType = card.classList.contains('angel') ? 'angel' :
                           card.classList.contains('founder') ? 'founder' : 'strategic';
            showConsultationModal(planType);
        });
    });
    
    // 计划比较功能
    addPlanComparison();
}

// 动画效果
function animatePlanCard(card) {
    const investmentAmount = card.querySelector('.investment-amount');
    const returnRate = card.querySelector('.investment-return');
    
    // 数字动画
    if (investmentAmount && !card.dataset.animated) {
        const amount = investmentAmount.textContent;
        investmentAmount.style.transform = 'scale(1.1)';
        setTimeout(() => {
            investmentAmount.style.transform = 'scale(1)';
        }, 200);
        
        card.dataset.animated = 'true';
    }
}

// 添加计划比较功能
function addPlanComparison() {
    const compareBtn = document.createElement('button');
    compareBtn.className = 'btn btn-outline compare-plans-btn';
    compareBtn.textContent = '对比计划';
    compareBtn.onclick = showPlanComparison;
    
    const plansGrid = document.querySelector('.plans-grid');
    plansGrid.parentNode.insertBefore(compareBtn, plansGrid.nextSibling);
}

// 显示计划对比
function showPlanComparison() {
    const modal = createModal('RWA计划对比', `
        <div class="plan-comparison">
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>对比项目</th>
                        <th>天使经营人</th>
                        <th>创始经营人</th>
                        <th>战略经营人</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>最低投资</td>
                        <td>¥5万</td>
                        <td>¥20万</td>
                        <td>¥100万</td>
                    </tr>
                    <tr>
                        <td>年化分红</td>
                        <td>5%</td>
                        <td>12%</td>
                        <td>25%</td>
                    </tr>
                    <tr>
                        <td>分红周期</td>
                        <td>季度</td>
                        <td>月度</td>
                        <td>年度</td>
                    </tr>
                    <tr>
                        <td>投资期限</td>
                        <td>3年起</td>
                        <td>5年起</td>
                        <td>10年起</td>
                    </tr>
                    <tr>
                        <td>决策参与</td>
                        <td>❌</td>
                        <td>✅</td>
                        <td>✅</td>
                    </tr>
                    <tr>
                        <td>康养基地</td>
                        <td>优惠价</td>
                        <td>免费体验</td>
                        <td>免费入驻</td>
                    </tr>
                    <tr>
                        <td>专属服务</td>
                        <td>客服支持</td>
                        <td>投资顾问</td>
                        <td>管家服务</td>
                    </tr>
                </tbody>
            </table>
            <div class="comparison-actions">
                <button class="btn btn-primary" onclick="startApplication()">立即申请</button>
                <button class="btn btn-outline" onclick="downloadBrochure()">下载资料</button>
            </div>
        </div>
    `);
    
    showModal(modal);
}

// 投资计算器
function initializeInvestmentCalculator() {
    createInvestmentCalculator();
}

function createInvestmentCalculator() {
    const calculatorSection = document.createElement('section');
    calculatorSection.className = 'investment-calculator';
    calculatorSection.innerHTML = `
        <div class="container">
            <div class="section-header">
                <h2 class="section-title">投资收益计算器</h2>
                <p class="section-subtitle">输入您的投资金额，计算预期收益</p>
            </div>
            <div class="calculator-content">
                <div class="calculator-inputs">
                    <div class="input-group">
                        <label>投资金额（万元）</label>
                        <input type="range" id="investmentAmount" min="5" max="500" value="20" step="5">
                        <span class="amount-display">¥20万</span>
                    </div>
                    <div class="input-group">
                        <label>投资期限（年）</label>
                        <input type="range" id="investmentPeriod" min="3" max="15" value="5" step="1">
                        <span class="period-display">5年</span>
                    </div>
                    <div class="input-group">
                        <label>计划类型</label>
                        <select id="planType">
                            <option value="angel">天使经营人 (5%)</option>
                            <option value="founder" selected>创始经营人 (12%)</option>
                            <option value="strategic">战略经营人 (25%)</option>
                        </select>
                    </div>
                </div>
                <div class="calculator-results">
                    <div class="result-item">
                        <span class="result-label">年度分红</span>
                        <span class="result-value" id="annualDividend">¥2.4万</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">总收益</span>
                        <span class="result-value" id="totalReturn">¥12万</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">投资回报率</span>
                        <span class="result-value" id="roi">60%</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 插入到投资回报分析之前
    const analysisSection = document.querySelector('.investment-analysis');
    analysisSection.parentNode.insertBefore(calculatorSection, analysisSection);
    
    // 绑定事件
    bindCalculatorEvents();
}

function bindCalculatorEvents() {
    const amountSlider = document.getElementById('investmentAmount');
    const periodSlider = document.getElementById('investmentPeriod');
    const planSelect = document.getElementById('planType');
    
    const amountDisplay = document.querySelector('.amount-display');
    const periodDisplay = document.querySelector('.period-display');
    
    // 滑块事件
    amountSlider.addEventListener('input', function() {
        amountDisplay.textContent = `¥${this.value}万`;
        calculateReturns();
    });
    
    periodSlider.addEventListener('input', function() {
        periodDisplay.textContent = `${this.value}年`;
        calculateReturns();
    });
    
    planSelect.addEventListener('change', calculateReturns);
    
    // 初始计算
    calculateReturns();
}

function calculateReturns() {
    const amount = parseInt(document.getElementById('investmentAmount').value);
    const period = parseInt(document.getElementById('investmentPeriod').value);
    const planType = document.getElementById('planType').value;
    
    const rates = {
        angel: 0.05,
        founder: 0.12,
        strategic: 0.25
    };
    
    const rate = rates[planType];
    const annualDividend = amount * rate;
    const totalReturn = annualDividend * period;
    const roi = (totalReturn / amount) * 100;
    
    // 更新显示
    document.getElementById('annualDividend').textContent = `¥${annualDividend.toFixed(1)}万`;
    document.getElementById('totalReturn').textContent = `¥${totalReturn.toFixed(1)}万`;
    document.getElementById('roi').textContent = `${roi.toFixed(1)}%`;
    
    // 动画效果
    animateNumbers();
}

function animateNumbers() {
    const resultValues = document.querySelectorAll('.result-value');
    resultValues.forEach(value => {
        value.style.transform = 'scale(1.1)';
        value.style.color = 'var(--secondary-color)';
        setTimeout(() => {
            value.style.transform = 'scale(1)';
            value.style.color = '';
        }, 300);
    });
}

// 申请流程交互
function initializeApplicationProcess() {
    const stepItems = document.querySelectorAll('.step-item');
    
    stepItems.forEach((step, index) => {
        step.addEventListener('click', function() {
            showStepDetail(index + 1);
        });
    });
    
    // 添加进度指示器
    addProgressIndicator();
}

function addProgressIndicator() {
    const processSection = document.querySelector('.application-process');
    const progressBar = document.createElement('div');
    progressBar.className = 'process-progress';
    progressBar.innerHTML = `
        <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
        </div>
        <div class="progress-text">申请进度：0%</div>
    `;
    
    processSection.querySelector('.container').appendChild(progressBar);
}

function showStepDetail(stepNumber) {
    const stepDetails = {
        1: {
            title: '咨询了解',
            content: `
                <div class="step-detail">
                    <h4>第一步：深入了解RWA模式</h4>
                    <ul>
                        <li>专业顾问一对一讲解RWA投资模式</li>
                        <li>详细介绍各级别经营人权益差异</li>
                        <li>分析投资风险与收益预期</li>
                        <li>解答您的所有疑问</li>
                    </ul>
                    <div class="step-actions">
                        <button class="btn btn-primary" onclick="startConsultation()">开始咨询</button>
                        <button class="btn btn-outline" onclick="scheduleCall()">预约电话</button>
                    </div>
                </div>
            `
        },
        2: {
            title: '资质审核',
            content: `
                <div class="step-detail">
                    <h4>第二步：提交申请资料</h4>
                    <div class="required-documents">
                        <h5>所需材料：</h5>
                        <ul>
                            <li>身份证明文件</li>
                            <li>收入证明或资产证明</li>
                            <li>银行流水（近6个月）</li>
                            <li>投资经验证明（如有）</li>
                        </ul>
                    </div>
                    <div class="review-process">
                        <h5>审核流程：</h5>
                        <ul>
                            <li>材料完整性检查（1个工作日）</li>
                            <li>资质评估与风险测评（2个工作日）</li>
                            <li>审核结果通知</li>
                        </ul>
                    </div>
                </div>
            `
        },
        3: {
            title: '签署协议',
            content: `
                <div class="step-detail">
                    <h4>第三步：签署投资协议</h4>
                    <div class="agreement-process">
                        <ul>
                            <li>详细阅读投资协议条款</li>
                            <li>法务团队解答协议疑问</li>
                            <li>确认投资金额和期限</li>
                            <li>签署正式投资协议</li>
                            <li>完成投资款项支付</li>
                        </ul>
                    </div>
                    <div class="legal-protection">
                        <h5>法律保障：</h5>
                        <ul>
                            <li>专业律师团队起草协议</li>
                            <li>第三方资金监管</li>
                            <li>完善的争议解决机制</li>
                        </ul>
                    </div>
                </div>
            `
        },
        4: {
            title: '正式加入',
            content: `
                <div class="step-detail">
                    <h4>第四步：成为联合经营人</h4>
                    <div class="onboarding-process">
                        <ul>
                            <li>获得经营人证书和专属编号</li>
                            <li>开通会员权益管理系统</li>
                            <li>参加新人欢迎仪式</li>
                            <li>分配专属客户经理</li>
                            <li>开始享受分红和权益</li>
                        </ul>
                    </div>
                    <div class="welcome-benefits">
                        <h5>入会礼遇：</h5>
                        <ul>
                            <li>专属欢迎礼盒</li>
                            <li>首次分红提前发放</li>
                            <li>康养基地体验券</li>
                            <li>高端沙龙活动邀请</li>
                        </ul>
                    </div>
                </div>
            `
        }
    };
    
    const step = stepDetails[stepNumber];
    const modal = createModal(step.title, step.content);
    showModal(modal);
}

// 成功案例轮播
function initializeSuccessStories() {
    const storiesGrid = document.querySelector('.stories-grid');
    if (!storiesGrid) return;
    
    // 添加轮播控制
    addStoriesCarousel();
    
    // 自动轮播
    startStoriesAutoplay();
}

function addStoriesCarousel() {
    const storiesSection = document.querySelector('.success-stories');
    const controls = document.createElement('div');
    controls.className = 'carousel-controls';
    controls.innerHTML = `
        <button class="carousel-btn prev" onclick="previousStory()">‹</button>
        <div class="carousel-dots">
            <span class="dot active" onclick="showStory(0)"></span>
            <span class="dot" onclick="showStory(1)"></span>
            <span class="dot" onclick="showStory(2)"></span>
        </div>
        <button class="carousel-btn next" onclick="nextStory()">›</button>
    `;
    
    storiesSection.querySelector('.container').appendChild(controls);
}

let currentStoryIndex = 0;
let storyAutoplayInterval;

function startStoriesAutoplay() {
    storyAutoplayInterval = setInterval(() => {
        nextStory();
    }, 5000);
}

function showStory(index) {
    const stories = document.querySelectorAll('.story-card');
    const dots = document.querySelectorAll('.carousel-dots .dot');
    
    stories.forEach((story, i) => {
        story.style.display = i === index ? 'block' : 'none';
    });
    
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
    
    currentStoryIndex = index;
}

function nextStory() {
    const totalStories = document.querySelectorAll('.story-card').length;
    currentStoryIndex = (currentStoryIndex + 1) % totalStories;
    showStory(currentStoryIndex);
}

function previousStory() {
    const totalStories = document.querySelectorAll('.story-card').length;
    currentStoryIndex = (currentStoryIndex - 1 + totalStories) % totalStories;
    showStory(currentStoryIndex);
}

// FAQ系统
function initializeFAQSystem() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', function() {
            toggleFAQItem(item);
        });
    });
    
    // 添加FAQ搜索
    addFAQSearch();
}

function toggleFAQItem(item) {
    const answer = item.querySelector('.faq-answer');
    const toggle = item.querySelector('.faq-toggle');
    const isActive = item.classList.contains('active');
    
    if (isActive) {
        item.classList.remove('active');
        answer.style.maxHeight = '0';
        toggle.textContent = '+';
    } else {
        // 关闭其他FAQ
        document.querySelectorAll('.faq-item.active').forEach(activeItem => {
            activeItem.classList.remove('active');
            activeItem.querySelector('.faq-answer').style.maxHeight = '0';
            activeItem.querySelector('.faq-toggle').textContent = '+';
        });
        
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
        toggle.textContent = '−';
    }
}

// RWA图表交互
function initializeRWADiagram() {
    const diagram = document.querySelector('.rwa-diagram');
    if (!diagram) return;
    
    const nodes = diagram.querySelectorAll('.node');
    
    nodes.forEach(node => {
        node.addEventListener('click', function() {
            showNodeDetail(this);
        });
        
        node.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1)';
        });
        
        node.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    });
}

function showNodeDetail(node) {
    const nodeText = node.querySelector('span').textContent;
    const nodeDetails = {
        '原料基地': {
            title: '全球原料基地',
            content: `
                <div class="node-detail">
                    <img src="images/wellness_lifestyle_20260125_202546.png" alt="原料基地" class="node-image">
                    <div class="node-info">
                        <h4>优质原料保障</h4>
                        <ul>
                            <li>马来西亚燕窝基地</li>
                            <li>深海花胶养殖场</li>
                            <li>有机草本种植园</li>
                            <li>严格质量控制体系</li>
                        </ul>
                        <p>投资原料基地，确保产品质量稳定，成本可控。</p>
                    </div>
                </div>
            `
        },
        '生产工厂': {
            title: '现代化生产工厂',
            content: `
                <div class="node-detail">
                    <img src="images/gift_box_product_20260125_202546.png" alt="生产工厂" class="node-image">
                    <div class="node-info">
                        <h4>智能化生产线</h4>
                        <ul>
                            <li>GMP标准生产车间</li>
                            <li>自动化包装设备</li>
                            <li>全程质量追溯系统</li>
                            <li>年产能1000万盒</li>
                        </ul>
                        <p>投资生产设施，提升产能效率，降低生产成本。</p>
                    </div>
                </div>
            `
        },
        '销售渠道': {
            title: '多元化销售网络',
            content: `
                <div class="node-detail">
                    <img src="images/gala_event_20260125_202548.png" alt="销售渠道" class="node-image">
                    <div class="node-info">
                        <h4>全渠道销售布局</h4>
                        <ul>
                            <li>线上电商平台</li>
                            <li>线下体验店</li>
                            <li>会员直销系统</li>
                            <li>企业团购渠道</li>
                        </ul>
                        <p>投资销售网络，扩大市场覆盖，提升品牌影响力。</p>
                    </div>
                </div>
            `
        },
        '康养中心': {
            title: '高端康养中心',
            content: `
                <div class="node-detail">
                    <img src="images/rwa_concept_20260125_202547.png" alt="康养中心" class="node-image">
                    <div class="node-info">
                        <h4>全方位康养服务</h4>
                        <ul>
                            <li>专业体检中心</li>
                            <li>个性化调理方案</li>
                            <li>高端住宿设施</li>
                            <li>会员专属服务</li>
                        </ul>
                        <p>投资康养中心，提供增值服务，增强客户粘性。</p>
                    </div>
                </div>
            `
        }
    };
    
    const detail = nodeDetails[nodeText];
    if (detail) {
        const modal = createModal(detail.title, detail.content);
        showModal(modal);
    }
}

// 咨询模态框
function showConsultationModal(planType) {
    const planNames = {
        angel: '天使经营人',
        founder: '创始经营人',
        strategic: '战略经营人'
    };
    
    const planName = planNames[planType];
    
    const modal = createModal(`${planName}咨询`, `
        <div class="consultation-form">
            <div class="plan-summary">
                <h4>您选择的计划：${planName}</h4>
                <div class="plan-highlights">
                    ${getPlanHighlights(planType)}
                </div>
            </div>
            <form id="consultationForm">
                <div class="form-group">
                    <label>姓名 *</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>手机号 *</label>
                    <input type="tel" name="phone" required>
                </div>
                <div class="form-group">
                    <label>邮箱</label>
                    <input type="email" name="email">
                </div>
                <div class="form-group">
                    <label>投资金额（万元）</label>
                    <input type="number" name="amount" min="5" max="1000">
                </div>
                <div class="form-group">
                    <label>咨询内容</label>
                    <textarea name="message" placeholder="请描述您的具体需求或问题"></textarea>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">提交咨询</button>
                    <button type="button" class="btn btn-outline" onclick="scheduleCall()">预约电话</button>
                </div>
            </form>
        </div>
    `);
    
    showModal(modal);
    
    // 绑定表单提交事件
    const form = modal.querySelector('#consultationForm');
    form.addEventListener('submit', handleConsultationSubmit);
}

function getPlanHighlights(planType) {
    const highlights = {
        angel: `
            <ul>
                <li>最低投资：¥5万</li>
                <li>年化分红：5%</li>
                <li>季度分红发放</li>
                <li>专属礼盒优惠</li>
            </ul>
        `,
        founder: `
            <ul>
                <li>最低投资：¥20万</li>
                <li>年化分红：12%</li>
                <li>月度分红发放</li>
                <li>核心决策参与权</li>
            </ul>
        `,
        strategic: `
            <ul>
                <li>最低投资：¥100万</li>
                <li>年化分红：25%</li>
                <li>年度分红发放</li>
                <li>股权优先认购权</li>
            </ul>
        `
    };
    
    return highlights[planType];
}

function handleConsultationSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // 简单验证
    if (!data.name || !data.phone) {
        showNotification('请填写姓名和手机号', 'error');
        return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(data.phone)) {
        showNotification('请输入有效的手机号', 'error');
        return;
    }
    
    // 提交咨询
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.textContent = '提交中...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        showNotification('咨询提交成功！专业顾问将在24小时内与您联系。', 'success');
        hideModal(document.querySelector('.modal'));
    }, 2000);
}

// 工具函数
function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
        </div>
    `;
    
    modal.querySelector('.modal-close').addEventListener('click', () => {
        hideModal(modal);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal(modal);
        }
    });
    
    return modal;
}

function showModal(modal) {
    document.body.appendChild(modal);
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function hideModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => {
        if (modal.parentNode) {
            document.body.removeChild(modal);
        }
    }, 300);
}

// 全局函数
window.startApplication = function() {
    showNotification('正在跳转到申请页面...', 'info');
    setTimeout(() => {
        window.location.href = 'contact.html';
    }, 1000);
};

window.downloadBrochure = function() {
    showNotification('正在准备下载资料...', 'info');
    // 实际应用中应该触发文件下载
};

window.startConsultation = function() {
    showConsultationModal('founder');
};

window.scheduleCall = function() {
    showNotification('正在为您安排电话咨询...', 'info');
};

window.nextStory = nextStory;
window.previousStory = previousStory;
window.showStory = showStory;

// 导出RWA页面函数
window.RWAPage = {
    showConsultationModal,
    calculateReturns,
    showPlanComparison
};