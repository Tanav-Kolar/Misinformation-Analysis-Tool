// Listen for different types of messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'showLoading') {
        displayLoadingState();
    } else if (request.type === 'displayResult') {
        displayResultModal(request.data);
    }
});

/**
 * Creates and injects a loading state modal into the page.
 */
function displayLoadingState() {
    // Ensure no other modals are present
    removeExistingModals();

    const modal = document.createElement('div');
    modal.id = 'verifact-loading-modal';
    modal.className = 'verifact-modal'; // Use shared base class
    modal.innerHTML = `
        <div class="loader"></div>
        <span class="loading-text">Analyzing content...</span>
    `;
    document.body.appendChild(modal);
}

/**
 * Creates and displays the detailed analysis report modal, removing the loading modal first.
 * @param {object} data - The full analysis report object from the API.
 */
function displayResultModal(data) {
    // Remove loading or any other existing modal before showing the result
    removeExistingModals();

    const modal = document.createElement('div');
    modal.id = 'verifact-result-modal';
    modal.className = 'verifact-modal'; // Use shared base class

    // The rest of this function is the same as the previous version
    const createClaimsHtml = (claims) => {
        if (!claims || claims.length === 0) return '<p class="no-claims">No specific claims were analyzed.</p>';
        return claims.map(claim => `
            <div class="claim-card">
                <div class="claim-header">
                    <p class="claim-text">"${claim.claim_text}"</p>
                    <span class="claim-conclusion conclusion-${String(claim.conclusion).toLowerCase()}">${claim.conclusion}</span>
                </div>
                <div class="evidence">
                    <h4 class="evidence-title">Supporting Evidence</h4>
                    <p class="evidence-text">${claim.web_search_results || 'No evidence found.'}</p>
                </div>
            </div>
        `).join('');
    };

    const overallTag = data.tag || "Unverified";
    let tagColorClass = 'unverified';
    if (overallTag.toLowerCase() === 'false') tagColorClass = 'false';
    if (overallTag.toLowerCase() === 'true') tagColorClass = 'true';

    modal.innerHTML = `
        <div class="header">
            <span class="title">✨ Analysis Report</span>
            <button class="close-btn" id="verifact-close-btn">&times;</button>
        </div>
        <div class="content">
            <div class="summary-section">
                <div class="summary-header">
                    <h3 class="summary-title">Overall Assessment</h3>
                    <span class="overall-tag tag-${tagColorClass}">${overallTag}</span>
                </div>
                <p class="summary-text">${data.overall_summary || 'No summary provided.'}</p>
            </div>
            <div class="claims-section">
                <h3 class="claims-title">Analyzed Claims</h3>
                <div class="claims-container">${createClaimsHtml(data.analyzed_claims)}</div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('verifact-close-btn').addEventListener('click', () => {
        modal.remove();
    });
}

/**
 * Helper function to clean up any modals from the screen.
 */
function removeExistingModals() {
    document.getElementById('verifact-loading-modal')?.remove();
    document.getElementById('verifact-result-modal')?.remove();
}

