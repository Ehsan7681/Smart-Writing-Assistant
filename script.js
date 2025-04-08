// ثبت سرویس ورکر برای PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker ثبت شد با موفقیت:', registration.scope);
            })
            .catch(error => {
                console.log('ثبت Service Worker با خطا مواجه شد:', error);
            });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const editor = document.getElementById('editor');
    const wordCountElement = document.getElementById('wordCount');
    const charCountElement = document.getElementById('charCount');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const saveBtn = document.getElementById('saveBtn');
    const aiHelpBtn = document.getElementById('aiHelpBtn');
    const suggestionList = document.getElementById('suggestionList');
    
    // عناصر مربوط به تنظیمات
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const apiKeyInput = document.getElementById('apiKey');
    const validateApiBtn = document.getElementById('validateApiBtn');
    const apiStatus = document.getElementById('apiStatus');
    const modelSelect = document.getElementById('modelSelect');
    const modelInfo = document.getElementById('modelInfo');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    
    // متغیرهای مربوط به تنظیمات
    let apiKey = localStorage.getItem('aiWriter_apiKey') || '';
    let selectedModel = localStorage.getItem('aiWriter_selectedModel') || '';
    let availableModels = [];
    let isApiConnected = false;
    
    // متغیرهای مرتبط با پروژه‌ها
    let projects = [];
    let currentProject = null;
    
    // متغیر برای نگهداری تایمر ذخیره‌سازی خودکار
    let autoSaveTimer = null;
    
    // اضافه کردن دکمه تولید ایده
    const toolbarRight = document.querySelector('.toolbar-right') || document.querySelector('.toolbar');
    const generateIdeaBtn = document.createElement('button');
    generateIdeaBtn.id = 'generateIdeaBtn';
    generateIdeaBtn.className = 'btn';
    generateIdeaBtn.innerHTML = '<i class="fas fa-lightbulb"></i> تولید ایده';
    
    // افزودن دکمه به نوار ابزار (بعد از دکمه کمک هوشمند)
    if (aiHelpBtn && aiHelpBtn.parentNode) {
        aiHelpBtn.parentNode.insertBefore(generateIdeaBtn, aiHelpBtn.nextSibling);
    } else if (toolbarRight) {
        toolbarRight.appendChild(generateIdeaBtn);
    }
    
    // ایجاد مودال تولید ایده
    const ideaModal = document.createElement('div');
    ideaModal.id = 'ideaModal';
    ideaModal.className = 'modal';
    ideaModal.innerHTML = `
        <div class="modal-content idea-modal-content">
            <div class="modal-header">
                <h3>تولید ایده</h3>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="idea-categories">
                    <button class="idea-category-btn active" data-category="character">ایده شخصیت‌ها</button>
                    <button class="idea-category-btn" data-category="story">ایده داستان</button>
                    <button class="idea-category-btn" data-category="dialogue">ایده دیالوگ</button>
                </div>
                <div class="idea-content">
                    <div class="idea-loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>در حال تولید ایده‌های جدید...</p>
                    </div>
                    <div class="idea-result"></div>
                    <div class="idea-error" style="display: none;">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>خطا در دریافت ایده‌ها. لطفاً دوباره تلاش کنید.</p>
                    </div>
                </div>
                <div class="idea-actions">
                    <button id="regenerateIdeaBtn" class="btn"><i class="fas fa-sync-alt"></i> تولید مجدد</button>
                    <button id="copyIdeaBtn" class="btn"><i class="fas fa-copy"></i> کپی</button>
                    <button id="useIdeaBtn" class="btn"><i class="fas fa-check"></i> استفاده</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(ideaModal);
    
    // عناصر مودال تولید ایده
    const closeIdeaModalBtn = ideaModal.querySelector('.close-modal');
    const ideaCategoryBtns = ideaModal.querySelectorAll('.idea-category-btn');
    const ideaLoading = ideaModal.querySelector('.idea-loading');
    const ideaResult = ideaModal.querySelector('.idea-result');
    const ideaError = ideaModal.querySelector('.idea-error');
    const regenerateIdeaBtn = document.getElementById('regenerateIdeaBtn');
    const copyIdeaBtn = document.getElementById('copyIdeaBtn');
    const useIdeaBtn = document.getElementById('useIdeaBtn');
    
    // متغیر برای نگهداری ایده فعلی
    let currentIdea = '';
    let currentCategory = 'character';
    
    // استایل برای مودال تولید ایده
    const ideaStyleElement = document.createElement('style');
    ideaStyleElement.textContent = `
        .idea-modal-content {
            max-width: 600px;
        }
        
        .idea-categories {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .idea-category-btn {
            padding: 8px 15px;
            background-color: var(--light-color);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .idea-category-btn.active {
            background-color: var(--accent-color);
            color: white;
        }
        
        .idea-content {
            min-height: 200px;
            max-height: 400px;
            overflow-y: auto;
            padding: 15px;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            margin-bottom: 20px;
        }
        
        .idea-loading, .idea-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 200px;
            gap: 15px;
        }
        
        .idea-loading i, .idea-error i {
            font-size: 2rem;
        }
        
        .idea-error i {
            color: var(--error-color);
        }
        
        .idea-result {
            line-height: 1.6;
        }
        
        .idea-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        }
        
        #generateIdeaBtn {
            background-color: var(--accent-color);
            color: white;
        }
        
        #generateIdeaBtn:hover {
            background-color: var(--accent-hover-color);
        }
    `;
    document.head.appendChild(ideaStyleElement);
    
    // عناصر مدیریت پروژه
    const projectTitleInput = document.getElementById('currentProjectTitle');
    const newProjectBtn = document.getElementById('newProjectBtn');
    const createProjectBtn = document.getElementById('createProjectBtn');
    const newProjectModal = document.getElementById('newProjectModal');
    const closeNewProjectModal = newProjectModal.querySelector('.close-modal');
    
    // بازیابی متن ذخیره شده
    function loadSavedText() {
        // اگر پروژه فعلی وجود ندارد، متن ذخیره شده قبلی را بارگذاری کن
        if (!currentProject) {
            const savedText = localStorage.getItem('aiWriter_text');
            if (savedText) {
                editor.value = savedText;
                updateWordAndCharCount();
            }
        }
    }
    
    // ذخیره متن در localStorage هنگام تغییر
    function saveText() {
        if (currentProject) {
            updateProject(currentProject.id, {
                content: editor.value,
                title: document.getElementById('currentProjectTitle').value
            });
        } else {
            localStorage.setItem('aiWriter_text', editor.value);
        }
    }
    
    // رویداد تغییر متن
    editor.addEventListener('input', function() {
        updateWordAndCharCount();
        saveText();
    });
    
    // ایجاد المان‌های جستجوی مدل
    function createModelSearchElements() {
        // حذف select موجود
        const parentElement = modelSelect.parentElement;
        parentElement.removeChild(modelSelect);
        
        // ایجاد کانتینر جستجو
        const searchContainer = document.createElement('div');
        searchContainer.className = 'select-search-container';
        
        // ایجاد ورودی جستجو
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.id = 'modelSearchInput';
        searchInput.className = 'select-search-input';
        searchInput.placeholder = 'جستجو در مدل‌ها...';
        searchInput.disabled = true;
        
        // ایجاد آیکون جستجو
        const searchIcon = document.createElement('span');
        searchIcon.className = 'select-search-icon';
        searchIcon.innerHTML = '<i class="fas fa-search"></i>';
        
        // ایجاد لیست کشویی
        const dropdown = document.createElement('div');
        dropdown.className = 'select-search-dropdown';
        dropdown.id = 'modelSearchDropdown';
        
        // اضافه کردن المان‌ها به کانتینر
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(searchIcon);
        searchContainer.appendChild(dropdown);
        
        // اضافه کردن کانتینر به والد
        parentElement.insertBefore(searchContainer, parentElement.firstChild);
        
        return {
            container: searchContainer,
            input: searchInput,
            dropdown: dropdown
        };
    }
    
    // ایجاد المان‌های جستجوی مدل
    const modelSearchElements = createModelSearchElements();
    
    // رویداد کلیک روی ورودی جستجو
    modelSearchElements.input.addEventListener('click', function() {
        if (!this.disabled) {
            toggleSearchDropdown(true);
        }
    });
    
    // رویداد تایپ در ورودی جستجو
    modelSearchElements.input.addEventListener('input', function() {
        filterModels(this.value);
    });
    
    // کلیک بیرون از لیست کشویی برای بستن آن
    document.addEventListener('click', function(event) {
        if (!modelSearchElements.container.contains(event.target)) {
            toggleSearchDropdown(false);
        }
    });
    
    // نمایش یا مخفی کردن لیست کشویی
    function toggleSearchDropdown(show) {
        if (show) {
            modelSearchElements.dropdown.classList.add('show');
        } else {
            modelSearchElements.dropdown.classList.remove('show');
        }
    }
    
    // فیلتر کردن مدل‌ها بر اساس متن جستجو
    function filterModels(searchText) {
        const options = modelSearchElements.dropdown.querySelectorAll('.select-search-option');
        const categories = modelSearchElements.dropdown.querySelectorAll('.select-search-category');
        
        searchText = searchText.toLowerCase();
        let hasResults = false;
        
        // رست کردن نمایش همه دسته‌ها
        categories.forEach(category => {
            category.style.display = 'block';
        });
        
        // بررسی هر گزینه
        options.forEach(option => {
            const text = option.textContent.toLowerCase();
            const categoryId = option.getAttribute('data-category');
            
            if (text.includes(searchText)) {
                option.style.display = 'block';
                hasResults = true;
                
                // نمایش دسته مربوطه
                document.querySelector(`.select-search-category[data-category="${categoryId}"]`).style.display = 'block';
            } else {
                option.style.display = 'none';
            }
        });
        
        // پنهان کردن دسته‌های خالی
        categories.forEach(category => {
            const categoryId = category.getAttribute('data-category');
            const visibleOptions = modelSearchElements.dropdown.querySelectorAll(`.select-search-option[data-category="${categoryId}"]:not([style*="display: none"])`);
            
            if (visibleOptions.length === 0) {
                category.style.display = 'none';
            }
        });
        
        // نمایش پیام "نتیجه‌ای یافت نشد" اگر هیچ مدلی پیدا نشد
        const noResultsElement = modelSearchElements.dropdown.querySelector('.select-search-no-results');
        if (noResultsElement) {
            noResultsElement.style.display = hasResults ? 'none' : 'block';
        }
    }
    
    // اگر از قبل کلید API و مدل ذخیره شده‌اند، آن‌ها را بارگذاری کنیم
    function loadSavedSettings() {
        if (apiKey) {
            apiKeyInput.value = apiKey;
            validateApiKey();
        }
    }
    
    // ذخیره تنظیمات
    saveSettingsBtn.addEventListener('click', function() {
        if (!isApiConnected) {
            alert('لطفاً ابتدا اعتبار API را بررسی کنید.');
            return;
        }
        
        // بررسی اینکه آیا مدلی انتخاب شده است
        const selectedModelId = getSelectedModelId();
        if (!selectedModelId) {
            alert('لطفاً یک مدل هوش مصنوعی انتخاب کنید.');
            return;
        }
        
        // ذخیره تنظیمات در localStorage
        localStorage.setItem('aiWriter_apiKey', apiKey);
        localStorage.setItem('aiWriter_selectedModel', selectedModelId);
        selectedModel = selectedModelId;
        
        // نمایش پیام موفقیت
        alert('تنظیمات با موفقیت ذخیره شد.');
        
        // بستن مودال
        settingsModal.classList.remove('show');
    });
    
    // دریافت شناسه مدل انتخاب شده
    function getSelectedModelId() {
        const selected = modelSearchElements.dropdown.querySelector('.select-search-option.selected');
        return selected ? selected.getAttribute('data-value') : '';
    }
    
    // باز و بسته کردن مودال تنظیمات
    settingsBtn.addEventListener('click', function() {
        settingsModal.classList.add('show');
    });
    
    closeModalBtn.addEventListener('click', function() {
        settingsModal.classList.remove('show');
    });
    
    // کلیک خارج از مودال برای بستن آن
    window.addEventListener('click', function(event) {
        if (event.target === settingsModal) {
            settingsModal.classList.remove('show');
        }
    });
    
    // بررسی اعتبار کلید API
    validateApiBtn.addEventListener('click', validateApiKey);
    
    async function validateApiKey() {
        const key = apiKeyInput.value.trim();
        
        if (!key) {
            alert('لطفاً یک کلید API وارد کنید.');
            return;
        }
        
        // تغییر وضعیت نمایشی
        apiStatus.className = 'api-status checking';
        apiStatus.innerHTML = '<i class="fas fa-spinner"></i>';
        validateApiBtn.disabled = true;
        
        try {
            // دریافت لیست مدل‌ها از اوپن روتر
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('خطا در اعتبارسنجی API');
            }
            
            const data = await response.json();
            
            // اگر با موفقیت دریافت شد، لیست مدل‌ها را ذخیره کنیم
            availableModels = data.data || [];
            
            // وضعیت اتصال را به متصل تغییر دهیم
            apiStatus.className = 'api-status connected';
            apiStatus.innerHTML = '<i class="fas fa-check-circle"></i>';
            isApiConnected = true;
            
            // فعال کردن انتخاب مدل
            modelSearchElements.input.disabled = false;
            
            // پر کردن لیست مدل‌ها
            populateModelSearchDropdown(availableModels);
            
            // فعال کردن دکمه ذخیره
            saveSettingsBtn.classList.remove('disabled');
            
            // ذخیره کلید API
            apiKey = key;
            
        } catch (error) {
            console.error(error);
            apiStatus.className = 'api-status not-connected';
            apiStatus.innerHTML = '<i class="fas fa-times-circle"></i>';
            isApiConnected = false;
            
            // غیرفعال کردن انتخاب مدل
            modelSearchElements.input.disabled = true;
            modelSearchElements.dropdown.innerHTML = '';
            modelSearchElements.input.value = '';
            
            // نمایش خطا
            alert('کلید API نامعتبر است یا خطایی در اتصال رخ داده است.');
        } finally {
            validateApiBtn.disabled = false;
        }
    }
    
    // پر کردن لیست کشویی مدل‌ها
    function populateModelSearchDropdown(models) {
        // مرتب‌سازی مدل‌ها بر اساس ارائه‌دهنده
        const modelsByProvider = {};
        
        models.forEach(model => {
            const provider = model.provider || 'نامشخص';
            if (!modelsByProvider[provider]) {
                modelsByProvider[provider] = [];
            }
            modelsByProvider[provider].push(model);
        });
        
        // تخلیه لیست کشویی
        modelSearchElements.dropdown.innerHTML = '';
        
        // اضافه کردن مدل‌ها به لیست کشویی با گروه‌بندی و مرتب‌سازی
        const sortedProviders = Object.keys(modelsByProvider).sort();
        
        // اگر هیچ مدلی وجود نداشت
        if (sortedProviders.length === 0) {
            const noModels = document.createElement('div');
            noModels.className = 'select-search-no-results';
            noModels.textContent = 'هیچ مدلی یافت نشد';
            modelSearchElements.dropdown.appendChild(noModels);
            return;
        }
        
        // اضافه کردن عنصر برای نمایش "نتیجه‌ای یافت نشد" در حالت جستجو
        const noResults = document.createElement('div');
        noResults.className = 'select-search-no-results';
        noResults.textContent = 'نتیجه‌ای برای جستجوی شما یافت نشد';
        noResults.style.display = 'none';
        modelSearchElements.dropdown.appendChild(noResults);
        
        // اضافه کردن ارائه‌دهندگان و مدل‌های آن‌ها به ترتیب الفبایی
        sortedProviders.forEach((provider, providerIndex) => {
            // اضافه کردن عنوان دسته
            const category = document.createElement('div');
            category.className = 'select-search-category';
            category.textContent = provider;
            category.setAttribute('data-category', `category-${providerIndex}`);
            modelSearchElements.dropdown.appendChild(category);
            
            // مرتب‌سازی مدل‌ها در هر دسته بر اساس نام
            const sortedModels = modelsByProvider[provider].sort((a, b) => {
                const nameA = a.name || a.id;
                const nameB = b.name || b.id;
                return nameA.localeCompare(nameB);
            });
            
            // اضافه کردن مدل‌ها
            sortedModels.forEach(model => {
                const option = document.createElement('div');
                option.className = 'select-search-option';
                option.textContent = model.name || model.id;
                option.setAttribute('data-value', model.id);
                option.setAttribute('data-category', `category-${providerIndex}`);
                
                // اگر این مدل قبلاً انتخاب شده، آن را علامت‌گذاری کنیم
                if (selectedModel === model.id) {
                    option.classList.add('selected');
                    modelSearchElements.input.value = option.textContent;
                    updateModelInfo(model);
                }
                
                // رویداد کلیک برای انتخاب مدل
                option.addEventListener('click', function() {
                    // حذف کلاس انتخاب از همه گزینه‌ها
                    const allOptions = modelSearchElements.dropdown.querySelectorAll('.select-search-option');
                    allOptions.forEach(opt => opt.classList.remove('selected'));
                    
                    // اضافه کردن کلاس انتخاب به این گزینه
                    this.classList.add('selected');
                    
                    // به‌روزرسانی متن ورودی
                    modelSearchElements.input.value = this.textContent;
                    
                    // بستن لیست کشویی
                    toggleSearchDropdown(false);
                    
                    // به‌روزرسانی اطلاعات مدل
                    const modelId = this.getAttribute('data-value');
                    const model = availableModels.find(m => m.id === modelId);
                    if (model) {
                        updateModelInfo(model);
                    }
                });
                
                modelSearchElements.dropdown.appendChild(option);
            });
        });
    }
    
    // به‌روزرسانی اطلاعات مدل انتخاب شده
    function updateModelInfo(model) {
        let infoHTML = '';
        
        if (model.name) {
            infoHTML += `<p><strong>نام: </strong>${model.name}</p>`;
        }
        
        infoHTML += `<p><strong>ارائه‌دهنده: </strong>${model.provider || 'نامشخص'}</p>`;
        
        if (model.description) {
            infoHTML += `<p><strong>توضیحات: </strong>${model.description}</p>`;
        }
        
        if (model.context_length) {
            infoHTML += `<p><strong>حداکثر طول متن: </strong>${model.context_length.toLocaleString()} کاراکتر</p>`;
        }
        
        modelInfo.innerHTML = infoHTML;
    }
    
    // کنترل ویژگی تعداد کلمات و کاراکترها
    function updateWordAndCharCount() {
        const text = editor.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        const chars = text.length;
        
        wordCountElement.textContent = words;
        charCountElement.textContent = chars;
    }
    
    // دکمه پاک کردن
    clearBtn.addEventListener('click', function() {
        if (confirm('آیا مطمئن هستید که می‌خواهید متن را پاک کنید؟')) {
            editor.value = '';
            updateWordAndCharCount();
            localStorage.removeItem('aiWriter_text');
        }
    });
    
    // دکمه کپی
    copyBtn.addEventListener('click', function() {
        editor.select();
        document.execCommand('copy');
        
        // انیمیشن تأیید کپی شدن
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="fas fa-check"></i> کپی شد';
        
        setTimeout(() => {
            this.innerHTML = originalText;
        }, 2000);
    });
    
    // دکمه ذخیره
    saveBtn.addEventListener('click', function() {
        const text = editor.value;
        const blob = new Blob([text], {type: 'text/plain'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'متن-من.txt';
        a.click();
        
        URL.revokeObjectURL(url);
    });
    
    // دکمه کمک هوشمند
    aiHelpBtn.addEventListener('click', async function() {
        const text = editor.value.trim();
        
        if (text) {
            // بررسی آیا کاربر API و مدل انتخاب کرده است
            if (!apiKey || !selectedModel) {
                alert('لطفاً ابتدا API و مدل هوش مصنوعی را در تنظیمات پیکربندی کنید.');
                settingsModal.classList.add('show');
                return;
            }
            
            // پیشنهادات متن انتخاب شده و متن کامل را با هم نمایش می‌دهیم
            let suggestions = [];
            
            // پیشنهادات برای متن انتخاب شده
            const selectedText = getSelectedText();
            if (selectedText) {
                const selectedSuggestions = generateSelectedTextSuggestions(selectedText);
                suggestions = [...suggestions, ...selectedSuggestions];
            }
            
            // همیشه پیشنهادات متن کامل را نمایش بده
            const fullTextSuggestions = generateFullTextSuggestions(text);
            suggestions = [...suggestions, ...fullTextSuggestions];
            
            // نمایش همه پیشنهادات
            displaySuggestions(suggestions);
        } else {
            alert('لطفاً ابتدا متنی را وارد کنید.');
        }
    });
    
    // دریافت متن انتخاب شده
    function getSelectedText() {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        
        if (start !== end) {
            return {
                text: editor.value.substring(start, end),
                start: start,
                end: end
            };
        }
        
        return null;
    }
    
    // تولید پیشنهادات برای کل متن - بدون تولید محتوا
    function generateFullTextSuggestions(text) {
        // ارائه پیشنهادات بدون دریافت محتوا از API
        return [
            {
                title: 'ادامه متن داستان',
                text: 'چند پاراگراف پیوسته و منسجم برای ادامه داستان شما',
                type: 'completion',
                prompt: `شما یک نویسنده داستان حرفه‌ای و خبره هستید. 

ابتدا داستان زیر را با دقت مطالعه کنید. سپس یک خلاصه ذهنی از داستان، شخصیت‌ها، موقعیت‌ها و نقطه‌ای که داستان قطع شده تهیه کنید، اما این خلاصه را ننویسید.

داستان را دقیقاً از همان نقطه‌ای که قطع شده ادامه دهید، بدون هیچ مقدمه یا توضیح اضافی. حتی یک کلمه توضیح یا مقدمه ننویسید، فقط ادامه مستقیم داستان را بنویسید.

ادامه داستان باید:
1. کاملاً با بخش‌های قبلی داستان یکپارچه و مرتبط باشد
2. همان سبک نگارشی، لحن و فضای داستان اصلی را حفظ کند
3. به شخصیت‌ها، جزئیات و دنیای داستان وفادار باشد
4. به طور منطقی رویدادها و موقعیت‌های موجود را گسترش دهد
5. حداقل 3 پاراگراف منسجم و مرتبط به هم باشد
6. به ‌طور طبیعی و روان از آخرین جمله داستان اصلی ادامه یابد
7. هیچ بازگویی یا خلاصه‌ای از قسمت‌های قبلی داستان نداشته باشد

داستان اصلی:
"""
${text}
"""

ادامه مستقیم داستان از دقیقاً همان نقطه‌ای که قطع شده است:`,
                needsFetch: true
            },
            {
                title: 'اصلاح سبک نگارش',
                text: 'پیشنهاد اصلاح سبک نگارشی متن شما',
                type: 'style',
                prompt: `شما یک ویراستار حرفه‌ای هستید. لطفاً این متن را از نظر سبک نگارشی بررسی کنید و پیشنهادات مشخص و کاربردی برای بهبود آن ارائه دهید. پیشنهادات باید مستقیماً به نقاط قوت و ضعف سبک نگارشی اشاره کنند:

"""
${text}
"""`,
                needsFetch: true
            },
            {
                title: 'بهبود انسجام',
                text: 'پیشنهاد بهبود انسجام و ارتباط بین بخش‌های متن شما',
                type: 'coherence',
                prompt: `شما یک ویراستار متخصص در انسجام متن هستید. لطفاً این متن را از نظر انسجام، پیوستگی و ارتباط منطقی بین بخش‌ها بررسی کنید و پیشنهادات مشخص برای بهبود آن ارائه دهید:

"""
${text}
"""`,
                needsFetch: true
            }
        ];
    }
    
    // تولید پیشنهادات برای متن انتخاب شده - بدون تولید محتوا
    function generateSelectedTextSuggestions(selection) {
        // ارائه پیشنهادات بدون دریافت محتوا از API
        return [
            {
                title: 'بازنویسی پاراگراف',
                text: 'بازنویسی متن انتخاب شده با ساختار رسمی‌تر و منسجم‌تر',
                type: 'rewrite',
                selectionData: selection,
                prompt: `شما یک نویسنده حرفه‌ای هستید. این متن را بازنویسی کنید با رعایت ساختار رسمی‌تر و منسجم‌تر بدون تغییر معنی اصلی:
"""
${selection.text}
"""`,
                needsFetch: true
            },
            {
                title: 'بهبود احساسات متن',
                text: 'بازنویسی متن انتخاب شده با احساسات بیشتر و لحن عاطفی‌تر',
                type: 'emotion',
                selectionData: selection,
                prompt: `شما یک نویسنده احساسی هستید. این متن را با احساسات بیشتر و لحن عاطفی‌تر بازنویسی کنید بدون تغییر معنی اصلی:
"""
${selection.text}
"""`,
                needsFetch: true
            },
            {
                title: 'اصلاح نگارشی',
                text: 'اصلاح متن انتخاب شده از نظر نگارشی و دستوری',
                type: 'grammar',
                selectionData: selection,
                prompt: `شما یک ویراستار حرفه‌ای هستید. این متن را از نظر نگارشی و دستوری تصحیح کنید و نشانه‌گذاری مناسب اضافه نمایید:
"""
${selection.text}
"""`,
                needsFetch: true
            }
        ];
    }
    
    // تولید پیشنهادات با API هوش مصنوعی
    async function generateAISuggestionsWithAPI(textData) {
        // نمایش حالت بارگذاری
        suggestionList.innerHTML = '<div class="suggestion loading-suggestion"><i class="fas fa-spinner fa-spin"></i><p>در حال آماده‌سازی پیشنهادات...</p></div>';
        
        try {
            // تولید پیشنهادات متناسب با نوع درخواست
            let suggestions = [];
            
            if (textData.fullText) {
                // پیشنهاد برای کل متن
                suggestions = generateFullTextSuggestions(textData.text);
            } else {
                // پیشنهاد برای متن انتخاب شده
                suggestions = generateSelectedTextSuggestions(textData);
            }
            
            // نمایش پیشنهادات
            displaySuggestions(suggestions);
            
        } catch (error) {
            console.error('خطا در آماده‌سازی پیشنهادات:', error);
            suggestionList.innerHTML = '<div class="suggestion error-suggestion"><i class="fas fa-exclamation-circle"></i><p>خطا در آماده‌سازی پیشنهادات. لطفاً دوباره تلاش کنید.</p></div>';
        }
    }
    
    // دریافت پاسخ از API برای یک پرامپت مشخص
    async function fetchAIResponse(prompt) {
        try {
            // بررسی اینکه آیا API و مدل انتخاب شده‌اند
            if (!apiKey || !selectedModel) {
                alert('لطفاً ابتدا API و مدل هوش مصنوعی را در تنظیمات پیکربندی کنید.');
                settingsModal.classList.add('show');
                return null;
            }

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: [
                        { role: 'system', content: 'شما یک دستیار نویسنده حرفه‌ای هستید. لطفاً پاسخ کوتاه و مستقیم بدهید، فقط متن درخواستی را برگردانید بدون هیچ توضیح اضافی.' },
                        { role: 'user', content: prompt }
                    ]
                })
            });
            
            if (!response.ok) {
                throw new Error('خطا در دریافت پاسخ از API');
            }
            
            const data = await response.json();
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error('خطا در ارتباط با API:', error);
            return null;
        }
    }
    
    // نمایش پیشنهادات در رابط کاربری
    function displaySuggestions(suggestions) {
        // پاک کردن پیشنهادات قبلی
        suggestionList.innerHTML = '';
        
        // نمایش همه آیتم‌ها در یک صفحه (ابتدا آیتم‌های انتخاب نشده)
        const fullTextSuggestions = suggestions.filter(s => !['rewrite', 'emotion', 'grammar'].includes(s.type));
        const selectedTextSuggestions = suggestions.filter(s => ['rewrite', 'emotion', 'grammar'].includes(s.type));
        
        // اگر کاربر متنی انتخاب نکرده، پیشنهادات متن کامل و راهنما را نشان بده
        if (selectedTextSuggestions.length === 0) {
            // افزودن راهنمای انتخاب متن
            const helpElement = document.createElement('div');
            helpElement.className = 'suggestion help-suggestion';
            
            const helpIcon = document.createElement('i');
            helpIcon.className = 'fas fa-lightbulb';
            
            const helpText = document.createElement('p');
            helpText.innerHTML = '<strong>راهنما:</strong> برای دریافت پیشنهادات بازنویسی، بهبود احساسات و اصلاح نگارشی، ابتدا بخشی از متن را انتخاب کنید و سپس روی دکمه "کمک هوشمند" کلیک کنید.';
            
            // افزودن دکمه بستن راهنما
            const closeButton = document.createElement('span');
            closeButton.className = 'close-help';
            closeButton.innerHTML = '<i class="fas fa-times"></i>';
            closeButton.addEventListener('click', function() {
                helpElement.style.display = 'none';
            });
            
            helpElement.appendChild(helpIcon);
            helpElement.appendChild(helpText);
            helpElement.appendChild(closeButton);
            suggestionList.appendChild(helpElement);
        }
        
        // اضافه کردن همه پیشنهادات به لیست (اول پیشنهادات متن انتخاب شده، سپس پیشنهادات متن کامل)
        [...selectedTextSuggestions, ...fullTextSuggestions].forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion';
            suggestionElement.dataset.type = suggestion.type;
            
            const title = document.createElement('h4');
            title.textContent = suggestion.title;
            title.className = 'suggestion-title';
            
            const p = document.createElement('p');
            p.textContent = suggestion.text;
            p.className = 'suggestion-text';
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'suggestion-buttons';
            
            const fetchButton = document.createElement('button');
            fetchButton.className = 'fetch-btn';
            fetchButton.textContent = 'دریافت پیشنهاد';
            
            // دکمه اعمال در ابتدا غیرفعال است
            const applyButton = document.createElement('button');
            applyButton.className = 'apply-btn disabled';
            applyButton.textContent = 'اعمال';
            applyButton.disabled = true;
            
            // رویداد دریافت پیشنهاد از هوش مصنوعی
            fetchButton.addEventListener('click', async function() {
                // تغییر وضعیت به حالت در حال بارگذاری
                p.innerHTML = '<i class="fas fa-spinner fa-spin"></i> در حال دریافت پیشنهاد...';
                fetchButton.disabled = true;
                
                try {
                    // دریافت پاسخ از API
                    const response = await fetchAIResponse(suggestion.prompt);
                    
                    if (response) {
                        // بروزرسانی متن پیشنهاد
                        p.textContent = response;
                        
                        // اگر نوع پیشنهاد ادامه متن است، متن کامل را به روز کنیم
                        if (suggestion.type === 'completion') {
                            suggestion.text = response;
                        } else if (['rewrite', 'emotion', 'grammar'].includes(suggestion.type)) {
                            suggestion.text = response;
                        }
                        
                        // فعال کردن دکمه اعمال
                        applyButton.classList.remove('disabled');
                        applyButton.disabled = false;
                    } else {
                        p.textContent = 'خطا در دریافت پیشنهاد. لطفاً دوباره تلاش کنید.';
                    }
                } catch (error) {
                    console.error('خطا در دریافت پیشنهاد:', error);
                    p.textContent = 'خطا در دریافت پیشنهاد. لطفاً دوباره تلاش کنید.';
                } finally {
                    // فعال کردن دوباره دکمه دریافت
                    fetchButton.disabled = false;
                }
            });
            
            // رویداد اعمال پیشنهاد
            applyButton.addEventListener('click', function() {
                applySuggestion(suggestion);
            });
            
            // اضافه کردن قابلیت کلیک روی کل آیتم برای دریافت پیشنهاد
            suggestionElement.addEventListener('click', function(e) {
                // اگر روی دکمه‌ها کلیک نشده باشد
                if (!e.target.closest('button')) {
                    // اگر دکمه دریافت پیشنهاد غیرفعال نیست، روی آن کلیک کن
                    if (!fetchButton.disabled) {
                        fetchButton.click();
                    }
                }
            });
            
            // افزودن کلاس قابل کلیک
            suggestionElement.classList.add('clickable-suggestion');
            
            buttonContainer.appendChild(fetchButton);
            buttonContainer.appendChild(applyButton);
            
            suggestionElement.appendChild(title);
            suggestionElement.appendChild(p);
            suggestionElement.appendChild(buttonContainer);
            suggestionList.appendChild(suggestionElement);
        });
        
        // نمایش انیمیشن برای جلب توجه کاربر
        document.getElementById('aiSuggestions').classList.add('highlight');
        setTimeout(() => {
            document.getElementById('aiSuggestions').classList.remove('highlight');
        }, 1000);
    }
    
    // اعمال پیشنهاد
    async function applySuggestion(suggestion) {
        // بسته به نوع پیشنهاد، عملکرد متفاوتی داشته باشیم
        if (suggestion.type === 'completion') {
            // در مورد تکمیل متن، محتوا را به انتهای متن اضافه می‌کنیم
            const text = editor.value;
            
            // بررسی دقیق‌تر نحوه اتصال متن با توجه به آخرین جمله داستان
            let separator = '';
            const trimmedText = text.trim();
            
            // آیا آخرین جمله کامل است یا ناتمام؟
            const lastCharacter = trimmedText.slice(-1);
            const endsWithPunctuation = /[.!?،؛:؟!.]/.test(lastCharacter);
            const endsWithQuote = /["'»"]/.test(lastCharacter);
            const lastLine = trimmedText.split('\n').pop().trim();
            
            // تنظیم جداکننده مناسب
            if (trimmedText.endsWith('\n\n')) {
                // اگر متن با دو خط جدید پایان می‌یابد، نیازی به جداکننده نیست
                separator = '';
            } else if (trimmedText.endsWith('\n')) {
                // اگر متن با یک خط جدید پایان می‌یابد، نیازی به جداکننده نیست
                separator = '';
            } else if (endsWithPunctuation && !endsWithQuote && lastLine.length > 20) {
                // اگر با نقطه، علامت سؤال و غیره پایان می‌یابد و خط آخر طولانی است، یک خط جدید اضافه می‌کنیم
                separator = '\n';
            } else if (endsWithPunctuation && !endsWithQuote) {
                // اگر با نقطه پایان می‌یابد و آخرین خط کوتاه است (احتمالاً خط دیالوگ)، فقط یک فاصله اضافه می‌کنیم
                separator = ' ';
            } else if (endsWithQuote) {
                // اگر با نقل قول پایان می‌یابد، احتمالاً ادامه دیالوگ است، فقط یک فاصله اضافه می‌کنیم
                separator = ' ';
            } else {
                // اگر متن با یک جمله ناتمام پایان می‌یابد، هیچ جداکننده‌ای اضافه نمی‌کنیم
                separator = '';
            }
            
            // قبل از اضافه کردن متن جدید، ابتدا آن را پردازش می‌کنیم تا مطمئن شویم با متن قبلی همخوانی دارد
            let processedNewText = suggestion.text.trim();
            const firstCharOfNewText = processedNewText.charAt(0);
            
            // اگر متن اصلی با نقطه پایان یافته و متن جدید با حرف بزرگ شروع نشده، اصلاح می‌کنیم
            if (endsWithPunctuation && firstCharOfNewText === firstCharOfNewText.toLowerCase() && 
                !/["'«]/.test(firstCharOfNewText) && !/\d/.test(firstCharOfNewText)) {
                processedNewText = firstCharOfNewText.toUpperCase() + processedNewText.slice(1);
            }
            
            // افزودن متن ادامه داستان
            editor.value = text + separator + processedNewText;
            
            // انتقال مکان‌نما به انتهای متن
            editor.setSelectionRange(editor.value.length, editor.value.length);
            editor.focus();
        } else if (['rewrite', 'emotion', 'grammar'].includes(suggestion.type)) {
            // برای پیشنهادات متن انتخاب شده، از متن آماده شده در پیشنهاد استفاده می‌کنیم
            const before = editor.value.substring(0, suggestion.selectionData.start);
            const after = editor.value.substring(suggestion.selectionData.end);
            editor.value = before + suggestion.text + after;
            
            // تنظیم مکان‌نما پس از متن جایگزین شده
            const newPosition = suggestion.selectionData.start + suggestion.text.length;
            editor.setSelectionRange(newPosition, newPosition);
            editor.focus();
        } else if (suggestion.type === 'style' || suggestion.type === 'coherence') {
            // این پیشنهادات معمولاً فقط توصیه‌هایی هستند که کاربر باید خودش اعمال کند
            alert('این پیشنهاد به عنوان راهنمایی برای بهبود متن شما ارائه شده است. لطفاً با توجه به آن، متن خود را ویرایش کنید.');
        }
        
        // به‌روزرسانی شمارنده کلمات و ذخیره متن
        updateWordAndCharCount();
        saveText();
    }
    
    // افکت تایپ در پیش‌نمایش
    if (editor.placeholder) {
        const placeholder = editor.placeholder;
        editor.placeholder = '';
        
        let i = 0;
        const typeInterval = setInterval(() => {
            if (i < placeholder.length) {
                editor.placeholder += placeholder.charAt(i);
                i++;
            } else {
                clearInterval(typeInterval);
            }
        }, 100);
    }
    
    // اضافه کردن کلاس فعال به المان‌ها هنگام هاور
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseover', function() {
            this.classList.add('active');
        });
        
        button.addEventListener('mouseout', function() {
            this.classList.remove('active');
        });
    });
    
    // استایل برای حالت بارگذاری و خطا
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .loading-suggestion, .error-suggestion {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .loading-suggestion i {
            color: var(--accent-color);
            font-size: 18px;
        }
        
        .error-suggestion i {
            color: var(--error-color);
            font-size: 18px;
        }
        
        .suggestion-buttons {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        
        .fetch-btn {
            background-color: var(--dark-color);
            color: #fff;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .fetch-btn:hover {
            background-color: var(--dark-hover-color);
        }
        
        .fetch-btn:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        
        .apply-btn.disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        
        .clickable-suggestion {
            cursor: pointer;
            transition: background-color 0.2s, transform 0.2s;
            border: 1px solid transparent;
        }
        
        .clickable-suggestion:hover {
            background-color: var(--light-hover-color);
            transform: translateY(-2px);
            border: 1px solid var(--accent-color);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        .clickable-suggestion .suggestion-title {
            color: var(--accent-color);
        }
        
        #suggestionList {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
        }
        
        .suggestion {
            padding: 15px;
            border-radius: 8px;
            background-color: white;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        .help-suggestion {
            grid-column: 1 / -1;
            background-color: #f8f9fa;
            border-left: 4px solid var(--accent-color);
        }
    `;
    document.head.appendChild(styleElement);
    
    // اجرای اولیه شمارنده کلمات و بارگذاری تنظیمات
    updateWordAndCharCount();
    loadSavedSettings();
    loadSavedText();
    
    // رویداد دکمه تولید ایده
    generateIdeaBtn.addEventListener('click', function() {
        // بررسی تنظیمات API
        if (!apiKey || !selectedModel) {
            alert('لطفاً ابتدا API و مدل هوش مصنوعی را در تنظیمات پیکربندی کنید.');
            settingsModal.classList.add('show');
            return;
        }
        
        // نمایش مودال
        ideaModal.classList.add('show');
        
        // تولید ایده برای دسته فعلی
        generateIdea(currentCategory);
    });
    
    // بستن مودال تولید ایده
    closeIdeaModalBtn.addEventListener('click', function() {
        ideaModal.classList.remove('show');
    });
    
    // کلیک خارج از مودال برای بستن آن
    window.addEventListener('click', function(event) {
        if (event.target === ideaModal) {
            ideaModal.classList.remove('show');
        }
    });
    
    // رویداد دکمه‌های دسته‌بندی ایده
    ideaCategoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // حذف کلاس active از همه دکمه‌ها
            ideaCategoryBtns.forEach(b => b.classList.remove('active'));
            
            // افزودن کلاس active به دکمه کلیک شده
            this.classList.add('active');
            
            // تنظیم دسته فعلی
            currentCategory = this.dataset.category;
            
            // تولید ایده برای دسته جدید
            generateIdea(currentCategory);
        });
    });
    
    // رویداد دکمه تولید مجدد
    regenerateIdeaBtn.addEventListener('click', function() {
        generateIdea(currentCategory);
    });
    
    // رویداد دکمه کپی
    copyIdeaBtn.addEventListener('click', function() {
        if (currentIdea) {
            // کپی ایده به کلیپ‌بورد
            navigator.clipboard.writeText(currentIdea)
                .then(() => {
                    // انیمیشن تأیید کپی شدن
                    const originalText = this.innerHTML;
                    this.innerHTML = '<i class="fas fa-check"></i> کپی شد';
                    
                    setTimeout(() => {
                        this.innerHTML = originalText;
                    }, 2000);
                })
                .catch(err => {
                    console.error('خطا در کپی کردن: ', err);
                });
        }
    });
    
    // رویداد دکمه استفاده
    useIdeaBtn.addEventListener('click', function() {
        if (currentIdea) {
            // افزودن ایده به ویرایشگر
            const cursorPos = editor.selectionStart;
            const textBefore = editor.value.substring(0, cursorPos);
            const textAfter = editor.value.substring(cursorPos);
            
            // بررسی نیاز به فاصله یا خط جدید
            let separator = '';
            if (textBefore.length > 0 && !textBefore.endsWith('\n')) {
                separator = '\n\n';
            }
            
            // افزودن ایده به متن
            editor.value = textBefore + separator + currentIdea + (textAfter.startsWith('\n') ? '' : '\n') + textAfter;
            
            // تنظیم مکان‌نما پس از ایده
            const newCursorPos = cursorPos + separator.length + currentIdea.length + (textAfter.startsWith('\n') ? 0 : 1);
            editor.setSelectionRange(newCursorPos, newCursorPos);
            editor.focus();
            
            // به‌روزرسانی شمارنده کلمات و ذخیره متن
            updateWordAndCharCount();
            saveText();
            
            // بستن مودال
            ideaModal.classList.remove('show');
        }
    });
    
    // تابع تولید ایده بر اساس دسته
    async function generateIdea(category) {
        // نمایش حالت بارگذاری
        ideaLoading.style.display = 'flex';
        ideaResult.style.display = 'none';
        ideaError.style.display = 'none';
        
        try {
            // ساخت پرامپت بر اساس دسته
            let prompt = '';
            switch (category) {
                case 'character':
                    prompt = 'لطفاً 5 ایده برای شخصیت‌های داستانی جذاب و چند بعدی ارائه دهید. برای هر شخصیت، نام، خصوصیات شخصیتی اصلی و یک پیش‌زمینه کوتاه بنویسید.';
                    break;
                case 'story':
                    prompt = 'لطفاً 5 ایده داستانی جذاب در ژانرهای مختلف ارائه دهید. برای هر ایده، یک عنوان، خلاصه داستان و نکته‌ای منحصر به فرد که آن را متمایز می‌کند بنویسید.';
                    break;
                case 'dialogue':
                    prompt = 'لطفاً 5 نمونه دیالوگ قوی و تأثیرگذار برای موقعیت‌های مختلف داستانی ارائه دهید. برای هر دیالوگ، زمینه و شخصیت‌های درگیر را توضیح دهید.';
                    break;
                default:
                    prompt = 'لطفاً 5 ایده خلاقانه برای نویسندگی ارائه دهید.';
            }
            
            // دریافت ایده از API
            const result = await fetchAIResponse(prompt);
            
            if (result) {
                // تنظیم نتیجه
                currentIdea = result;
                
                // نمایش نتیجه با قالب‌بندی مناسب
                const formattedResult = result
                    .replace(/\n/g, '<br>')
                    .replace(/(\d+[\-\.\)]+)/g, '<strong>$1</strong>');
                
                ideaResult.innerHTML = formattedResult;
                ideaResult.style.display = 'block';
            } else {
                throw new Error('نتیجه‌ای دریافت نشد.');
            }
        } catch (error) {
            console.error('خطا در تولید ایده:', error);
            ideaError.style.display = 'flex';
        } finally {
            ideaLoading.style.display = 'none';
        }
    }

    // مدیریت پروژه‌ها
    function loadProjects() {
        const savedProjects = localStorage.getItem('aiWriter_projects');
        if (savedProjects) {
            projects = JSON.parse(savedProjects);
            updateProjectsList();
        }
    }

    function saveProjects() {
        localStorage.setItem('aiWriter_projects', JSON.stringify(projects));
    }

    function createNewProject(title, type, description) {
        const newProject = {
            id: Date.now().toString(),
            title: title,
            type: type,
            description: description || '',
            content: '',
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            // حذف آرایه structure
            characters: []
        };
        
        projects.push(newProject);
        saveProjects();
        setCurrentProject(newProject.id);
        return newProject;
    }

    function updateProject(projectId, updates) {
        const projectIndex = projects.findIndex(p => p.id === projectId);
        if (projectIndex !== -1) {
            projects[projectIndex] = { ...projects[projectIndex], ...updates, lastModified: new Date().toISOString() };
            saveProjects();
        }
    }

    function deleteProject(projectId) {
        projects = projects.filter(p => p.id !== projectId);
        saveProjects();
        
        if (currentProject && currentProject.id === projectId) {
            if (projects.length > 0) {
                setCurrentProject(projects[0].id);
            } else {
                setCurrentProject(null);
            }
        }
        
        updateProjectsList();
    }

    function setCurrentProject(projectId) {
        // ذخیره پروژه فعلی قبل از تغییر
        if (currentProject) {
            updateProject(currentProject.id, {
                content: editor.value,
                title: document.getElementById('currentProjectTitle').value
            });
        }
        
        if (!projectId) {
            currentProject = null;
            editor.value = '';
            document.getElementById('currentProjectTitle').value = '';
            updateWordAndCharCount();
            return;
        }
        
        const project = projects.find(p => p.id === projectId);
        if (project) {
            currentProject = project;
            editor.value = project.content;
            document.getElementById('currentProjectTitle').value = project.title;
            updateWordAndCharCount();
            
            // به‌روزرسانی UI برای نشان دادن پروژه فعال
            document.querySelectorAll('.project-card').forEach(card => {
                if (card.dataset.projectId === projectId) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        }
    }

    function updateProjectsList() {
        const projectsList = document.getElementById('projectsList');
        projectsList.innerHTML = '';
        
        if (projects.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'empty-projects-message';
            emptyMessage.innerHTML = `
                <i class="fas fa-book"></i>
                <p>هنوز هیچ پروژه‌ای ایجاد نکرده‌اید. برای شروع روی دکمه "پروژه جدید" کلیک کنید.</p>
            `;
            projectsList.appendChild(emptyMessage);
            return;
        }
        
        projects.forEach(project => {
            const projectCard = document.createElement('div');
            projectCard.className = `project-card ${currentProject && currentProject.id === project.id ? 'active' : ''}`;
            projectCard.dataset.projectId = project.id;
            
            // محاسبه تعداد کلمات
            const wordCount = project.content.split(/\s+/).filter(word => word.length > 0).length;
            
            // تبدیل تاریخ به فرمت نمایشی
            const lastModifiedDate = new Date(project.lastModified);
            const formattedDate = lastModifiedDate.toLocaleDateString('fa-IR');
            
            projectCard.innerHTML = `
                <h3>${project.title}</h3>
                <div class="project-meta">${getProjectTypeName(project.type)} • آخرین ویرایش: ${formattedDate}</div>
                <div class="project-stats">
                    <span><i class="fas fa-font"></i> ${wordCount} کلمه</span>
                    <span><i class="fas fa-user"></i> ${project.characters.length} شخصیت</span>
                </div>
                <div class="project-actions">
                    <button class="btn small-btn delete-project-btn"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            // رویداد کلیک برای انتخاب پروژه
            projectCard.addEventListener('click', function(e) {
                // اگر دکمه حذف کلیک شده، کاری نکن (رویداد آن جداگانه مدیریت می‌شود)
                if (e.target.closest('.delete-project-btn')) return;
                
                setCurrentProject(project.id);
                
                // تغییر به تب ویرایشگر
                document.querySelector('.tab-btn[data-tab="editor"]').click();
            });
            
            // رویداد دکمه حذف
            const deleteBtn = projectCard.querySelector('.delete-project-btn');
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (confirm(`آیا مطمئن هستید که می‌خواهید پروژه "${project.title}" را حذف کنید؟`)) {
                    deleteProject(project.id);
                }
            });
            
            projectsList.appendChild(projectCard);
        });
    }

    function getProjectTypeName(type) {
        switch (type) {
            case 'novel': return 'رمان';
            case 'short_story': return 'داستان کوتاه';
            case 'screenplay': return 'فیلمنامه';
            case 'other': default: return 'سایر';
        }
    }

    // رویداد تغییر عنوان پروژه
    projectTitleInput.addEventListener('input', function() {
        if (currentProject) {
            updateProject(currentProject.id, { title: this.value });
            updateProjectsList();
        }
    });
    
    // رویدادهای مدیریت تب‌ها
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            // تغییر وضعیت active تب‌ها
            document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // نمایش محتوای تب فعال
            document.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
            });
            document.getElementById(`${tabId}Tab`).style.display = 'block';
        });
    });
    
    // رویداد دکمه استخراج شخصیت‌ها از متن
    document.getElementById('extractCharactersBtn').addEventListener('click', function() {
        extractCharactersFromStory();
    });
    
    // رویداد باز کردن مودال پروژه جدید
    newProjectBtn.addEventListener('click', function() {
        document.getElementById('newProjectTitle').value = '';
        document.getElementById('newProjectType').value = 'novel';
        document.getElementById('newProjectDescription').value = '';
        newProjectModal.classList.add('show');
    });
    
    // رویداد بستن مودال پروژه جدید
    closeNewProjectModal.addEventListener('click', function() {
        newProjectModal.classList.remove('show');
    });
    
    // کلیک خارج از مودال
    window.addEventListener('click', function(event) {
        if (event.target === newProjectModal) {
            newProjectModal.classList.remove('show');
        }
    });
    
    // رویداد ایجاد پروژه جدید
    createProjectBtn.addEventListener('click', function() {
        const title = document.getElementById('newProjectTitle').value.trim();
        const type = document.getElementById('newProjectType').value;
        const description = document.getElementById('newProjectDescription').value.trim();
        
        if (!title) {
            alert('لطفاً عنوان پروژه را وارد کنید.');
            return;
        }
        
        createNewProject(title, type, description);
        updateProjectsList();
        
        // بستن مودال
        newProjectModal.classList.remove('show');
        
        // تغییر به تب ویرایشگر
        document.querySelector('.tab-btn[data-tab="editor"]').click();
    });

    // بارگذاری اولیه پروژه‌ها
    loadProjects();

    // رویداد کلیک روی دکمه خلاصه‌سازی
    document.getElementById('summarizeBtn').addEventListener('click', function() {
        if (!editor.value.trim()) {
            alert('لطفاً ابتدا متنی را وارد کنید.');
            return;
        }

        if (!apiKey || !selectedModel) {
            alert('لطفاً ابتدا API و مدل هوش مصنوعی را در تنظیمات پیکربندی کنید.');
            settingsModal.classList.add('show');
            return;
        }

        // نمایش تب خلاصه داستان
        document.querySelector('.tab-btn[data-tab="analysis"]').click();
        document.querySelectorAll('.analysis-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.analysis-tab-btn[data-analysis-tab="summary"]').classList.add('active');

        document.querySelectorAll('.analysis-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById('summaryAnalysisTab').style.display = 'block';

        // اجرای خودکار تولید خلاصه
        generateSummary();
    });

    // رویداد کلیک روی دکمه تولید خلاصه
    document.getElementById('generateSummaryBtn').addEventListener('click', generateSummary);

    // رویداد کلیک روی دکمه کپی خلاصه
    document.getElementById('copySummaryBtn').addEventListener('click', function() {
        const summaryText = document.getElementById('summaryResult').textContent;
        navigator.clipboard.writeText(summaryText)
            .then(() => {
                // تغییر موقت متن دکمه برای نمایش عملیات موفق
                this.innerHTML = '<i class="fas fa-check"></i> کپی شد';
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-copy"></i> کپی';
                }, 2000);
            })
            .catch(err => {
                console.error('خطا در کپی متن:', err);
                alert('خطا در کپی متن به کلیپ‌بورد.');
            });
    });

    // رویداد کلیک روی دکمه تولید مجدد خلاصه
    document.getElementById('regenerateSummaryBtn').addEventListener('click', generateSummary);

    // تابع تولید خلاصه داستان
    async function generateSummary() {
        const summaryResult = document.getElementById('summaryResult');
        const summaryLoading = document.querySelector('.summary-loading');
        const summaryActions = document.querySelector('.summary-actions');
        const summaryLength = document.getElementById('summaryLengthSelect').value;
        const summaryStyle = document.getElementById('summaryStyleSelect').value;
        
        if (!editor.value.trim()) {
            summaryResult.innerHTML = '<p class="no-summary-message">متن داستان خالی است. لطفاً ابتدا متنی را در ویرایشگر وارد کنید.</p>';
            summaryActions.style.display = 'none';
            return;
        }
        
        // نمایش حالت بارگذاری
        summaryLoading.style.display = 'flex';
        summaryResult.style.display = 'none';
        summaryActions.style.display = 'none';
        
        try {
            // تنظیم پرامپت با توجه به طول و سبک خلاصه
            let lengthInstruction = '';
            switch (summaryLength) {
                case 'short':
                    lengthInstruction = 'خلاصه کوتاه در حد یک پاراگراف';
                    break;
                case 'medium':
                    lengthInstruction = 'خلاصه متوسط در حدود ۲-۳ پاراگراف';
                    break;
                case 'long':
                    lengthInstruction = 'خلاصه نسبتاً طولانی شامل چند پاراگراف';
                    break;
            }
            
            let styleInstruction = '';
            switch (summaryStyle) {
                case 'descriptive':
                    styleInstruction = 'به صورت توصیفی با تمرکز بر رویدادها و شخصیت‌ها';
                    break;
                case 'analytical':
                    styleInstruction = 'به صورت تحلیلی با تمرکز بر مفاهیم و پیام‌های داستان';
                    break;
                case 'creative':
                    styleInstruction = 'به صورت خلاقانه و نوآورانه';
                    break;
            }
            
            const prompt = `لطفاً ${lengthInstruction} از متن زیر تهیه کنید. خلاصه باید ${styleInstruction} باشد:

"""
${editor.value}
"""

خلاصه باید شامل نکات کلیدی، شخصیت‌های اصلی و رویدادهای مهم داستان باشد. به جای خط به خط خلاصه کردن، مفاهیم اصلی را استخراج کنید.`;
            
            // دریافت خلاصه از هوش مصنوعی
            const summary = await fetchAIResponse(prompt);
            
            // نمایش خلاصه
            if (summary) {
                summaryResult.textContent = summary;
                summaryActions.style.display = 'flex';
            } else {
                summaryResult.innerHTML = '<p class="no-summary-message">خطا در تولید خلاصه. لطفاً دوباره تلاش کنید یا تنظیمات API را بررسی کنید.</p>';
            }
        } catch (error) {
            console.error('خطا در تولید خلاصه:', error);
            summaryResult.innerHTML = '<p class="no-summary-message">خطا در تولید خلاصه. لطفاً دوباره تلاش کنید.</p>';
        } finally {
            // پنهان کردن حالت بارگذاری
            summaryLoading.style.display = 'none';
            summaryResult.style.display = 'block';
        }
    }

    // رویداد کلیک روی دکمه تحلیل متن
    document.getElementById('analyzeBtn').addEventListener('click', function() {
        if (!editor.value.trim()) {
            alert('لطفاً ابتدا متنی را وارد کنید.');
            return;
        }

        if (!apiKey || !selectedModel) {
            alert('لطفاً ابتدا API و مدل هوش مصنوعی را در تنظیمات پیکربندی کنید.');
            settingsModal.classList.add('show');
            return;
        }

        // نمایش تب تحلیل سبک
        document.querySelector('.tab-btn[data-tab="analysis"]').click();
        document.querySelectorAll('.analysis-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector('.analysis-tab-btn[data-analysis-tab="style"]').classList.add('active');

        document.querySelectorAll('.analysis-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById('styleAnalysisTab').style.display = 'block';

        // اجرای تحلیل سبک نوشتاری
        analyzeWritingStyle();
    });

    // رویداد کلیک روی دکمه تحلیل مجدد سبک
    document.getElementById('runStyleAnalysisBtn').addEventListener('click', analyzeWritingStyle);

    // تابع تحلیل سبک نوشتاری
    async function analyzeWritingStyle() {
        if (!editor.value.trim()) {
            alert('لطفاً ابتدا متنی را وارد کنید.');
            return;
        }

        // گرفتن المان‌های لازم
        const avgSentenceLengthElement = document.getElementById('avgSentenceLength');
        const lexicalDiversityElement = document.getElementById('lexicalDiversity');
        const dialogueRatioElement = document.getElementById('dialogueRatio');
        const sentenceLengthSuggestion = document.getElementById('sentenceLengthSuggestion');
        const diversitySuggestion = document.getElementById('diversitySuggestion');
        const dialogueSuggestion = document.getElementById('dialogueSuggestion');
        const repeatingWordsList = document.getElementById('repeatingWordsList');

        // نمایش حالت بارگذاری
        avgSentenceLengthElement.textContent = '...';
        lexicalDiversityElement.textContent = '...';
        dialogueRatioElement.textContent = '...';
        sentenceLengthSuggestion.textContent = 'در حال تحلیل...';
        diversitySuggestion.textContent = 'در حال تحلیل...';
        dialogueSuggestion.textContent = 'در حال تحلیل...';
        repeatingWordsList.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> در حال تحلیل کلمات تکراری...</div>';

        try {
            // تحلیل محلی برای برخی معیارها
            const text = editor.value;
            const sentences = text.split(/[.!?؟।۔؛:]/); // جداسازی جملات با نشانه‌های نقطه‌گذاری
            const words = text.split(/\s+/).filter(word => word.length > 0); // جداسازی کلمات
            
            // میانگین طول جمله
            const validSentences = sentences.filter(s => s.trim().length > 0);
            const avgSentenceLength = (words.length / validSentences.length).toFixed(1);
            
            // تنوع واژگان (نسبت کلمات یکتا به کل کلمات)
            const uniqueWords = new Set(words.map(w => w.replace(/[^\w\u0600-\u06FF]/g, '').toLowerCase()));
            const lexicalDiversity = ((uniqueWords.size / words.length) * 100).toFixed(1);
            
            // یافتن کلمات تکراری
            const wordCounts = {};
            words.forEach(word => {
                // حذف علائم نگارشی از کلمات
                const cleanWord = word.replace(/[^\w\u0600-\u06FF]/g, '').toLowerCase();
                if (cleanWord.length > 2) { // فقط کلمات با طول بیشتر از 2 را بررسی می‌کنیم
                    wordCounts[cleanWord] = (wordCounts[cleanWord] || 0) + 1;
                }
            });
            
            // فیلتر کردن کلمات تکراری (بیش از 3 بار تکرار)
            const repeatingWords = Object.entries(wordCounts)
                .filter(([word, count]) => count > 3 && word.length > 2)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 15); // نمایش حداکثر 15 کلمه تکراری
            
            // تحلیل نسبت دیالوگ (تخمینی بر اساس وجود علامت‌های نقل قول)
            const dialogueLines = text.split('\n').filter(line => line.includes('«') || line.includes('»') || line.includes('"') || line.includes("'"));
            const dialogueRatio = ((dialogueLines.length / text.split('\n').length) * 100).toFixed(1);
            
            // نمایش نتایج تحلیل محلی
            avgSentenceLengthElement.textContent = avgSentenceLength;
            lexicalDiversityElement.textContent = lexicalDiversity + '%';
            dialogueRatioElement.textContent = dialogueRatio + '%';
            
            // دریافت تحلیل و پیشنهادات از هوش مصنوعی
            const prompt = `لطفاً این متن را از نظر سبک نوشتاری تحلیل کنید و پیشنهاداتی برای بهبود ارائه دهید. پاسخ را به صورت JSON با این ساختار برگردانید:
{
    "sentenceLengthAnalysis": "تحلیل و پیشنهاد کوتاه برای طول جملات (حداکثر یک خط)",
    "diversityAnalysis": "تحلیل و پیشنهاد کوتاه برای تنوع واژگان (حداکثر یک خط)",
    "dialogueAnalysis": "تحلیل و پیشنهاد کوتاه برای نسبت دیالوگ به روایت (حداکثر یک خط)"
}

اطلاعات تحلیلی محاسبه شده:
- میانگین طول جمله: ${avgSentenceLength} کلمه
- تنوع واژگان: ${lexicalDiversity}%
- نسبت دیالوگ به روایت: ${dialogueRatio}%

متن:
"""
${text.slice(0, 2000)}${text.length > 2000 ? '...' : ''}
"""`;
            
            // دریافت پیشنهادات از هوش مصنوعی
            const aiAnalysisResponse = await fetchAIResponse(prompt);
            let aiAnalysis = {};
            
            try {
                aiAnalysis = JSON.parse(aiAnalysisResponse);
            } catch (error) {
                console.error('خطا در تجزیه پاسخ هوش مصنوعی:', error);
                aiAnalysis = {
                    sentenceLengthAnalysis: "خطا در دریافت تحلیل. لطفاً دوباره تلاش کنید.",
                    diversityAnalysis: "خطا در دریافت تحلیل. لطفاً دوباره تلاش کنید.",
                    dialogueAnalysis: "خطا در دریافت تحلیل. لطفاً دوباره تلاش کنید."
                };
            }
            
            // نمایش پیشنهادات هوش مصنوعی
            sentenceLengthSuggestion.textContent = aiAnalysis.sentenceLengthAnalysis || "تحلیل در دسترس نیست.";
            diversitySuggestion.textContent = aiAnalysis.diversityAnalysis || "تحلیل در دسترس نیست.";
            dialogueSuggestion.textContent = aiAnalysis.dialogueAnalysis || "تحلیل در دسترس نیست.";
            
            // نمایش کلمات تکراری
            repeatingWordsList.innerHTML = '';
            if (repeatingWords.length > 0) {
                repeatingWords.forEach(([word, count]) => {
                    const wordItem = document.createElement('div');
                    wordItem.className = 'repeating-word-item';
                    wordItem.innerHTML = `
                        <span>${word}</span>
                        <span class="word-count-badge">${count} بار</span>
                    `;
                    repeatingWordsList.appendChild(wordItem);
                });
            } else {
                repeatingWordsList.innerHTML = '<div class="no-repeating-words">کلمه تکراری قابل توجهی یافت نشد.</div>';
            }
            
        } catch (error) {
            console.error('خطا در تحلیل سبک نوشتاری:', error);
            
            // نمایش خطا
            avgSentenceLengthElement.textContent = '-';
            lexicalDiversityElement.textContent = '-';
            dialogueRatioElement.textContent = '-';
            sentenceLengthSuggestion.textContent = 'خطا در تحلیل. لطفاً دوباره تلاش کنید.';
            diversitySuggestion.textContent = 'خطا در تحلیل. لطفاً دوباره تلاش کنید.';
            dialogueSuggestion.textContent = 'خطا در تحلیل. لطفاً دوباره تلاش کنید.';
            repeatingWordsList.innerHTML = '<div class="error-message">خطا در تحلیل کلمات تکراری.</div>';
        }
    }

    // تابع ذخیره‌سازی خودکار
    function setupAutoSave() {
        // پاکسازی تایمر قبلی اگر وجود دارد
        if (autoSaveTimer) {
            clearInterval(autoSaveTimer);
        }
        
        // ایجاد تایمر جدید برای ذخیره‌سازی هر ۱۰ ثانیه
        autoSaveTimer = setInterval(() => {
            if (currentProject) {
                // به‌روزرسانی محتوا و زمان تغییر پروژه
                updateProject(currentProject.id, {
                    content: editor.value,
                    lastModified: new Date().toISOString()
                });
                
                // نمایش پیام ذخیره‌سازی خودکار
                showAutoSaveNotification();
            }
        }, 10000); // ۱۰ ثانیه = ۱۰۰۰۰ میلی‌ثانیه
    }

    // نمایش اعلان ذخیره‌سازی خودکار
    function showAutoSaveNotification() {
        // ایجاد یک اعلان گذرا برای ذخیره‌سازی خودکار
        const notification = document.createElement('div');
        notification.className = 'autosave-notification';
        notification.innerHTML = '<i class="fas fa-save"></i> ذخیره شد';
        
        document.body.appendChild(notification);
        
        // نمایش اعلان
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // حذف اعلان پس از ۲ ثانیه
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

    // ایجاد پروژه جدید اولیه هنگام شروع نوشتن
    function handleInitialTyping() {
        // اگر پروژه‌ای انتخاب نشده و کاربر شروع به نوشتن کرده، یک پروژه جدید ایجاد کن
        if (!currentProject && editor.value.trim() !== '') {
            const projectTitle = 'پروژه بدون عنوان';
            const newProject = createNewProject(projectTitle, 'other', '');
            
            // به‌روزرسانی UI
            document.getElementById('currentProjectTitle').value = projectTitle;
            updateProjectsList();
            
            // نمایش اعلان
            const notification = document.createElement('div');
            notification.className = 'project-created-notification';
            notification.innerHTML = `<i class="fas fa-file-alt"></i> پروژه جدید "${projectTitle}" ایجاد شد`;
            
            document.body.appendChild(notification);
            
            // نمایش اعلان
            setTimeout(() => {
                notification.classList.add('show');
            }, 100);
            
            // حذف اعلان پس از ۳ ثانیه
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
            
            // شروع ذخیره‌سازی خودکار
            setupAutoSave();
        }
    }

    // رویداد keydown برای تشخیص شروع نوشتن
    editor.addEventListener('keydown', function(e) {
        // اگر کلید enter یا space یا کلید معنادار دیگری زده شد
        if (e.key.length === 1 || e.key === 'Enter' || e.key === ' ' || e.key === 'Backspace') {
            handleInitialTyping();
        }
    });
    
    // شروع ذخیره‌سازی خودکار اگر پروژه‌ای انتخاب شده است
    if (currentProject) {
        setupAutoSave();
    }
    
    // رویداد کلیک روی دکمه ذخیره شخصیت
    document.getElementById('saveCharacterBtn').addEventListener('click', function() {
        if (!currentProject) {
            alert('لطفاً ابتدا یک پروژه را انتخاب کنید.');
            return;
        }
        
        const characterEditForm = document.querySelector('.character-edit-form');
        const characterId = characterEditForm.dataset.characterId;
        
        if (!characterId) {
            alert('لطفاً ابتدا یک شخصیت را انتخاب کنید.');
            return;
        }
        
        // دریافت اطلاعات فرم
        const name = document.getElementById('characterNameInput').value;
        const role = document.getElementById('characterRoleInput').value;
        const physical = document.getElementById('characterPhysicalInput').value;
        const personality = document.getElementById('characterPersonalityInput').value;
        const backstory = document.getElementById('characterBackstoryInput').value;
        const goals = document.getElementById('characterGoalsInput').value;
        
        // اعتبارسنجی
        if (!name.trim()) {
            alert('لطفاً نام شخصیت را وارد کنید.');
            return;
        }
        
        // پیدا کردن شخصیت در لیست
        const characterIndex = currentProject.characters.findIndex(c => c.id === characterId);
        if (characterIndex !== -1) {
            // بروزرسانی شخصیت
            currentProject.characters[characterIndex] = {
                ...currentProject.characters[characterIndex],
                name,
                role,
                physical,
                personality,
                backstory,
                goals
            };
            
            // ذخیره تغییرات
            updateProject(currentProject.id, { characters: currentProject.characters });
            
            // بروزرسانی لیست شخصیت‌ها
            updateCharactersList();
            
            // نمایش پیام موفقیت
            alert('اطلاعات شخصیت با موفقیت ذخیره شد.');
        }
    });
    
    // رویداد کلیک روی دکمه حذف شخصیت
    document.getElementById('deleteCharacterBtn').addEventListener('click', function() {
        if (!currentProject) {
            alert('لطفاً ابتدا یک پروژه را انتخاب کنید.');
            return;
        }
        
        const characterEditForm = document.querySelector('.character-edit-form');
        const characterId = characterEditForm.dataset.characterId;
        
        if (!characterId) {
            alert('لطفاً ابتدا یک شخصیت را انتخاب کنید.');
            return;
        }
        
        if (confirm('آیا مطمئن هستید که می‌خواهید این شخصیت را حذف کنید؟')) {
            // حذف شخصیت از لیست
            currentProject.characters = currentProject.characters.filter(c => c.id !== characterId);
            
            // ذخیره تغییرات
            updateProject(currentProject.id, { characters: currentProject.characters });
            
            // بروزرسانی لیست شخصیت‌ها
            updateCharactersList();
            
            // پنهان کردن فرم جزئیات و نمایش پیام انتخاب
            const noSelectionMessage = document.querySelector('.character-detail-panel .no-selection-message');
            const characterEditForm = document.querySelector('.character-edit-form');
            
            noSelectionMessage.style.display = 'block';
            characterEditForm.style.display = 'none';
        }
    });

    // استخراج خودکار شخصیت‌ها از متن داستان
    async function extractCharactersFromStory() {
        if (!currentProject) {
            alert('لطفاً ابتدا یک پروژه را انتخاب کنید.');
            return;
        }
        
        const storyText = editor.value.trim();
        if (!storyText) {
            alert('متن داستان خالی است. لطفاً ابتدا متنی را وارد کنید.');
            return;
        }
        
        // نمایش وضعیت در حال بارگذاری
        const charactersList = document.getElementById('charactersList');
        charactersList.innerHTML = `
            <div class="loading-characters">
                <i class="fas fa-spinner fa-spin"></i>
                <p>در حال استخراج شخصیت‌ها...</p>
            </div>
        `;
        
        try {
            // ساخت پرامپت برای استخراج شخصیت‌ها
            const prompt = `
            متن زیر را با دقت بخوان و تمام شخصیت‌های داستان را شناسایی کن. برای هر شخصیت اطلاعات زیر را استخراج کن:
            1. نام شخصیت
            2. نقش در داستان (شخصیت اصلی، ضد قهرمان، شخصیت فرعی یا شخصیت جزئی)
            3. ویژگی‌های ظاهری (در صورت ذکر در متن)
            4. ویژگی‌های شخصیتی (خلق و خو، خصوصیات رفتاری و غیره)
            5. پیشینه و تاریخچه (اگر در متن آمده است)
            6. اهداف و انگیزه‌ها

            پاسخ را به صورت JSON با فرمت زیر برگردان:
            [
                {
                    "name": "نام شخصیت",
                    "role": "protagonist یا antagonist یا supporting یا minor",
                    "physical": "ویژگی‌های ظاهری",
                    "personality": "ویژگی‌های شخصیتی",
                    "backstory": "پیشینه و تاریخچه",
                    "goals": "اهداف و انگیزه‌ها"
                },
                {...}
            ]
            
            شخصیت‌ها را به ترتیب اهمیت آنها در داستان مرتب کن. اطلاعات را خلاصه و مختصر بنویس حداکثر در یک یا دو جمله. 
            اگر اطلاعاتی در متن نیامده، آن فیلد را خالی بگذار. فقط JSON خروجی را برگردان، بدون هیچ توضیح اضافی.
            
            متن داستان:
            
            ${storyText}
            `;
            
            // درخواست به API
            const response = await fetchAIResponse(prompt);
            
            // تلاش برای پارس کردن پاسخ به عنوان JSON
            let characters = [];
            try {
                // جدا کردن بخش JSON از پاسخ
                const jsonMatch = response.match(/\[\s*\{.*?\}\s*\]/s);
                if (jsonMatch) {
                    characters = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error('فرمت JSON یافت نشد');
                }
            } catch (jsonError) {
                console.error('خطا در پارس کردن JSON:', jsonError);
                charactersList.innerHTML = `
                    <div class="no-characters-found">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>خطا در استخراج شخصیت‌ها. لطفاً دوباره تلاش کنید.</p>
                    </div>
                `;
                return;
            }
            
            if (characters.length === 0) {
                charactersList.innerHTML = `
                    <div class="no-characters-found">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>هیچ شخصیتی در متن شناسایی نشد. لطفاً متن طولانی‌تری وارد کنید یا جزئیات بیشتری درباره شخصیت‌ها بنویسید.</p>
                    </div>
                `;
                return;
            }
            
            // ذخیره شخصیت‌ها در پروژه
            const projectCharacters = [];
            characters.forEach(character => {
                // افزودن شخصیت جدید
                projectCharacters.push({
                    ...character,
                    id: Date.now() + Math.random().toString(36).substr(2, 9)
                });
            });
            
            // ذخیره شخصیت‌ها در پروژه
            currentProject.characters = projectCharacters;
            updateProject(currentProject.id, { characters: projectCharacters });
            
            // به‌روزرسانی لیست شخصیت‌ها
            updateCharactersList();
            
        } catch (error) {
            console.error('خطا در استخراج شخصیت‌ها:', error);
            charactersList.innerHTML = `
                <div class="no-characters-found">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>خطا در استخراج شخصیت‌ها. لطفاً دوباره تلاش کنید.</p>
                </div>
            `;
        }
    }
    
    // به‌روزرسانی لیست شخصیت‌ها
    function updateCharactersList() {
        const charactersList = document.getElementById('charactersList');
        charactersList.innerHTML = '';
        
        if (!currentProject || !currentProject.characters || currentProject.characters.length === 0) {
            charactersList.innerHTML = `
                <div class="no-characters">
                    <p>شخصیتی یافت نشد. برای استخراج خودکار شخصیت‌ها از دکمه بالا استفاده کنید.</p>
                </div>
            `;
            return;
        }
        
        // مرتب‌سازی شخصیت‌ها بر اساس نقش
        const characters = [...currentProject.characters].sort((a, b) => {
            const roleOrder = { protagonist: 1, antagonist: 2, supporting: 3, minor: 4 };
            return (roleOrder[a.role] || 5) - (roleOrder[b.role] || 5);
        });
        
        characters.forEach(character => {
            const characterItem = document.createElement('div');
            characterItem.className = 'character-item';
            characterItem.dataset.id = character.id;
            
            const roleName = getCharacterRoleName(character.role);
            
            characterItem.innerHTML = `
                <div class="character-item-name">${character.name}</div>
                <div class="character-item-role">${roleName}</div>
            `;
            
            characterItem.addEventListener('click', function() {
                document.querySelectorAll('.character-item').forEach(item => {
                    item.classList.remove('active');
                });
                this.classList.add('active');
                showCharacterDetails(character.id);
            });
            
            charactersList.appendChild(characterItem);
        });
    }
    
    // دریافت نام فارسی نقش شخصیت
    function getCharacterRoleName(role) {
        switch(role) {
            case 'protagonist': return 'شخصیت اصلی';
            case 'antagonist': return 'ضد قهرمان';
            case 'supporting': return 'شخصیت فرعی';
            case 'minor': return 'شخصیت جزئی';
            default: return 'نامشخص';
        }
    }
    
    // نمایش جزئیات شخصیت انتخاب شده
    function showCharacterDetails(characterId) {
        const character = currentProject.characters.find(c => c.id === characterId);
        if (!character) return;
        
        const noSelectionMessage = document.querySelector('.character-detail-panel .no-selection-message');
        const characterEditForm = document.querySelector('.character-edit-form');
        
        noSelectionMessage.style.display = 'none';
        characterEditForm.style.display = 'block';
        
        // پر کردن فرم با اطلاعات شخصیت
        document.getElementById('characterNameInput').value = character.name || '';
        document.getElementById('characterRoleInput').value = character.role || 'supporting';
        document.getElementById('characterPhysicalInput').value = character.physical || '';
        document.getElementById('characterPersonalityInput').value = character.personality || '';
        document.getElementById('characterBackstoryInput').value = character.backstory || '';
        document.getElementById('characterGoalsInput').value = character.goals || '';
        
        // اضافه کردن شناسه شخصیت به فرم
        characterEditForm.dataset.characterId = characterId;
    }
}); 

// اضافه کردن استایل برای اعلان‌ها
const notificationStyleElement = document.createElement('style');
notificationStyleElement.textContent = `
    .autosave-notification, .project-created-notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: rgba(33, 150, 243, 0.9);
        color: white;
        padding: 10px 15px;
        border-radius: 4px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.3s ease;
        z-index: 9999;
    }
    
    .project-created-notification {
        background-color: rgba(76, 175, 80, 0.9);
    }
    
    .autosave-notification.show, .project-created-notification.show {
        opacity: 1;
        transform: translateY(0);
    }
    
    .autosave-notification i, .project-created-notification i {
        font-size: 16px;
    }
`;
document.head.appendChild(notificationStyleElement);

// رویدادهای تب‌های بخش تحلیل و آمار
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // تنظیم رویدادهای تب‌های بخش تحلیل و آمار
    document.querySelectorAll('.analysis-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-analysis-tab');
            
            // تغییر کلاس active تب
            document.querySelectorAll('.analysis-tab-btn').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // نمایش محتوای تب مربوطه
            document.querySelectorAll('.analysis-content').forEach(content => {
                content.style.display = 'none';
            });
            document.getElementById(`${tabId}AnalysisTab`).style.display = 'block';
            
            // اگر تب آمار نوشتن انتخاب شده، آمار را به‌روزرسانی کن
            if (tabId === 'stats') {
                updateWritingStats();
            }
        });
    });

    // رویداد تغییر دوره زمانی در بخش آمار
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const period = this.getAttribute('data-period');
            
            // تغییر کلاس active دکمه دوره
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // به‌روزرسانی نمودار آمار نوشتن
            updateWritingStatsChart(period);
        });
    });

    // رویداد تغییر هدف روزانه
    document.getElementById('dailyGoalInput').addEventListener('change', function() {
        if (!currentProject) return;
        
        const dailyGoal = parseInt(this.value);
        if (isNaN(dailyGoal) || dailyGoal < 1) {
            this.value = 500;
            return;
        }
        
        // ذخیره هدف روزانه در پروژه
        if (!currentProject.writingStats) {
            currentProject.writingStats = {
                dailyGoal: dailyGoal,
                wordCountHistory: []
            };
        } else {
            currentProject.writingStats.dailyGoal = dailyGoal;
        }
        
        updateProject(currentProject.id, { writingStats: currentProject.writingStats });
        
        // به‌روزرسانی نمودار
        updateWritingStatsChart('week');
    });

    // رویداد کلیک روی دکمه تولید خلاصه
    document.getElementById('generateSummaryBtn').addEventListener('click', generateSummary);

    // رویداد کلیک روی دکمه کپی خلاصه
    document.getElementById('copySummaryBtn').addEventListener('click', function() {
        const summaryText = document.getElementById('summaryResult').textContent;
        navigator.clipboard.writeText(summaryText)
            .then(() => {
                // تغییر موقت متن دکمه برای نمایش عملیات موفق
                this.innerHTML = '<i class="fas fa-check"></i> کپی شد';
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-copy"></i> کپی';
                }, 2000);
            })
            .catch(err => {
                console.error('خطا در کپی متن:', err);
                alert('خطا در کپی متن به کلیپ‌بورد.');
            });
    });

    // رویداد کلیک روی دکمه تولید مجدد خلاصه
    document.getElementById('regenerateSummaryBtn').addEventListener('click', generateSummary);
});

// نمودار آمار نوشتن
let writingStatsChart = null;

// به‌روزرسانی آمار نوشتن
function updateWritingStats() {
    if (!currentProject) {
        document.getElementById('todayWords').textContent = '0';
        document.getElementById('averageWords').textContent = '0';
        document.getElementById('writingStreak').textContent = '0';
        document.getElementById('dailyGoalInput').value = '500';
        return;
    }
    
    // ایجاد آمار پایه اگر وجود ندارد
    if (!currentProject.writingStats) {
        currentProject.writingStats = {
            dailyGoal: 500,
            wordCountHistory: []
        };
    }
    
    // تنظیم هدف روزانه
    document.getElementById('dailyGoalInput').value = currentProject.writingStats.dailyGoal;
    
    // بررسی و به‌روزرسانی آمار امروز
    const today = new Date().toISOString().split('T')[0]; // فرمت YYYY-MM-DD
    const wordCount = editor.value.split(/\s+/).filter(word => word.length > 0).length;
    
    // یافتن رکورد امروز در تاریخچه
    const todayRecordIndex = currentProject.writingStats.wordCountHistory.findIndex(record => record.date === today);
    
    if (todayRecordIndex !== -1) {
        // به‌روزرسانی رکورد امروز
        currentProject.writingStats.wordCountHistory[todayRecordIndex].wordCount = wordCount;
    } else {
        // ایجاد رکورد جدید برای امروز
        currentProject.writingStats.wordCountHistory.push({
            date: today,
            wordCount: wordCount
        });
    }
    
    // مرتب کردن تاریخچه بر اساس تاریخ
    currentProject.writingStats.wordCountHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // ذخیره آمار به‌روزرسانی شده
    updateProject(currentProject.id, { writingStats: currentProject.writingStats });
    
    // محاسبه و نمایش آمار
    const todayWords = wordCount;
    document.getElementById('todayWords').textContent = todayWords;
    
    // محاسبه میانگین روزانه (7 روز گذشته)
    const last7Days = getLast7DaysWordCounts();
    const averageWords = last7Days.length > 0 
        ? Math.round(last7Days.reduce((sum, count) => sum + count, 0) / last7Days.length) 
        : 0;
    document.getElementById('averageWords').textContent = averageWords;
    
    // محاسبه روزهای متوالی نوشتن
    const streak = calculateWritingStreak();
    document.getElementById('writingStreak').textContent = streak;
    
    // به‌روزرسانی نمودار
    updateWritingStatsChart('week');
}

// دریافت آمار 7 روز گذشته
function getLast7DaysWordCounts() {
    if (!currentProject || !currentProject.writingStats) return [];
    
    const result = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const record = currentProject.writingStats.wordCountHistory.find(r => r.date === dateString);
        if (record) {
            result.push(record.wordCount);
        } else {
            result.push(0);
        }
    }
    
    return result;
}

// محاسبه روزهای متوالی نوشتن
function calculateWritingStreak() {
    if (!currentProject || !currentProject.writingStats) return 0;
    
    const history = currentProject.writingStats.wordCountHistory;
    if (history.length === 0) return 0;
    
    // مرتب کردن تاریخچه بر اساس تاریخ (نزولی)
    const sortedHistory = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // بررسی روزهای متوالی از امروز به عقب
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // بررسی امروز
    const todayString = today.toISOString().split('T')[0];
    const todayRecord = sortedHistory.find(r => r.date === todayString);
    
    if (todayRecord && todayRecord.wordCount > 0) {
        streak = 1;
        
        // بررسی روزهای قبل
        let currentDate = new Date(today);
        currentDate.setDate(currentDate.getDate() - 1);
        
        while (true) {
            const dateString = currentDate.toISOString().split('T')[0];
            const record = sortedHistory.find(r => r.date === dateString);
            
            if (record && record.wordCount > 0) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
    }
    
    return streak;
}

// به‌روزرسانی نمودار آمار نوشتن
function updateWritingStatsChart(period) {
    if (!currentProject) return;
    
    // دریافت اطلاعات بر اساس دوره زمانی
    let labels = [];
    let data = [];
    let goalLine = [];
    
    const dailyGoal = currentProject.writingStats ? currentProject.writingStats.dailyGoal : 500;
    
    switch (period) {
        case 'week':
            // آمار هفته اخیر (7 روز)
            const last7Days = [];
            const today = new Date();
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                const persianDate = new Date(dateString).toLocaleDateString('fa-IR', { weekday: 'short' });
                
                labels.push(persianDate);
                
                const record = currentProject.writingStats && currentProject.writingStats.wordCountHistory 
                    ? currentProject.writingStats.wordCountHistory.find(r => r.date === dateString)
                    : null;
                    
                data.push(record ? record.wordCount : 0);
                goalLine.push(dailyGoal);
            }
            break;
            
        case 'month':
            // آمار ماه اخیر (30 روز)
            const last30Days = [];
            const todayForMonth = new Date();
            
            for (let i = 29; i >= 0; i--) {
                const date = new Date(todayForMonth);
                date.setDate(todayForMonth.getDate() - i);
                const dateString = date.toISOString().split('T')[0];
                
                // فقط روز را نمایش می‌دهیم
                const day = new Date(dateString).getDate();
                labels.push(day);
                
                const record = currentProject.writingStats && currentProject.writingStats.wordCountHistory 
                    ? currentProject.writingStats.wordCountHistory.find(r => r.date === dateString)
                    : null;
                    
                data.push(record ? record.wordCount : 0);
                goalLine.push(dailyGoal);
            }
            break;
            
        case 'year':
            // آمار سال اخیر (12 ماه)
            const monthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
            const todayForYear = new Date();
            
            for (let i = 11; i >= 0; i--) {
                const date = new Date(todayForYear);
                date.setMonth(todayForYear.getMonth() - i);
                
                const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const monthIndex = date.getMonth();
                
                labels.push(monthNames[monthIndex]);
                
                // جمع کردن تعداد کلمات برای هر ماه
                let monthTotal = 0;
                
                if (currentProject.writingStats && currentProject.writingStats.wordCountHistory) {
                    currentProject.writingStats.wordCountHistory.forEach(record => {
                        if (record.date.startsWith(yearMonth)) {
                            monthTotal += record.wordCount;
                        }
                    });
                }
                
                data.push(monthTotal);
                
                // هدف ماهانه (میانگین روزهای ماه * هدف روزانه)
                const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                goalLine.push(dailyGoal * daysInMonth);
            }
            break;
    }
    
    // ایجاد یا به‌روزرسانی نمودار
    const ctx = document.getElementById('writingStatsChart').getContext('2d');
    
    if (writingStatsChart) {
        writingStatsChart.data.labels = labels;
        writingStatsChart.data.datasets[0].data = data;
        writingStatsChart.data.datasets[1].data = goalLine;
        writingStatsChart.update();
    } else {
        writingStatsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'تعداد کلمات',
                        data: data,
                        backgroundColor: 'rgba(100, 181, 246, 0.7)',
                        borderColor: '#64b5f6',
                        borderWidth: 1
                    },
                    {
                        label: 'هدف',
                        data: goalLine,
                        type: 'line',
                        fill: false,
                        borderColor: '#f44336',
                        borderDash: [5, 5],
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'تعداد کلمات'
                        }
                    }
                }
            }
        });
    }
}

// تابع تولید خلاصه داستان
async function generateSummary() {
    if (!apiKey || !selectedModel) {
        alert('لطفاً ابتدا API و مدل هوش مصنوعی را در تنظیمات پیکربندی کنید.');
        settingsModal.classList.add('show');
        return;
    }
    
    const summaryResult = document.getElementById('summaryResult');
    const summaryLoading = document.querySelector('.summary-loading');
    const summaryActions = document.querySelector('.summary-actions');
    const summaryLength = document.getElementById('summaryLengthSelect').value;
    const summaryStyle = document.getElementById('summaryStyleSelect').value;
    
    if (!editor.value.trim()) {
        summaryResult.innerHTML = '<p class="no-summary-message">متن داستان خالی است. لطفاً ابتدا متنی را در ویرایشگر وارد کنید.</p>';
        summaryActions.style.display = 'none';
        return;
    }
    
    // نمایش حالت بارگذاری
    summaryLoading.style.display = 'flex';
    summaryResult.style.display = 'none';
    summaryActions.style.display = 'none';
    
    try {
        // تنظیم پرامپت با توجه به طول و سبک خلاصه
        let lengthInstruction = '';
        switch (summaryLength) {
            case 'short':
                lengthInstruction = 'خلاصه کوتاه در حد یک پاراگراف';
                break;
            case 'medium':
                lengthInstruction = 'خلاصه متوسط در حدود ۲-۳ پاراگراف';
                break;
            case 'long':
                lengthInstruction = 'خلاصه نسبتاً طولانی شامل چند پاراگراف';
                break;
        }
        
        let styleInstruction = '';
        switch (summaryStyle) {
            case 'descriptive':
                styleInstruction = 'به صورت توصیفی با تمرکز بر رویدادها و شخصیت‌ها';
                break;
            case 'analytical':
                styleInstruction = 'به صورت تحلیلی با تمرکز بر مفاهیم و پیام‌های داستان';
                break;
            case 'creative':
                styleInstruction = 'به صورت خلاقانه و نوآورانه';
                break;
        }
        
        const prompt = `لطفاً ${lengthInstruction} از متن زیر تهیه کنید. خلاصه باید ${styleInstruction} باشد:

"""
${editor.value}
"""

خلاصه باید شامل نکات کلیدی، شخصیت‌های اصلی و رویدادهای مهم داستان باشد. به جای خط به خط خلاصه کردن، مفاهیم اصلی را استخراج کنید.`;
        
        // دریافت خلاصه از هوش مصنوعی
        const summary = await fetchAIResponse(prompt);
        
        // نمایش خلاصه
        if (summary) {
            summaryResult.textContent = summary;
            summaryActions.style.display = 'flex';
        } else {
            summaryResult.innerHTML = '<p class="no-summary-message">خطا در تولید خلاصه. لطفاً دوباره تلاش کنید یا تنظیمات API را بررسی کنید.</p>';
        }
    } catch (error) {
        console.error('خطا در تولید خلاصه:', error);
        summaryResult.innerHTML = '<p class="no-summary-message">خطا در تولید خلاصه. لطفاً دوباره تلاش کنید.</p>';
    } finally {
        // پنهان کردن حالت بارگذاری
        summaryLoading.style.display = 'none';
        summaryResult.style.display = 'block';
    }
}

// به‌روزرسانی بخش تحلیل و آمار هنگام تغییر تب
document.addEventListener('DOMContentLoaded', function() {
    // ... existing code ...
    
    // رویداد تغییر تب برای به‌روزرسانی رابط کاربری
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabId = this.dataset.tab;
            
            if (tabId === 'analysis' && currentProject) {
                // به‌روزرسانی آمار نوشتن هنگام ورود به تب تحلیل و آمار
                // کمی تأخیر اضافه می‌کنیم تا مطمئن شویم المان‌ها به درستی بارگذاری شده‌اند
                setTimeout(() => {
                    document.querySelectorAll('.analysis-tab-btn').forEach(btn => {
                        if (btn.classList.contains('active')) {
                            const analysisTabId = btn.getAttribute('data-analysis-tab');
                            
                            if (analysisTabId === 'stats') {
                                updateWritingStats();
                            }
                        }
                    });
                }, 100);
            }
        });
    });
});