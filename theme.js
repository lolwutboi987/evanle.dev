(function () {
    let savedTheme = null;

    try {
        savedTheme = localStorage.getItem('theme');
    } catch (error) {
        // Browsing with storage disabled should not block the page.
    }

    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    if (!themeToggle) {
        return;
    }

    const updateToggleButton = () => {
        const isDark = htmlElement.getAttribute('data-theme') === 'dark';
        themeToggle.setAttribute('aria-pressed', String(isDark));
    };

    updateToggleButton();

    themeToggle.addEventListener('click', () => {
        const isDark = htmlElement.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';

        htmlElement.setAttribute('data-theme', newTheme);

        try {
            localStorage.setItem('theme', newTheme);
        } catch (error) {
            // The current page still changes theme when storage is unavailable.
        }

        updateToggleButton();
    });
});
