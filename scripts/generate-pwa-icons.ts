
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const SOURCE_ICON = path.join(PUBLIC_DIR, 'App_icon_3.png');

async function generateIcons() {
    if (!fs.existsSync(SOURCE_ICON)) {
        console.error(`Source icon not found at ${SOURCE_ICON}`);
        process.exit(1);
    }

    const icons = [
        { name: 'icon-192x192.png', size: 192 },
        { name: 'icon-512x512.png', size: 512 },
        { name: 'apple-icon.png', size: 180 },
        { name: 'favicon.png', size: 32 },
    ];

    console.log('Generating final PWA icons (white rounded background)...');

    for (const icon of icons) {
        const outputPath = path.join(PUBLIC_DIR, icon.name);

        // 1. 원본 로고에서 흰색 배경 제거
        const trimmedLogo = await sharp(SOURCE_ICON)
            .ensureAlpha()
            .trim({ threshold: 40 })
            .toBuffer();

        // 2. 흰색 둥근 사각형 배경 생성
        const borderRadius = Math.floor(icon.size * 0.175);
        const background = Buffer.from(
            `<svg width="${icon.size}" height="${icon.size}">
                <rect x="0" y="0" width="${icon.size}" height="${icon.size}" rx="${borderRadius}" ry="${borderRadius}" fill="white" />
            </svg>`
        );

        // 3. 합성: 배경 위에 로고를 얹음
        const logoSize = Math.floor(icon.size * 0.82);

        await sharp(background)
            .composite([
                {
                    input: await sharp(trimmedLogo)
                        .resize({
                            width: logoSize,
                            height: logoSize,
                            fit: 'contain',
                            background: { r: 255, g: 255, b: 255, alpha: 0 }
                        })
                        .toBuffer(),
                    gravity: 'center'
                }
            ])
            .png()
            .toFile(outputPath);

        console.log(`Generated ${icon.name}`);
    }

    console.log('Done!');
}

generateIcons().catch(console.error);
