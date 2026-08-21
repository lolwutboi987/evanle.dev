const fortunes = [
    'A happy accident will point you toward your next good idea.',
    'Something you almost gave up on will become easier very soon.',
    'A new friend will make an ordinary day worth remembering.',
    'The answer you need will arrive while you are busy doing something else.',
    'A small risk taken this week will give you a great story later.',
    'An unfinished idea is waiting for one more strange little experiment.',
    'Good news will find you through an unexpected message.',
    'The next thing you make will teach you more than the last thing you planned.',
    'A problem that looks stuck is about to reveal a hidden door.',
    'Someone will remember a kind thing you did when you least expect it.',
    'A curious detour will lead you somewhere better than the shortcut.',
    'Your next mistake will be surprisingly useful.',
    'A forgotten idea will return with much better timing.',
    'Before the month is over, you will have a new favorite thing.',
    'A bold question will get a better answer than a careful guess.',
    'The project on your mind is closer to working than it feels.',
    'An ordinary afternoon will turn into a story you keep telling.',
    'A tiny improvement will unlock a much bigger possibility.',
    'Someone nearby has exactly the missing piece you need.',
    'Your patience will pay off in a way you can actually see.',
    'An invitation worth accepting is headed your way.',
    'You will soon solve something that used to intimidate you.',
    'A weird idea will be the right idea.',
    'The next open door will not look like the one you expected.',
    'A useful surprise is hiding inside a boring task.',
    'You will make something that makes another person want to make something too.',
    'A long-shot plan will work just well enough to become a real plan.',
    'The week ahead contains more luck than it first appears to.',
    'A small act of courage will make tomorrow feel much larger.',
    'Something lost will return in a better form.',
    'Your next collaboration will begin with a very casual conversation.',
    'An answer will show up the moment you stop forcing it.',
    'The tool you need may be the one you decide to build yourself.',
    'A change of scenery will shake loose an excellent idea.',
    'Your sense of humor will rescue an awkward moment.',
    'A quiet win is arriving before the loud one.',
    'You are about to discover a faster way through an old problem.',
    'A person you admire will notice the care you put into your work.',
    'The next version will be the version that finally feels like yours.',
    'An unexpected yes will move your plans forward.',
    'A choice made for fun will turn out to be surprisingly important.',
    'You will soon have a very good reason to stay curious.',
    'A mystery that has bothered you will become obvious all at once.',
    'A lucky break is looking for someone already in motion.',
    'The thing that makes your idea unusual is the thing that will make it work.',
    'An old skill will become useful in a completely new way.',
    'A future favorite memory begins with an unplanned change.',
    'One thoughtful message will travel farther than you expect.',
    'The next impossible-looking task will be made of several easy ones.',
    'A good opportunity will arrive disguised as a slightly ridiculous idea.'
];

const cookieButton = document.getElementById('cookie-button');
const cookieImage = document.getElementById('cookie-image');
const fortuneArea = document.getElementById('fortune-area');
const fortuneText = document.getElementById('fortune-text');
const luckyNumbers = document.getElementById('lucky-numbers');
const anotherButton = document.getElementById('another-button');
const instruction = document.getElementById('cookie-instruction');
let lastFortune = -1;
let isOpen = false;

function randomFortuneIndex() {
    let index;
    do { index = Math.floor(Math.random() * fortunes.length); } while (index === lastFortune);
    return index;
}

function makeLuckyNumbers() {
    const pool = Array.from({ length: 48 }, (_, index) => index + 1);
    const picks = [];
    while (picks.length < 6) picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    return picks.sort((a, b) => a - b).join(' · ');
}

function openCookie() {
    if (isOpen) return;
    isOpen = true;
    lastFortune = randomFortuneIndex();
    cookieButton.classList.add('is-cracking');
    window.setTimeout(() => {
        cookieImage.src = 'assets/fortune-cookie-open.jpg';
        cookieImage.width = 2400;
        cookieImage.height = 2000;
        cookieImage.alt = 'The fortune cookie split into two halves with its paper fortune showing';
        instruction.textContent = 'cracked!';
        fortuneText.textContent = fortunes[lastFortune];
        luckyNumbers.textContent = makeLuckyNumbers();
        fortuneArea.hidden = false;
        fortuneArea.classList.remove('is-new');
        void fortuneArea.offsetWidth;
        fortuneArea.classList.add('is-new');
        cookieButton.classList.remove('is-cracking');
    }, 260);
}

function resetCookie() {
    isOpen = false;
    fortuneArea.hidden = true;
    cookieImage.src = 'assets/fortune-cookie-closed.jpg';
    cookieImage.width = 2004;
    cookieImage.height = 1600;
    cookieImage.alt = 'A whole fortune cookie on a white background';
    instruction.textContent = 'click to crack open';
    cookieButton.focus();
}

cookieButton.addEventListener('click', openCookie);
anotherButton.addEventListener('click', resetCookie);
