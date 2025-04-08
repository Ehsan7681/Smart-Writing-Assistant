// این اسکریپت به Node.js و کتابخانه sharp نیاز دارد
// برای نصب: npm install sharp

const fs = require('fs');
const sharp = require('sharp');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = 'icons/icon-512x512.svg';

// بررسی وجود دایرکتوری icons
if (!fs.existsSync('icons')) {
  fs.mkdirSync('icons');
}

async function generateIcons() {
  try {
    for (const size of sizes) {
      await sharp(inputSvg)
        .resize(size, size)
        .toFile(`icons/icon-${size}x${size}.png`);
      
      console.log(`آیکون ${size}x${size} ایجاد شد.`);
    }
    console.log('تمام آیکون‌ها با موفقیت ایجاد شدند.');
  } catch (error) {
    console.error('خطا در ایجاد آیکون‌ها:', error);
  }
}

generateIcons(); 