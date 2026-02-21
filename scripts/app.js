// App Logic - Handles Dashboard Navigation and Admin/Settings Features

document.addEventListener('DOMContentLoaded', () => {
    const currentUserRole = localStorage.getItem('currentUserRole');
    const currentUserEmail = localStorage.getItem('currentUserEmail');

    // Display User Role
    const userRoleDisplay = document.getElementById('userRoleDisplay');
    if (userRoleDisplay) {
        userRoleDisplay.textContent = currentUserRole === 'admin' ? 'Administrator' : 'Benutzer';
        userRoleDisplay.classList.add(currentUserRole === 'admin' ? 'role-admin' : 'role-user');
    }

    // --- Navigation Logic ---
    const navItems = document.querySelectorAll('.nav-item');
    const views = document.querySelectorAll('.view-section');
    const adminLink = document.getElementById('adminLink');

    // Show Admin Link if user is admin
    if (currentUserRole === 'admin') {
        adminLink.style.display = 'flex';
        const adminAddRoomSection = document.getElementById('adminAddRoomSection');
        if (adminAddRoomSection) adminAddRoomSection.style.display = 'block';
        renderUserTable();
    }

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetView = item.dataset.view;
            if (!targetView) return;

            // Security Check for Admin Panel
            if (targetView === 'admin' && currentUserRole !== 'admin') {
                alert('Zugriff verweigert!');
                return;
            }

            // Update Active State
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Show Target View
            views.forEach(view => {
                view.style.display = view.id === `view-${targetView}` ? 'block' : 'none';
            });

            // Refresh data based on view
            if (targetView === 'admin') {
                renderUserTable();
            } else if (targetView === 'rooms') {
                if (window.roomSystem && window.roomSystem.loadRooms) {
                    window.roomSystem.loadRooms();
                }
            } else if (targetView === 'dashboard') {
                if (typeof loadIdeas === 'function') loadIdeas();
            }
        });
    });

    // --- Admin Panel Logic ---
    const adminAddUserForm = document.getElementById('adminAddUserForm');
    const userTableBody = document.getElementById('userTableBody');

    async function renderUserTable() {
        if (!userTableBody) return;
        try {
            const response = await fetch(`${API_BASE}/users`);
            const users = await response.json();
            userTableBody.innerHTML = '';

            // Update stats
            const totalUsersCount = document.getElementById('totalUsersCount');
            if (totalUsersCount) totalUsersCount.textContent = users.length;

            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>
                        <select class="role-select styled-select-small" onchange="updateUserRole('${user.email}', this.value)" ${user.email === currentUserEmail ? 'disabled' : ''}>
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </td>
                    <td>
                        ${user.email !== currentUserEmail ? `<button class="btn-sm btn-danger" onclick="deleteUser('${user.email}')">Löschen</button>` : '<span class="text-muted">Du selbst</span>'}
                    </td>
                `;
                userTableBody.appendChild(tr);
            });
        } catch (err) {
            console.error('Failed to load users:', err);
        }
    }

    // Expose global functions for inline events
    window.updateUserRole = async (email, newRole) => {
        if (confirm(`Rolle von ${email} auf ${newRole} ändern?`)) {
            try {
                const response = await fetch(`${API_BASE}/users/${email}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role: newRole })
                });
                if (response.ok) {
                    if (email === currentUserEmail) {
                        localStorage.setItem('currentUserRole', newRole);
                        window.location.reload();
                    } else {
                        renderUserTable();
                    }
                }
            } catch (err) {
                console.error('Failed to update role:', err);
            }
        } else {
            renderUserTable();
        }
    };

    window.deleteUser = async (email) => {
        if (confirm(`Benutzer ${email} wirklich löschen?`)) {
            try {
                const response = await fetch(`${API_BASE}/users/${email}`, {
                    method: 'DELETE'
                });
                if (response.ok) {
                    renderUserTable();
                }
            } catch (err) {
                console.error('Failed to delete user:', err);
            }
        }
    };

    if (adminAddUserForm) {
        adminAddUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('adminName').value;
            const email = document.getElementById('adminEmail').value.toLowerCase();
            const password = document.getElementById('adminPassword').value;
            const role = document.getElementById('adminRole').value;

            try {
                const response = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, role })
                });

                if (response.ok) {
                    adminAddUserForm.reset();
                    renderUserTable();
                    alert('Benutzer angelegt.');
                } else {
                    const data = await response.json();
                    alert(data.error || 'Fehler beim Anlegen.');
                }
            } catch (err) {
                console.error('Failed to add user:', err);
            }
        });
    }

    // --- Settings Logic ---
    const settingsForm = document.getElementById('settingsForm');
    const settingsMsg = document.getElementById('settingsMsg');

    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = document.getElementById('settingsName').value.trim();
            const newPassword = document.getElementById('settingsPassword').value.trim();

            if (!newName && !newPassword) return;

            const updates = {};
            if (newName) updates.name = newName;
            if (newPassword) updates.password = newPassword;

            try {
                const response = await fetch(`${API_BASE}/users/${currentUserEmail}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });

                if (response.ok) {
                    settingsMsg.textContent = 'Profil erfolgreich aktualisiert.';
                    if (newName) {
                        localStorage.setItem('currentUser', newName);
                        document.getElementById('userDisplay').textContent = newName;
                    }
                    setTimeout(() => settingsMsg.textContent = '', 3000);
                } else {
                    alert('Fehler beim Speichern.');
                }
            } catch (err) {
                console.error('Failed to update settings:', err);
            }
        });
    }

});

