// Auth Logic
const currentUser = localStorage.getItem('currentUser');
const path = window.location.pathname;

const API_BASE = '/api';

// Redirect logic
const isDashboard = path.endsWith('dashboard.html');
const isLogin = path.endsWith('index.html') || path.endsWith('/');

if (isDashboard && !currentUser) {
    window.location.href = 'index.html';
} else if (isLogin && currentUser) {
    if (!localStorage.getItem('justLoggedOut')) {
        window.location.href = 'dashboard.html';
    } else {
        localStorage.removeItem('justLoggedOut');
    }
}

// Logic for Login/Register Page
const authForm = document.getElementById('authForm');
if (authForm) {
    const showLoginBtn = document.getElementById('showLoginBtn');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const nameGroup = document.getElementById('nameGroup');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submitBtn');
    const errorMsg = document.getElementById('errorMsg');

    let isRegisterMode = false;

    const toggleMode = (register) => {
        isRegisterMode = register;
        errorMsg.textContent = '';
        authForm.reset();

        if (isRegisterMode) {
            showRegisterBtn.classList.add('active');
            showLoginBtn.classList.remove('active');
            nameGroup.style.display = 'block';
            nameInput.required = true;
            submitBtn.innerHTML = `<span>Registrieren</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>`;
        } else {
            showLoginBtn.classList.add('active');
            showRegisterBtn.classList.remove('active');
            nameGroup.style.display = 'none';
            nameInput.required = false;
            submitBtn.innerHTML = `<span>Anmelden</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>`;
        }
    };

    showLoginBtn.addEventListener('click', () => toggleMode(false));
    showRegisterBtn.addEventListener('click', () => toggleMode(true));

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMsg.textContent = '';

        const email = emailInput.value.trim().toLowerCase();
        const password = passwordInput.value.trim();

        try {
            if (isRegisterMode) {
                const name = nameInput.value.trim();
                const response = await fetch(`${API_BASE}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Registrierung fehlgeschlagen');

                localStorage.setItem('currentUser', data.user.name);
                localStorage.setItem('currentUserEmail', data.user.email);
                localStorage.setItem('currentUserRole', data.user.role);
                window.location.href = 'dashboard.html';

            } else {
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Login fehlgeschlagen');

                localStorage.setItem('currentUser', data.name);
                localStorage.setItem('currentUserEmail', data.email);
                localStorage.setItem('currentUserRole', data.role);
                window.location.href = 'dashboard.html';
            }
        } catch (err) {
            errorMsg.textContent = err.message;
        }
    });
}

window.logout = function () {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserEmail');
    localStorage.removeItem('currentUserRole');
    localStorage.setItem('justLoggedOut', 'true');
    window.location.href = 'index.html';
};

if (isDashboard && currentUser) {
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay) {
        userDisplay.textContent = currentUser;
    }
}

