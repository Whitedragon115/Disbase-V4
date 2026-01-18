const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

// Read icons.json
const iconsData = JSON.parse(fs.readFileSync('icons.json', 'utf8'));
const fileTypes = iconsData.icons.fileTypes;

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir);
}

// Rate limiting configuration
const REQUESTS_PER_SECOND = 5;
const DELAY_MS = 1000 / REQUESTS_PER_SECOND;

// Convert SVG to PNG function
async function convertSvgToPng(svgPath, pngPath) {
    try {
        await sharp(svgPath)
            .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toFile(pngPath);
        return true;
    } catch (error) {
        console.error(`✗ Conversion failed: ${path.basename(svgPath)} - ${error.message}`);
        return false;
    }
}

// Download function
function downloadIcon(iconName, fileName) {
    return new Promise((resolve, reject) => {
        // Remove 'file-type-' prefix if it exists
        const iconId = iconName.startsWith('file-type-') ? iconName : `file-type-${iconName}`;
        const url = `https://api.iconify.design/vscode-icons/${iconId}.svg`;
        const svgPath = path.join(iconsDir, `${fileName}.svg`);
        const pngPath = path.join(iconsDir, `${fileName}.png`);
        
        console.log(`Downloading: ${iconId} -> ${fileName}.png`);
        
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                const fileStream = fs.createWriteStream(svgPath);
                response.pipe(fileStream);
                
                fileStream.on('finish', async () => {
                    fileStream.close();
                    
                    // Convert SVG to PNG
                    const converted = await convertSvgToPng(svgPath, pngPath);
                    
                    if (converted) {
                        // Delete the SVG file after successful conversion
                        fs.unlink(svgPath, () => {});
                        console.log(`✓ Downloaded & converted: ${fileName}.png`);
                        resolve({ success: true, fileName, iconName });
                    } else {
                        // Keep SVG if conversion failed
                        console.log(`⚠ Downloaded but conversion failed: ${fileName}.svg`);
                        resolve({ success: false, fileName, error: 'Conversion failed' });
                    }
                });
                
                fileStream.on('error', (err) => {
                    fs.unlink(svgPath, () => {});
                    reject({ success: false, fileName, error: err.message });
                });
            } else if (response.statusCode === 404) {
                console.log(`✗ Not found: ${iconId}`);
                resolve({ success: false, fileName, error: '404 Not Found' });
            } else if (response.statusCode === 429) {
                console.log(`✗ Rate limited: ${iconId}`);
                reject({ success: false, fileName, error: 'Rate limited', retry: true });
            } else {
                console.log(`✗ Error ${response.statusCode}: ${iconId}`);
                resolve({ success: false, fileName, error: `HTTP ${response.statusCode}` });
            }
        }).on('error', (err) => {
            console.log(`✗ Network error for ${fileName}: ${err.message}`);
            reject({ success: false, fileName, error: err.message });
        });
    });
}

// Sleep function for rate limiting
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Main download function with rate limiting
async function downloadAllIcons() {
    const entries = Object.entries(fileTypes);
    const total = entries.length;
    let downloaded = 0;
    let failed = 0;
    let skipped = 0;
    
    console.log(`Starting download of ${total} icons...`);
    console.log(`Rate limit: ${REQUESTS_PER_SECOND} requests per second\n`);
    
    for (let i = 0; i < entries.length; i++) {
        const [fileName, iconName] = entries[i];
        
        try {
            const result = await downloadIcon(iconName, fileName);
            if (result.success) {
                downloaded++;
            } else {
                if (result.error === '404 Not Found') {
                    skipped++;
                } else {
                    failed++;
                }
            }
        } catch (error) {
            failed++;
            console.error(`Error downloading ${fileName}:`, error.error || error.message);
        }
        
        // Rate limiting - wait between requests
        if (i < entries.length - 1) {
            await sleep(DELAY_MS);
        }
        
        // Progress update every 50 icons
        if ((i + 1) % 50 === 0) {
            console.log(`\nProgress: ${i + 1}/${total} processed (${downloaded} downloaded, ${failed} failed, ${skipped} skipped)\n`);
        }
    }
    
    console.log('\n=== Download Complete ===');
    console.log(`Total processed: ${total}`);
    console.log(`Successfully downloaded: ${downloaded}`);
    console.log(`Failed: ${failed}`);
    console.log(`Skipped (404): ${skipped}`);
    console.log(`\nIcons saved to: ${iconsDir}`);
}

// Run the download
downloadAllIcons().catch(console.error);
