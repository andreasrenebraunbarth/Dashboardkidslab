// Chat Logic
let currentSocket = null;
let currentRoomId = null;

function initSocket() {
    if (typeof io === 'undefined') {
        console.error('Socket.io not loaded');
        return;
    }

    // Connect to same host if localhost, or configured API URL
    currentSocket = io(API_URL);

    currentSocket.on('connect', () => {
        console.log('Connected to socket server');
    });

    currentSocket.on('receive_message', (message) => {
        if (message.roomId === currentRoomId) {
            appendMessage(message);
        }
    });
}

window.enterChatRoom = async function (roomId, roomName) {
    if (!currentSocket) initSocket();

    currentRoomId = roomId;

    // Switch View
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.getElementById('view-chat').style.display = 'flex'; // Flex for layout
    document.getElementById('chatRoomTitle').textContent = roomName;

    // Join Room in Socket
    currentSocket.emit('join_room', roomId);

    // Load previous messages
    loadMessages(roomId);
};

async function loadMessages(roomId) {
    const messagesBox = document.getElementById('chatMessages');
    messagesBox.innerHTML = '<div style="text-align:center; color: var(--text-muted);">Lade Nachrichten...</div>';

    const messages = await window.apiCall(`/messages/${roomId}`);

    messagesBox.innerHTML = ''; // Clear loading
    if (messages && Array.isArray(messages)) {
        messages.forEach(msg => appendMessage(msg));
        scrollToBottom();
    }
}

function appendMessage(msg) {
    const messagesBox = document.getElementById('chatMessages');
    const isMe = msg.userId === localStorage.getItem('currentUserId');

    const msgDiv = document.createElement('div');
    msgDiv.style.display = 'flex';
    msgDiv.style.flexDirection = 'column';
    msgDiv.style.alignItems = isMe ? 'flex-end' : 'flex-start';
    msgDiv.style.marginBottom = '1rem';

    const bubble = document.createElement('div');
    bubble.style.maxWidth = '70%';
    bubble.style.padding = '0.8rem 1rem';
    bubble.style.borderRadius = '12px';
    bubble.style.background = isMe ? 'linear-gradient(135deg, #ec4899, #8b5cf6)' : 'rgba(255,255,255,0.1)';
    bubble.style.color = 'white';
    bubble.textContent = msg.content;

    // Name tag
    if (!isMe) {
        const nameTag = document.createElement('span');
        nameTag.textContent = msg.userName;
        nameTag.style.fontSize = '0.75rem';
        nameTag.style.color = 'var(--text-muted)';
        nameTag.style.marginBottom = '0.2rem';
        nameTag.style.marginLeft = '0.5rem';
        msgDiv.appendChild(nameTag);
    }

    msgDiv.appendChild(bubble);
    messagesBox.appendChild(msgDiv);

    scrollToBottom();
}

function scrollToBottom() {
    const messagesBox = document.getElementById('chatMessages');
    messagesBox.scrollTop = messagesBox.scrollHeight;
}

// Chat Form
const chatForm = document.getElementById('chatForm');
if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = document.getElementById('chatInput');
        const content = input.value.trim();

        if (content && currentRoomId && currentSocket) {
            const userId = localStorage.getItem('currentUserId');
            const userName = localStorage.getItem('currentUser');

            currentSocket.emit('send_message', {
                roomId: currentRoomId,
                userId,
                userName,
                content
            });
            input.value = '';
        }
    });
}

// Exit Chat
const exitChatBtn = document.getElementById('exitChatBtn');
if (exitChatBtn) {
    exitChatBtn.addEventListener('click', () => {
        document.getElementById('view-chat').style.display = 'none';
        document.getElementById('view-rooms').style.display = 'block';
        currentRoomId = null;
    });
}
