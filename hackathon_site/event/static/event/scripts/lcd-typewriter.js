(() => {
    const text = document.querySelector("[data-lcd-typewriter]");
    if (!text || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sentence = text.textContent.trim();
    const accessible = document.createElement("span");
    accessible.className = "lcd-screen-reader-text";
    accessible.textContent = sentence;
    const visible = document.createElement("span");
    visible.setAttribute("aria-hidden", "true");
    text.replaceChildren(accessible, visible);
    // Standard WPM uses five characters per word: 48 ms per character.
    const millisecondsPerCharacter = 60000 / (250 * 5);
    let startedAt;
    function type(now) {
        if (startedAt === undefined) startedAt = now;
        const count = Math.min(
            sentence.length,
            Math.floor((now - startedAt) / millisecondsPerCharacter),
        );
        visible.textContent = sentence.slice(0, count);
        if (count < sentence.length) requestAnimationFrame(type);
    }
    requestAnimationFrame(type);
})();
