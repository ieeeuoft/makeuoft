(() => {
    const glow = document.querySelector(".lcd-glow");
    if (!glow || typeof glow.animate !== "function") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animations = [];

    function updateMotion() {
        animations.forEach((animation) => animation.cancel());
        animations = [];
        if (reducedMotion.matches) return;

        animations = [
            glow.animate(
                [
                    { transform: "translate(-50%, -50%) rotate(0deg)" },
                    { transform: "translate(-50%, -50%) rotate(360deg)" },
                ],
                { duration: 24000, iterations: Infinity, easing: "linear" }
            ),
            // A soft strobe: smooth, slow brightness changes without hard flashes.
            glow.animate(
                [
                    { opacity: 0.22, offset: 0 },
                    { opacity: 0.52, offset: 0.45 },
                    { opacity: 0.32, offset: 0.7 },
                    { opacity: 0.22, offset: 1 },
                ],
                { duration: 4200, iterations: Infinity, easing: "ease-in-out" }
            ),
        ];
    }

    updateMotion();
    reducedMotion.addEventListener("change", updateMotion);
})();
