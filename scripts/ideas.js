const ideasList = document.getElementById('ideasList');
const submitIdeaBtn = document.getElementById('submitIdea');
const ideaInput = document.getElementById('ideaInput');

// Shared state
let ideas = [];

async function loadIdeas() {
    try {
        const response = await fetch(`${API_BASE}/ideas`);
        ideas = await response.json();
        renderIdeas();
    } catch (err) {
        console.error('Failed to load ideas:', err);
    }
}

function renderIdeas() {
    if (!ideasList) return;
    ideasList.innerHTML = '';

    if (ideas.length === 0) {
        ideasList.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem;">
                Noch keine Ideen vorhanden. Sei der Erste!
            </div>
        `;
        return;
    }

    ideas.forEach(idea => {
        const card = document.createElement('div');
        card.className = 'idea-card';

        const isMyIdea = idea.author === localStorage.getItem('currentUser');
        const isAdmin = localStorage.getItem('currentUserRole') === 'admin';

        const deleteButton = (isMyIdea || isAdmin) ? `
            <button class="delete-btn" onclick="deleteIdea(${idea.id})" title="Löschen">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        ` : '';

        card.innerHTML = `
            <div class="idea-header">
                <span class="idea-author">${idea.author}</span>
                <span class="idea-date">${new Date(idea.timestamp).toLocaleDateString()}</span>
            </div>
            <p class="idea-content">${idea.content}</p>
            ${deleteButton}
        `;
        ideasList.appendChild(card);
    });
}

async function addIdea() {
    const content = ideaInput.value.trim();
    if (!content) return;

    const author = localStorage.getItem('currentUser') || 'Anonym';

    try {
        const response = await fetch(`${API_BASE}/ideas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, author })
        });

        if (response.ok) {
            ideaInput.value = '';
            await loadIdeas();
        }
    } catch (err) {
        console.error('Failed to add idea:', err);
    }
}

window.deleteIdea = async function (id) {
    if (confirm('Möchtest du diese Idee wirklich löschen?')) {
        try {
            const response = await fetch(`${API_BASE}/ideas/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                await loadIdeas();
            }
        } catch (err) {
            console.error('Failed to delete idea:', err);
        }
    }
};

// Event Listeners
if (submitIdeaBtn) {
    submitIdeaBtn.addEventListener('click', addIdea);
}

if (ideaInput) {
    ideaInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addIdea();
        }
    });
}

// Update user avatar logic
const userAvatar = document.getElementById('userAvatar');
if (userAvatar) {
    const user = localStorage.getItem('currentUser');
    if (user) {
        userAvatar.textContent = user.charAt(0).toUpperCase();
    }
}

// Initial load
loadIdeas();

