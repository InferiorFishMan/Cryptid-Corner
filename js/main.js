const colours = [
    "#F777D7",
    "#FFB002",
    "#FD6809",
    "#85BA0A",
    "#01AAFB",
    "#000000"
];

const text = document.querySelector(".rgb-text");

if (text) {
    const originalText = text.textContent;

    text.innerHTML = originalText
        .split("")
        .map(letter => `<span class="rgb-letter">${letter}</span>`)
        .join("");

    const letters = document.querySelectorAll(".rgb-letter");

    setInterval(() => {
        letters.forEach(letter => {
            letter.style.color =
                colours[Math.floor(Math.random() * colours.length)];
        });
    }, 1000);
}
