/**
 * مدیریت تم روشن و تاریک
 * ماژول مستقل برای تغییر حالت نمایش برنامه
 */

(function() {
    // متغیرهای اصلی
    const STORAGE_KEY = 'writerapp_theme';
    const THEME_DARK = 'dark';
    const THEME_LIGHT = 'light';
    
    // CSS متغیرهای 
    const themes = {
        light: {
            '--primary-color': 'rgba(255, 255, 255, 0.8)',
            '--secondary-color': 'rgba(255, 255, 255, 0.4)',
            '--accent-color': '#64b5f6',
            '--text-color': '#333',
            '--background-gradient': 'linear-gradient(135deg, #e0f7fa, #f5f5f5)',
            '--glass-background': 'rgba(255, 255, 255, 0.6)',
            '--glass-border': 'rgba(255, 255, 255, 0.7)',
            '--card-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 100%)'
        },
        dark: {
            '--primary-color': 'rgba(40, 40, 40, 0.8)',
            '--secondary-color': 'rgba(30, 30, 30, 0.4)',
            '--accent-color': '#1976d2',
            '--text-color': '#e0e0e0',
            '--background-gradient': 'linear-gradient(135deg, #263238, #1a1a1a)',
            '--glass-background': 'rgba(30, 30, 30, 0.7)',
            '--glass-border': 'rgba(70, 70, 70, 0.5)',
            '--card-gradient': 'linear-gradient(135deg, rgba(60, 60, 60, 0.4) 0%, rgba(30, 30, 30, 0) 100%)'
        }
    };
    
    // ایجاد دکمه تغییر تم
    function createThemeToggleButton() {
        const button = document.createElement('button');
        button.id = 'themeToggleBtn';
        button.className = 'theme-toggle';
        button.innerHTML = '<i class="fas fa-moon"></i>';
        button.setAttribute('title', 'تغییر تم');
        
        // اضافه کردن دکمه به بدنه سند
        document.body.appendChild(button);
        
        // افزودن رویداد کلیک
        button.addEventListener('click', toggleTheme);
        
        // به‌روزرسانی آیکون بر اساس تم فعلی
        updateButtonIcon();
    }
    
    // تغییر حالت تم
    function toggleTheme() {
        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === THEME_DARK ? THEME_LIGHT : THEME_DARK;
        
        applyTheme(newTheme);
        saveTheme(newTheme);
        updateButtonIcon();
    }
    
    // دریافت تم فعلی
    function getCurrentTheme() {
        // بررسی تم ذخیره شده در حافظه مرورگر
        const savedTheme = localStorage.getItem(STORAGE_KEY);
        
        if (savedTheme) {
            return savedTheme;
        }
        
        // بررسی تنظیمات سیستم کاربر
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches 
            ? THEME_DARK 
            : THEME_LIGHT;
    }
    
    // اعمال تم به صفحه
    function applyTheme(theme) {
        const root = document.documentElement;
        const themeVariables = themes[theme];
        
        // اعمال متغیرهای CSS
        for (const [property, value] of Object.entries(themeVariables)) {
            root.style.setProperty(property, value);
        }
        
        // افزودن یا حذف کلاس تم تاریک از بدنه سند
        if (theme === THEME_DARK) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
    
    // ذخیره تم در حافظه مرورگر
    function saveTheme(theme) {
        localStorage.setItem(STORAGE_KEY, theme);
    }
    
    // به‌روزرسانی آیکون دکمه بر اساس تم فعلی
    function updateButtonIcon() {
        const button = document.getElementById('themeToggleBtn');
        if (!button) return;
        
        const currentTheme = getCurrentTheme();
        
        if (currentTheme === THEME_DARK) {
            button.innerHTML = '<i class="fas fa-sun"></i>';
            button.setAttribute('title', 'تغییر به تم روشن');
        } else {
            button.innerHTML = '<i class="fas fa-moon"></i>';
            button.setAttribute('title', 'تغییر به تم تاریک');
        }
    }
    
    // راه‌اندازی سیستم تم
    function initTheme() {
        // بارگذاری و اعمال تم ذخیره شده
        const currentTheme = getCurrentTheme();
        applyTheme(currentTheme);
        
        // ایجاد دکمه تغییر تم
        createThemeToggleButton();
        
        // پاسخ به تغییرات تم سیستم
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
                const newTheme = e.matches ? THEME_DARK : THEME_LIGHT;
                applyTheme(newTheme);
                saveTheme(newTheme);
                updateButtonIcon();
            });
        }
    }
    
    // ارائه API عمومی
    window.themeManager = {
        init: initTheme,
        toggle: toggleTheme,
        setTheme: (theme) => {
            if (theme === THEME_DARK || theme === THEME_LIGHT) {
                applyTheme(theme);
                saveTheme(theme);
                updateButtonIcon();
            }
        },
        getCurrentTheme: getCurrentTheme
    };
})();

// راه‌اندازی خودکار با بارگذاری صفحه
document.addEventListener('DOMContentLoaded', function() {
    window.themeManager.init();
}); 