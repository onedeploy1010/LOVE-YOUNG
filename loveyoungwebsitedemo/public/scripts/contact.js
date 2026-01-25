// 联系页面专用JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeContactPage();
});

function initializeContactPage() {
    initializeContactForm();
    initializeVisitForm();
    initializeFAQSystem();
    initializeTeamMembers();
    initializeContactMethods();
}

// 联系表单增强
function initializeContactForm() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;
    
    // 表单验证
    const inputs = contactForm.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
    
    // 表单提交
    contactForm.addEventListener('submit', handleContactFormSubmit);
    
    // 字符计数
    const messageTextarea = contactForm.querySelector('textarea[name="message"]');
    if (messageTextarea) {
        addCharacterCounter(messageTextarea);
    }
}

// 字段验证
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    switch (field.name) {
        case 'name':
            if (!value) {
                errorMessage = '请输入姓名';
                isValid = false;
            } else if (value.length < 2) {
                errorMessage = '姓名至少需要2个字符';
                isValid = false;
            }
            break;
            
        case 'phone':
            if (!value) {
                errorMessage = '请输入手机号';
                isValid = false;
            } else if (!/^1[3-9]\d{9}$/.test(value)) {
                errorMessage = '请输入有效的手机号';
                isValid = false;
            }
            break;
            
        case 'email':
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errorMessage = '请输入有效的邮箱地址';
                isValid = false;
            }
            break;
            
        case 'type':
            if (!value) {
                errorMessage = '请选择咨询类型';
                isValid = false;
            }
            break;
            
        case 'message':
            if (!value) {
                errorMessage = '请输入详细需求';
                isValid = false;
            } else if (value.length < 10) {
                errorMessage = '请详细描述您的需求（至少10个字符）';
                isValid = false;
            }
            break;
    }
    
    showFieldError(field, errorMessage, !isValid);
    return isValid;
}

// 显示字段错误
function showFieldError(field, message, hasError) {
    // 移除现有错误
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    field.classList.toggle('error', hasError);
    
    if (hasError && message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    }
}

// 清除字段错误
function clearFieldError(e) {
    const field = e.target;
    field.classList.remove('error');
    const errorDiv = field.parentNode.querySelector('.field-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// 添加字符计数器
function addCharacterCounter(textarea) {
    const maxLength = 500;
    const counter = document.createElement('div');
    counter.className = 'character-counter';
    counter.textContent = `0/${maxLength}`;
    
    textarea.parentNode.appendChild(counter);
    textarea.setAttribute('maxlength', maxLength);
    
    textarea.addEventListener('input', function() {
        const currentLength = this.value.length;
        counter.textContent = `${currentLength}/${maxLength}`;
        counter.classList.toggle('warning', currentLength > maxLength * 0.8);
        counter.classList.toggle('danger', currentLength > maxLength * 0.95);
    });
}

// 处理联系表单提交
function handleContactFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // 验证所有字段
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isFormValid = true;
    
    inputs.forEach(input => {
        if (!validateField({ target: input })) {
            isFormValid = false;
        }
    });
    
    // 检查协议同意
    const agreeCheckbox = form.querySelector('input[name="agree"]');
    if (!agreeCheckbox.checked) {
        showNotification('请同意隐私政策和服务条款', 'error');
        isFormValid = false;
    }
    
    if (!isFormValid) {
        return;
    }
    
    // 提交表单
    submitContactForm(data, form);
}

// 提交联系表单
function submitContactForm(data, form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    // 显示提交状态
    submitBtn.textContent = '提交中...';
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    
    // 模拟提交过程
    setTimeout(() => {
        // 模拟成功响应
        const success = Math.random() > 0.1; // 90% 成功率
        
        if (success) {
            showNotification('咨询提交成功！我们将在24小时内与您联系。', 'success');
            form.reset();
            
            // 显示感谢信息
            showThankYouMessage(data);
        } else {
            showNotification('提交失败，请稍后重试或直接联系客服。', 'error');
        }
        
        // 恢复按钮状态
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }, 2000);
}

// 显示感谢信息
function showThankYouMessage(data) {
    const modal = createModal('感谢您的咨询', `
        <div class="thank-you-content">
            <div class="thank-you-icon">✅</div>
            <h3>咨询提交成功！</h3>
            <p>亲爱的 ${data.name}，感谢您对 Love Young 的关注。</p>
            <p>我们已收到您关于"${getConsultationType(data.type)}"的咨询，专业顾问将在24小时内通过手机 ${data.phone} 与您联系。</p>
            <div class="next-steps">
                <h4>接下来您可以：</h4>
                <ul>
                    <li>关注我们的微信公众号获取最新资讯</li>
                    <li>浏览我们的产品了解更多详情</li>
                    <li>预约参观我们的康养基地</li>
                </ul>
            </div>
        </div>
    `);
    
    showModal(modal);
}

// 获取咨询类型中文名
function getConsultationType(type) {
    const types = {
        'product': '产品咨询',
        'rwa': 'RWA投资咨询',
        'member': '会员服务',
        'cooperation': '商务合作',
        'other': '其他咨询'
    };
    return types[type] || '咨询';
}

// 预约参观表单
function initializeVisitForm() {
    const visitForm = document.getElementById('visitForm');
    if (!visitForm) return;
    
    visitForm.addEventListener('submit', handleVisitFormSubmit);
    
    // 日期限制（只能选择未来的日期）
    const dateInput = visitForm.querySelector('input[type="date"]');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.setAttribute('min', today);
        
        // 排除周末（可选）
        dateInput.addEventListener('change', function() {
            const selectedDate = new Date(this.value);
            const dayOfWeek = selectedDate.getDay();
            
            if (dayOfWeek === 0 || dayOfWeek === 6) {
                showNotification('建议选择工作日参观，我们将为您安排更好的服务', 'info');
            }
        });
    }
}

// 处理预约表单提交
function handleVisitFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // 简单验证
    if (!data.name || !data.phone || !data.location || !data.date) {
        showNotification('请填写所有必填项', 'error');
        return;
    }
    
    // 验证手机号
    if (!/^1[3-9]\d{9}$/.test(data.phone)) {
        showNotification('请输入有效的手机号', 'error');
        return;
    }
    
    // 验证日期
    const selectedDate = new Date(data.date);
    const today = new Date();
    if (selectedDate <= today) {
        showNotification('请选择未来的日期', 'error');
        return;
    }
    
    submitVisitForm(data, form);
}

// 提交预约表单
function submitVisitForm(data, form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    submitBtn.textContent = '提交中...';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        showNotification('预约提交成功！我们将尽快与您确认参观时间。', 'success');
        form.reset();
        
        // 显示预约确认信息
        showVisitConfirmation(data);
        
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }, 1500);
}

// 显示预约确认
function showVisitConfirmation(data) {
    const locationNames = {
        'headquarters': '上海总部',
        'factory': '生产基地',
        'wellness': '康养中心'
    };
    
    const modal = createModal('预约确认', `
        <div class="visit-confirmation">
            <div class="confirmation-icon">📅</div>
            <h3>预约提交成功！</h3>
            <div class="appointment-details">
                <div class="detail-item">
                    <span class="label">预约人：</span>
                    <span class="value">${data.name}</span>
                </div>
                <div class="detail-item">
                    <span class="label">联系电话：</span>
                    <span class="value">${data.phone}</span>
                </div>
                <div class="detail-item">
                    <span class="label">参观地点：</span>
                    <span class="value">${locationNames[data.location]}</span>
                </div>
                <div class="detail-item">
                    <span class="label">预约日期：</span>
                    <span class="value">${data.date}</span>
                </div>
                ${data.note ? `
                <div class="detail-item">
                    <span class="label">备注：</span>
                    <span class="value">${data.note}</span>
                </div>
                ` : ''}
            </div>
            <p class="confirmation-note">我们将在1个工作日内与您联系确认具体参观时间。</p>
        </div>
    `);
    
    showModal(modal);
}

// FAQ系统增强
function initializeFAQSystem() {
    const faqCategories = document.querySelectorAll('.faq-category');
    const faqLists = document.querySelectorAll('.faq-list');
    const faqItems = document.querySelectorAll('.faq-item');
    
    // 分类切换
    faqCategories.forEach(category => {
        category.addEventListener('click', function() {
            const targetCategory = this.dataset.category;
            
            faqCategories.forEach(cat => cat.classList.remove('active'));
            this.classList.add('active');
            
            faqLists.forEach(list => {
                list.style.display = list.dataset.category === targetCategory ? 'block' : 'none';
            });
        });
    });
    
    // FAQ展开/收起
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', function() {
            toggleFAQItem(item);
        });
    });
    
    // 搜索功能
    addFAQSearch();
}

// 切换FAQ项目
function toggleFAQItem(item) {
    const answer = item.querySelector('.faq-answer');
    const toggle = item.querySelector('.faq-toggle');
    const isActive = item.classList.contains('active');
    
    if (isActive) {
        item.classList.remove('active');
        answer.style.maxHeight = '0';
        toggle.textContent = '+';
    } else {
        // 关闭其他打开的FAQ
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

// 添加FAQ搜索功能
function addFAQSearch() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'faq-search';
    searchContainer.innerHTML = `
        <input type="text" placeholder="搜索常见问题..." class="faq-search-input">
        <button class="faq-search-btn">🔍</button>
    `;
    
    const faqSection = document.querySelector('.faq-section .container');
    const faqCategories = document.querySelector('.faq-categories');
    
    faqSection.insertBefore(searchContainer, faqCategories);
    
    const searchInput = searchContainer.querySelector('.faq-search-input');
    const searchBtn = searchContainer.querySelector('.faq-search-btn');
    
    searchInput.addEventListener('input', debounce(searchFAQ, 300));
    searchBtn.addEventListener('click', () => searchFAQ(searchInput.value));
}

// 搜索FAQ
function searchFAQ(query) {
    const searchQuery = query.toLowerCase().trim();
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (!searchQuery) {
        // 显示所有FAQ
        faqItems.forEach(item => {
            item.style.display = 'block';
        });
        return;
    }
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question h4').textContent.toLowerCase();
        const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();
        
        if (question.includes(searchQuery) || answer.includes(searchQuery)) {
            item.style.display = 'block';
            // 高亮搜索结果
            highlightSearchTerm(item, searchQuery);
        } else {
            item.style.display = 'none';
        }
    });
}

// 高亮搜索词
function highlightSearchTerm(item, term) {
    const question = item.querySelector('.faq-question h4');
    const answer = item.querySelector('.faq-answer p');
    
    [question, answer].forEach(element => {
        const text = element.textContent;
        const regex = new RegExp(`(${term})`, 'gi');
        const highlightedText = text.replace(regex, '<mark>$1</mark>');
        element.innerHTML = highlightedText;
    });
}

// 团队成员互动
function initializeTeamMembers() {
    const teamMembers = document.querySelectorAll('.team-member');
    
    teamMembers.forEach(member => {
        member.addEventListener('click', function() {
            showMemberDetail(this);
        });
    });
}

// 显示团队成员详情
function showMemberDetail(memberElement) {
    const name = memberElement.querySelector('.member-name').textContent;
    const role = memberElement.querySelector('.member-role').textContent;
    const exp = memberElement.querySelector('.member-exp').textContent;
    const avatar = memberElement.querySelector('.member-avatar').src;
    
    const modal = createModal(`${name} - ${role}`, `
        <div class="member-detail">
            <img src="${avatar}" alt="${name}" class="member-detail-avatar">
            <div class="member-detail-info">
                <h3>${name}</h3>
                <p class="member-detail-role">${role}</p>
                <p class="member-detail-exp">${exp}</p>
                <div class="member-specialties">
                    <h4>专业领域：</h4>
                    <ul>
                        ${getMemberSpecialties(role)}
                    </ul>
                </div>
                <div class="contact-member">
                    <button class="btn btn-primary" onclick="contactMember('${name}')">联系${name}</button>
                </div>
            </div>
        </div>
    `);
    
    showModal(modal);
}

// 获取成员专业领域
function getMemberSpecialties(role) {
    const specialties = {
        '康养产品专家': [
            '<li>产品成分分析与配方优化</li>',
            '<li>个性化康养方案定制</li>',
            '<li>产品使用指导与效果评估</li>'
        ],
        'RWA投资专家': [
            '<li>RWA模式设计与风险评估</li>',
            '<li>投资组合优化建议</li>',
            '<li>财务规划与收益分析</li>'
        ],
        '会员服务专家': [
            '<li>会员权益规划与管理</li>',
            '<li>客户关系维护与提升</li>',
            '<li>服务流程优化与改进</li>'
        ]
    };
    
    return (specialties[role] || ['<li>专业咨询服务</li>']).join('');
}

// 联系团队成员
function contactMember(memberName) {
    showNotification(`正在为您连接${memberName}，请稍候...`, 'info');
    
    setTimeout(() => {
        const modal = createModal(`联系${memberName}`, `
            <div class="contact-member-form">
                <p>请选择联系方式：</p>
                <div class="contact-options">
                    <button class="btn btn-primary" onclick="scheduleCall('${memberName}')">预约电话咨询</button>
                    <button class="btn btn-outline" onclick="sendMessage('${memberName}')">发送消息</button>
                    <button class="btn btn-outline" onclick="scheduleVisit('${memberName}')">预约面谈</button>
                </div>
            </div>
        `);
        
        showModal(modal);
    }, 1000);
}

// 联系方式功能
function initializeContactMethods() {
    // 复制联系信息
    const contactCards = document.querySelectorAll('.contact-card');
    
    contactCards.forEach(card => {
        card.addEventListener('click', function() {
            const contactMain = this.querySelector('.contact-main').textContent;
            copyToClipboard(contactMain);
            showNotification('联系信息已复制到剪贴板', 'success');
        });
    });
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
    
    // 绑定关闭事件
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

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        // 兼容旧浏览器
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }
}

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

// 全局函数（供HTML调用）
window.contactMember = contactMember;
window.scheduleCall = function(memberName) {
    showNotification(`正在为您安排与${memberName}的电话咨询...`, 'info');
    hideModal(document.querySelector('.modal'));
};

window.sendMessage = function(memberName) {
    showNotification(`正在打开与${memberName}的消息窗口...`, 'info');
    hideModal(document.querySelector('.modal'));
};

window.scheduleVisit = function(memberName) {
    showNotification(`正在为您安排与${memberName}的面谈...`, 'info');
    hideModal(document.querySelector('.modal'));
};

// 导出联系页面函数
window.ContactPage = {
    validateField,
    searchFAQ,
    showMemberDetail
};