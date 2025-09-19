/**
 * Converts an HTML element into a JPG image data URL using an SVG->Canvas approach.
 * @param element The HTML element to convert.
 * @returns A promise that resolves with the base64 data URL of the JPG image.
 */
export const generateJpgFromHtml = (element: HTMLElement): Promise<string> => {
    return new Promise((resolve, reject) => {
        const { width, height } = element.getBoundingClientRect();
        if (width === 0 || height === 0) {
            return reject(new Error("Element has no size. Cannot generate image."));
        }

        // Gather all CSS rules from loaded stylesheets to ensure proper styling
        const allStyles = Array.from(document.styleSheets)
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
                } catch (e) {
                    // Ignore potential cross-origin stylesheet errors
                    return ''; 
                }
            })
            .join('\n');
        
        const theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        
        // Wrap the cloned element's HTML in a structure that includes styles
        const html = `
            <div xmlns="http://www.w3.org/1999/xhtml" class="${theme}">
                <style>${allStyles}</style>
                ${element.outerHTML}
            </div>
        `;
        
        // Create an SVG with a foreignObject to render the HTML content
        const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
                <foreignObject width="100%" height="100%">
                    ${html}
                </foreignObject>
            </svg>
        `;

        const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 2; // Render at 2x resolution for better quality
            canvas.width = width * scale;
            canvas.height = height * scale;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                URL.revokeObjectURL(url);
                return reject(new Error('Could not get canvas context.'));
            }
            
            // Set a background color as JPEG does not support transparency
            ctx.fillStyle = theme === 'dark' ? '#1f2937' : '#ffffff'; // Tailwind gray-800 and white
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);
            
            const jpgUrl = canvas.toDataURL('image/jpeg', 0.95);
            URL.revokeObjectURL(url);
            resolve(jpgUrl);
        };
        img.onerror = (error) => {
            URL.revokeObjectURL(url);
            console.error("Image loading failed:", error);
            reject(new Error('Failed to load SVG into image for canvas conversion.'));
        };

        img.src = url;
    });
};
