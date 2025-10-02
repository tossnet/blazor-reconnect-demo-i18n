// Translations for the reconnect modal from JS engine
function getUserLang() {
    // Try to get the browser language, fallback to 'fr'
    return navigator.language.startsWith('fr') ? 'fr' : 'fr';
}

const translations = {
    en: {
        Rejoining: "🛟 Rejoining the server...",
        RejoinFailed: "Rejoin failed... trying again in <span id=\"components-seconds-to-next-attempt\"></span> seconds.",
        FailedToRejoin: "Failed to rejoin.<br />Please retry or reload the page.",
        Retry: "Retry",
        Paused: "The session has been paused by the server.",
        Resume: "Resume",
        FailedToResume: "Failed to resume the session.<br />Please reload the page."
    },
    fr: {
        Rejoining: "🛟 Reconnexion au serveur...",
        RejoinFailed: "Échec de la reconnexion... nouvelle tentative dans <span id=\"components-seconds-to-next-attempt\"></span> secondes.",
        FailedToRejoin: "Échec de la reconnexion.<br />Veuillez réessayer ou recharger la page.",
        Retry: "Réessayer",
        Paused: "La session a été mise en pause par le serveur.",
        Resume: "Reprendre",
        FailedToResume: "Échec de la reprise de la session.<br />Veuillez recharger la page."
    }
};

function localizeReconnectModal() {
    const lang = getUserLang();
    const dict = translations[lang] || translations.en;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.innerHTML = dict[key];
        }
    });
}

document.addEventListener('DOMContentLoaded', localizeReconnectModal);




// Set up event handlers
const reconnectModal = document.getElementById("components-reconnect-modal");
reconnectModal.addEventListener("components-reconnect-state-changed", handleReconnectStateChanged);

const retryButton = document.getElementById("components-reconnect-button");
retryButton.addEventListener("click", retry);

const resumeButton = document.getElementById("components-resume-button");
resumeButton.addEventListener("click", resume);

function handleReconnectStateChanged(event) {
    if (event.detail.state === "show") {
        reconnectModal.showModal();
    } else if (event.detail.state === "hide") {
        reconnectModal.close();
    } else if (event.detail.state === "failed") {
        document.addEventListener("visibilitychange", retryWhenDocumentBecomesVisible);
    } else if (event.detail.state === "rejected") {
        location.reload();
    }
}

async function retry() {
    document.removeEventListener("visibilitychange", retryWhenDocumentBecomesVisible);

    try {
        // Reconnect will asynchronously return:
        // - true to mean success
        // - false to mean we reached the server, but it rejected the connection (e.g., unknown circuit ID)
        // - exception to mean we didn't reach the server (this can be sync or async)
        const successful = await Blazor.reconnect();
        if (!successful) {
            // We have been able to reach the server, but the circuit is no longer available.
            // We'll reload the page so the user can continue using the app as quickly as possible.
            const resumeSuccessful = await Blazor.resumeCircuit();
            if (!resumeSuccessful) {
                location.reload();
            } else {
                reconnectModal.close();
            }
        }
    } catch (err) {
        // We got an exception, server is currently unavailable
        document.addEventListener("visibilitychange", retryWhenDocumentBecomesVisible);
    }
}

async function resume() {
    try {
        const successful = await Blazor.resumeCircuit();
        if (!successful) {
            location.reload();
        }
    } catch {
        location.reload();
    }
}

async function retryWhenDocumentBecomesVisible() {
    if (document.visibilityState === "visible") {
        await retry();
    }
}
