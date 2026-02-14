// State
let rooms = [];

async function renderRooms() {
    if (!roomsList) return;
    roomsList.innerHTML = '<p style="text-align:center; padding: 2rem;">Lade Räume...</p>';

    const currentUserRole = localStorage.getItem('currentUserRole');
    const isAdmin = currentUserRole === 'admin';

    // Fetch from API
    rooms = await window.apiCall('/rooms');

    if (!rooms || rooms.error) {
        roomsList.innerHTML = '<p style="text-align:center; color: #f87171;">Fehler beim Laden der Räume.</p>';
        return;
    }

    roomsList.innerHTML = '';

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
        card.style.cursor = 'pointer'; // Make clickable

        // Click to enter chat
        card.onclick = (e) => {
            // Prevent entering if clicking admin buttons
            if (e.target.closest('button')) return;
            window.enterChatRoom(room._id, room.name);
        };

        const adminButtons = isAdmin ? `
            <button class="btn-sm btn-danger" onclick="deleteRoom('${room._id}')" title="Entfernen">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        ` : '';

        card.innerHTML = `
            <div class="room-info">
                <h3 style="margin: 0; font-size: 1.1rem;">${room.name}</h3>
                <small style="color: var(--text-muted);">Erstellt am: ${new Date(room.createdAt).toLocaleDateString()}</small>
            </div>

            <div style="display: flex; align-items: center;">
                <span style="font-size: 0.8rem; background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 10px; margin-right: 10px;">Beitreten -></span>
                ${adminButtons}
            </div>
        `;
        roomsList.appendChild(card);
    });
}

async function addRoom(name) {
    if (!name) return;
    const res = await window.apiCall('/rooms', 'POST', { name });
    if (res && !res.error) {
        renderRooms();
    } else {
        alert('Fehler: ' + (res.error || 'Unbekannt'));
    }
}

window.deleteRoom = async function (id) {
    if (confirm('Möchtest du diesen Raum wirklich entfernen?')) {
        await window.apiCall(`/rooms/${id}`, 'DELETE');
        renderRooms();
    }
};

window.editRoom = function (id) {
    alert("Edit not implemented in API version yet");
};

// Event Listeners
if (addRoomForm) {
    addRoomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = roomInput.value.trim();
        if (name) {
            addRoom(name);
            roomInput.value = '';
        }
    });
}

// Expose refresh function specifically for when the view becomes active
window.roomSystem = {
    renderRooms
};

