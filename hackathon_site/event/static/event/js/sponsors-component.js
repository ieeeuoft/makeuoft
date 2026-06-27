// React component for interactive sponsors grid
const { useState } = React;

const SponsorCard = ({ sponsor, index }) => {
    const [imageError, setImageError] = useState(false);

    const handleClick = () => {
        if (sponsor.website) {
            window.open(sponsor.website, "_blank", "noopener,noreferrer");
        }
    };

    // Build the full logo URL using the static URL prefix
    const logoUrl = window.STATIC_URL ? window.STATIC_URL + sponsor.logo : sponsor.logo;

    return React.createElement(
        "div",
        {
            className: "sponsor-card",
            onClick: handleClick,
            style: { cursor: sponsor.website ? "pointer" : "default" },
        },
        !imageError
            ? React.createElement("img", {
                  src: logoUrl,
                  alt: sponsor.name,
                  onError: () => setImageError(true),
              })
            : React.createElement(
                  "div",
                  { className: "sponsor-placeholder" },
                  React.createElement("span", null, sponsor.name)
              )
    );
};

const SponsorsGrid = ({ sponsors }) => {
    // Render all sponsors dynamically - grid will adjust automatically
    return React.createElement(
        "div",
        { className: "sponsors-grid" },
        sponsors.map((sponsor, index) =>
            React.createElement(SponsorCard, {
                key: `${sponsor.name}-${index}`,
                sponsor: sponsor,
                index: index,
            })
        )
    );
};

// Initialize the component when ready
function initSponsors() {
    const sponsorsContainer = document.getElementById("sponsors-react-container");

    if (!sponsorsContainer) {
        return;
    }

    if (!window.SPONSORS_DATA || window.SPONSORS_DATA.length === 0) {
        return;
    }

    if (typeof React === "undefined" || typeof ReactDOM === "undefined") {
        return;
    }

    try {
        const root = ReactDOM.createRoot(sponsorsContainer);
        root.render(
            React.createElement(SponsorsGrid, { sponsors: window.SPONSORS_DATA })
        );
    } catch (error) {
        console.error("Error rendering sponsors component:", error);
    }
}

// Wait for dependencies and DOM, then initialize
function waitForDependencies(callback) {
    if (
        typeof React !== "undefined" &&
        typeof ReactDOM !== "undefined" &&
        window.SPONSORS_DATA
    ) {
        callback();
    } else {
        setTimeout(function () {
            waitForDependencies(callback);
        }, 50);
    }
}

// Initialize when dependencies are ready
waitForDependencies(function () {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSponsors);
    } else {
        initSponsors();
    }
});
