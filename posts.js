// posts.js

const fabBtn = document.getElementById('fab-btn');
const modal = document.getElementById('create-post-modal');
const closeBtn = document.getElementById('close-modal-btn');
const broadcastBtn = document.getElementById('broadcast-btn');
const postContent = document.getElementById('post-content');

// Open modal
fabBtn.addEventListener('click', () => {
    modal.classList.remove('hidden');
});

// Close modal with X button
closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
    postContent.value = '';
});

// Close modal when clicking outside
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
        postContent.value = '';
    }
});

// Broadcast post
broadcastBtn.addEventListener('click', async () => {
    const content = postContent.value.trim();
    if (!content) return;

    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return;

    broadcastBtn.innerText = 'Transmitting...';
    broadcastBtn.disabled = true;

    const { error } = await window.supabaseClient
        .from('posts')
        .insert({ user_id: user.id, content: content });

    if (error) {
        console.error('Post error:', error.message);
        broadcastBtn.innerText = 'Failed. Try again.';
        broadcastBtn.disabled = false;
        return;
    }

    // Success
    modal.classList.add('hidden');
    postContent.value = '';
    broadcastBtn.innerHTML = `Broadcast <span class="material-symbols-outlined group-hover:translate-x-1 transition-transform">send</span>`;
    broadcastBtn.disabled = false;
});