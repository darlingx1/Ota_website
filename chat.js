// chat.js

let currentUser = null;
let activeConversationId = null;
let realtimeSubscription = null;

const conversationsList = document.getElementById('conversations-list');
const messagesStream = document.getElementById('messages-stream');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const chatHeader = document.getElementById('chat-header');
const emptyState = document.getElementById('empty-state');

// --- Helpers ---
function timeAgo(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function getInitial(name) {
    return (name || '?')[0].toUpperCase();
}

function avatarHtml(profile, size = 10) {
    const s = `w-${size} h-${size}`;
    if (profile?.avatar_url) {
        return `<img src="${profile.avatar_url}" class="${s} rounded-full object-cover"/>`;
    }
    return `<div class="${s} rounded-full flex items-center justify-center text-white font-bold text-sm"
        style="background:linear-gradient(135deg,#7e51ff,#03fbfc)">
        ${getInitial(profile?.display_name)}
    </div>`;
}

// --- Load Conversations ---
async function loadConversations() {
    const { data, error } = await window.supabaseClient
        .from('conversations')
        .select(`
            id, created_at,
            user1:user1_id(id, display_name, avatar_url),
            user2:user2_id(id, display_name, avatar_url)
        `)
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .order('created_at', { ascending: false });

    if (error) { console.error('Conversations error:', error.message); return; }

    conversationsList.innerHTML = '';

    if (!data.length) {
        conversationsList.innerHTML = '<p class="text-xs text-on-surface-variant font-label px-4 py-6">No conversations yet.</p>';
        return;
    }

    data.forEach(conv => {
        const other = conv.user1.id === currentUser.id ? conv.user2 : conv.user1;
        const div = document.createElement('div');
        div.className = 'flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors rounded-xl';
        div.dataset.convId = conv.id;
        div.dataset.otherId = other.id;
        div.dataset.otherName = other.display_name;
        div.innerHTML = `
            <div class="relative flex-shrink-0">
                ${avatarHtml(other, 10)}
                <div class="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full border-2 border-[#0c0d1b]"></div>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-on-surface truncate">${other.display_name}</p>
                <p class="text-[10px] text-on-surface-variant font-label truncate">${timeAgo(conv.created_at)}</p>
            </div>
        `;
        div.addEventListener('click', () => openConversation(conv.id, other));
        conversationsList.appendChild(div);
    });

    // Auto-open conversation from URL param
    const params = new URLSearchParams(window.location.search);
    const convId = params.get('conv');
    const userId = params.get('user');

    if (convId) {
        const conv = data.find(c => c.id === convId);
        if (conv) {
            const other = conv.user1.id === currentUser.id ? conv.user2 : conv.user1;
            openConversation(conv.id, other);
        }
    } else if (userId) {
        await startOrOpenConversation(userId);
    }
}

// --- Open Conversation ---
async function openConversation(convId, otherUser) {
    activeConversationId = convId;

    // Highlight active conversation
    document.querySelectorAll('#conversations-list > div').forEach(d => {
        d.classList.toggle('bg-white/5', d.dataset.convId === convId);
    });

    // Update header
    chatHeader.innerHTML = `
        <div class="flex items-center gap-4">
            <div class="relative">
                ${avatarHtml(otherUser, 12)}
                <div class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-secondary rounded-full border-2 border-[#0c0d1b]"></div>
            </div>
            <div>
                <h2 class="text-on-surface font-headline font-bold text-xl tracking-tight">${otherUser.display_name}</h2>
                <p class="text-on-surface-variant text-xs flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span> Online
                </p>
            </div>
        </div>
        <div class="flex items-center gap-4">
            <button class="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors">
                <span class="material-symbols-outlined">call</span>
            </button>
            <button class="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors">
                <span class="material-symbols-outlined">videocam</span>
            </button>
            <button class="p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors">
                <span class="material-symbols-outlined">info</span>
            </button>
        </div>
    `;

    if (emptyState) emptyState.classList.add('hidden');
    messagesStream.classList.remove('hidden');

    await loadMessages(convId);
    subscribeToMessages(convId);
}

// --- Load Messages ---
async function loadMessages(convId) {
    const { data, error } = await window.supabaseClient
        .from('messages')
        .select('id, content, created_at, sender_id, profiles(display_name, avatar_url)')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

    if (error) { console.error('Messages error:', error.message); return; }

    messagesStream.innerHTML = '';
    data.forEach(msg => renderMessage(msg));
    scrollToBottom();
}

// --- Render Message ---
function renderMessage(msg) {
    const isMe = msg.sender_id === currentUser.id;
    const profile = msg.profiles;

    const div = document.createElement('div');
    div.className = `flex gap-4 max-w-[80%] ${isMe ? 'self-end flex-row-reverse' : ''}`;
    div.innerHTML = `
        <div class="w-8 h-8 rounded-full overflow-hidden shrink-0">
            ${avatarHtml(profile, 8)}
        </div>
        <div class="flex flex-col ${isMe ? 'items-end' : ''}">
            <div class="${isMe
                ? 'bg-gradient-to-br from-primary to-primary-dim text-on-primary-container shadow-lg shadow-primary/10'
                : 'bg-[rgba(23,24,41,0.7)] border border-white/5 text-on-surface'
            } p-4 rounded-2xl ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'} text-sm leading-relaxed backdrop-blur-sm">
                ${msg.content}
            </div>
            <span class="text-[10px] text-on-surface-variant/60 mt-1 ${isMe ? 'mr-1' : 'ml-1'} font-label">
                ${timeAgo(msg.created_at)}
                ${isMe ? '<span class="text-secondary ml-1">✓✓</span>' : ''}
            </span>
        </div>
    `;
    messagesStream.appendChild(div);
}

// --- Real-time Subscription ---
function subscribeToMessages(convId) {
    if (realtimeSubscription) realtimeSubscription.unsubscribe();

    realtimeSubscription = window.supabaseClient
        .channel(`messages:${convId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${convId}`
        }, async (payload) => {
            // Fetch full message with profile
            const { data } = await window.supabaseClient
                .from('messages')
                .select('id, content, created_at, sender_id, profiles(display_name, avatar_url)')
                .eq('id', payload.new.id)
                .single();
            if (data) {
                renderMessage(data);
                scrollToBottom();
            }
        })
        .subscribe();
}

// --- Send Message ---
async function sendMessage() {
    const content = messageInput.value.trim();
    if (!content || !activeConversationId) return;

    messageInput.value = '';

    const { error } = await window.supabaseClient
        .from('messages')
        .insert({
            conversation_id: activeConversationId,
            sender_id: currentUser.id,
            content
        });

    if (error) console.error('Send error:', error.message);
}

// --- Start or Open Conversation ---
async function startOrOpenConversation(otherUserId) {
    // Check if conversation already exists
    const { data: existing } = await window.supabaseClient
        .from('conversations')
        .select('id, user1:user1_id(id, display_name, avatar_url), user2:user2_id(id, display_name, avatar_url)')
        .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${currentUser.id})`)
        .single();

    if (existing) {
        const other = existing.user1.id === currentUser.id ? existing.user2 : existing.user1;
        openConversation(existing.id, other);
        return;
    }

    // Create new conversation
    const { data: newConv, error } = await window.supabaseClient
        .from('conversations')
        .insert({ user1_id: currentUser.id, user2_id: otherUserId })
        .select('id, user1:user1_id(id, display_name, avatar_url), user2:user2_id(id, display_name, avatar_url)')
        .single();

    if (error) { console.error('Create conversation error:', error.message); return; }

    const other = newConv.user1.id === currentUser.id ? newConv.user2 : newConv.user1;
    await loadConversations();
    openConversation(newConv.id, other);
}

// --- Scroll to bottom ---
function scrollToBottom() {
    messagesStream.scrollTop = messagesStream.scrollHeight;
}

// --- Event Listeners ---
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// --- Initialize ---
async function init() {
    const { data: { user }, error } = await window.supabaseClient.auth.getUser();
    if (error || !user) { window.location.href = 'login.html'; return; }
    currentUser = user;
    await loadConversations();
}

init();