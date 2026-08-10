(() => {
    const headline = document.querySelector('.raster-headline');
    const text = headline?.querySelector('h1');
    const canvas = headline?.querySelector('.raster-headline__canvas');

    if (!headline || !text || !canvas) {
        return;
    }

    const lines = ['Make the thing your', 'workshop is missing.'];
    const subpixelsPerPixel = 3;
    const lcdFilter = [0.03125, 0.3, 0.3375, 0.3, 0.03125];
    let frame = null;

    const draw = () => {
        const styles = getComputedStyle(text);
        const width = Math.round(headline.getBoundingClientRect().width);
        const fontSize = Number.parseFloat(styles.fontSize);
        const lineHeight = Number.parseFloat(styles.lineHeight);
        const height = Math.round(lineHeight * lines.length);
        const mask = document.createElement('canvas');

        mask.width = width * subpixelsPerPixel;
        mask.height = height;

        const maskContext = mask.getContext('2d', { willReadFrequently: true });
        const context = canvas.getContext('2d');

        if (!maskContext || !context) {
            return;
        }

        maskContext.fillStyle = '#ffffff';
        maskContext.fillRect(0, 0, mask.width, mask.height);
        maskContext.scale(subpixelsPerPixel, 1);
        maskContext.fillStyle = '#000000';
        maskContext.font = `${styles.fontWeight} ${fontSize}px ${styles.fontFamily}`;
        maskContext.textBaseline = 'top';
        maskContext.fontKerning = 'none';

        lines.forEach((line, index) => {
            maskContext.fillText(line, 0, index * lineHeight);
        });

        const maskPixels = maskContext.getImageData(0, 0, mask.width, mask.height).data;

        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const output = context.createImageData(width, height);
        const coverageAt = (x, y) => {
            if (x < 0 || x >= mask.width) {
                return 0;
            }

            return 1 - (maskPixels[((y * mask.width) + x) * 4] / 255);
        };
        const filteredCoverage = (x, y) => lcdFilter.reduce((coverage, weight, index) => {
            return coverage + (coverageAt(x + index - 2, y) * weight);
        }, 0);

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const subpixel = x * subpixelsPerPixel;
                const red = Math.pow(filteredCoverage(subpixel, y), 0.82);
                const green = Math.pow(filteredCoverage(subpixel + 1, y), 0.82);
                const blue = Math.pow(filteredCoverage(subpixel + 2, y), 0.82);
                const outputIndex = ((y * width) + x) * 4;

                output.data[outputIndex] = Math.round(255 * (1 - red));
                output.data[outputIndex + 1] = Math.round(255 * (1 - green));
                output.data[outputIndex + 2] = Math.round(255 * (1 - blue));
                output.data[outputIndex + 3] = 255;
            }
        }

        context.putImageData(output, 0, 0);
        headline.classList.add('is-rendered');
    };

    const scheduleDraw = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(draw);
    };

    document.fonts?.ready.then(scheduleDraw);
    window.addEventListener('resize', scheduleDraw);
    scheduleDraw();
})();
