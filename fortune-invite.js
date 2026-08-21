document.addEventListener('DOMContentLoaded', () => {
    const invite = document.getElementById('fortune-invite');

    if (!(invite instanceof HTMLDialogElement)) {
        return;
    }

    window.setTimeout(() => invite.showModal(), 650);
});
