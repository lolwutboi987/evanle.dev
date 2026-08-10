(() => {
    const headline = document.querySelector('.raster-headline');
    const text = headline?.querySelector('h1');
    const canvas = headline?.querySelector('.raster-headline__canvas');

    if (!headline || !text || !canvas) {
        return;
    }

    const lines = ['Make the thing your', 'workshop is missing.'];
    const renderScale = 0.72;
    let frame = null;

    const draw = () => {
        const styles = getComputedStyle(text);
        const width = Math.round(headline.getBoundingClientRect().width);
        const fontSize = Number.parseFloat(styles.fontSize);
        const lineHeight = Number.parseFloat(styles.lineHeight);
        const height = Math.round(lineHeight * lines.length);

        canvas.width = Math.max(1, Math.round(width * renderScale));
        canvas.height = Math.max(1, Math.round(height * renderScale));
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const context = canvas.getContext('2d');

        if (!context) {
            return;
        }

        context.scale(renderScale, renderScale);
        context.fillStyle = styles.color;
        context.font = `${styles.fontWeight} ${fontSize}px "Lucida Console", "Courier New", monospace`;
        context.textBaseline = 'top';
        context.fontKerning = 'none';

        lines.forEach((line, index) => {
            context.fillText(line, 0, index * lineHeight);
        });

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
