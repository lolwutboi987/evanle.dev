(() => {
    const imageUrl = new URL('glep.png', document.currentScript.src).href;
    const app = document.querySelector('.app-window');
    const minimize = document.querySelector('[data-minimize]');
    const close = document.querySelector('[data-close]');
    if (!app || !minimize || !close) return;

    const message = document.createElement('p');
    message.className = 'close-notice';
    message.setAttribute('role', 'status');
    app.append(message);

    minimize.addEventListener('click', () => {
        app.hidden = true;
        document.querySelector('.skip-link').hidden = true;
        const scene = document.createElement('main');
        scene.className = 'glep-scene';
        const picture = document.createElement('img');
        picture.src = imageUrl;
        picture.alt = 'Glep wearing his purple hat';
        const heading = document.createElement('h1');
        heading.textContent = 'why did you close it :(';
        heading.tabIndex = -1;
        const hint = document.createElement('p');
        hint.textContent = 'refresh the tab. he’s not opening it for you.';
        scene.append(picture, heading, hint);
        document.body.append(scene);
        window.scrollTo(0, 0);
        heading.focus();
    }, { once: true });

    close.addEventListener('click', () => {
        window.close();
        // User-opened tabs may refuse window.close(). Leave the page usable.
        message.textContent = 'your browser won’t let this page close the tab. use the tab’s × button.';
    });
})();
