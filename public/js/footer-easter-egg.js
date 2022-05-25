/** @type HTMLDivElement */
const container = document.getElementById('easteregg_container');

/** @type HTMLElement */
const taiEl = document.getElementById('tai_postit');

/** @type HTMLElement */
const svgEl = document.getElementById('crack');

/** @type HTMLAudioElement */
const dingSoundEl = document.getElementById("ding_sound");
const crackState = {
    done: false,
    opacity: 5,
    rotation: 0,
    clicks: 0
}

function increaseCrack() {
    if (crackState.done) {
        return;
    }
    crackState.opacity += 5;

    if (crackState.rotationDirection) {
        crackState.rotation = 5;
    } else {
        crackState.rotation = -5;
    }

    crackState.rotationDirection = !crackState.rotationDirection;

    this.style.setProperty('transform',
        `translate(-65%, 65%) rotate(${crackState.rotation}deg)`
    );
    this.style.setProperty('filter', `opacity(${crackState.opacity}%)`);

    crackState.clicks = crackState.clicks + 1;
    if (crackState.clicks > 10) {
        dingSoundEl.play();
        taiEl.classList.add('slideup');
        crackState.done = true;
    }
}

svgEl.addEventListener('mouseover', function () {increaseCrack.bind(this)();});
svgEl.addEventListener('click', increaseCrack);

svgEl.addEventListener('mouseout', function () {
    if (crackState.done) {
        return
    }
    crackState.opacity = 0;
    this.style.setProperty('transform', 
    +   `rotate(${crackState.rotation}deg)`
    );
    crackState.clicks = 0;
});