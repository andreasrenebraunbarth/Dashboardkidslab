// Room Management Logic
const roomsList = document.getElementById('roomsList');
const roomInput = document.getElementById('roomInput');
const addRoomForm = document.getElementById('addRoomForm');

// Shared state
let rooms = [];

async function loadRooms() {
    try {
        const response = await fetch(`${API_BASE}/rooms`);
        rooms = await response.json();
        renderRooms();
    } catch (err) {
        console.error('Failed to load rooms:', err);
    }
}

function renderRooms() {
    if (!roomsList) return;
    roomsList.innerHTML = '';

    const currentUserRole = localStorage.getItem('currentUserRole');
    const isAdmin = currentUserRole === 'admin';

    if (rooms.length === 0) {
        roomsList.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem;">
                Keine Räume vorhanden.
            </div>
        `;
        return;
    }

    rooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'glass-card room-card';
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';
        card.style.padding = '1rem';
        card.style.marginBottom = '0.5rem';

        const adminButtons = isAdmin ? `
            <button class="btn-sm btn-primary" onclick="editRoom(${room.id})" title="Bearbeiten" style="margin-right: 0.5rem; background: rgba(255, 255, 255, 0.2); border: none; color: white;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button class="btn-sm btn-danger" onclick="deleteRoom(${room.id})" title="Entfernen">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        ` : '';

        card.innerHTML = `
            <div class="room-info">
                <h3 style="margin: 0; font-size: 1.1rem;">${room.name}</h3>
                <small style="color: var(--text-muted);">Erstellt am: ${new Date(room.timestamp).toLocaleDateString()}</small>
            </div>

            <div style="display: flex; align-items: center;">
                ${adminButtons}
            </div>
        `;
        roomsList.appendChild(card);
    });
}

async function addRoom(name) {
    if (!name) return;
    try {
        const response = await fetch(`${API_BASE}/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name })
        });
        if (response.ok) {
            await loadRooms();
        }
    } catch (err) {
        console.error('Failed to add room:', err);
    }
}

window.deleteRoom = async function (id) {
    if (confirm('Möchtest du diesen Raum wirklich entfernen?')) {
        try {
            const response = await fetch(`${API_BASE}/rooms/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                await loadRooms();
            }
        } catch (err) {
            console.error('Failed to delete room:', err);
        }
    }
};

window.editRoom = async function (id) {
    const room = rooms.find(r => r.id === id);
    if (!room) return;

    const newName = prompt('Neuer Name für den Raum:', room.name);
    if (newName && newName.trim() !== '' && newName !== room.name) {
        try {
            const response = await fetch(`${API_BASE}/rooms/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName.trim() })
            });
            if (response.ok) {
                await loadRooms();
            }
        } catch (err) {
            console.error('Failed to update room:', err);
        }
    }
};

// Event Listeners
if (addRoomForm) {
    addRoomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = roomInput.value.trim();
        if (name) {
            addRoom(name).then(() => {
                roomInput.value = '';
            });
        }
    });
}

// Expose refresh function
window.roomSystem = {
    renderRooms,
    loadRooms
};

// Initial Load
loadRooms();
