// posts.js

const fabBtn = document.getElementById('fab-btn');
const modal = document.getElementById('create-post-modal');
const closeBtn = document.getElementById('close-modal-btn');
const broadcastBtn = document.getElementById('broadcast-btn');
const postContent = document.getElementById('post-content');
const feedContainer = document.getElementById('feed-container');
const imageUploadBtn = document.getElementById('image-upload-btn');
const imageInput = document.getElementById('image-input');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreview = document.getElementById('image-preview');
const removeImageBtn = document.getElementById('remove-image-btn');

let selectedImageFile = null;

// Open file picker when image button clicked
imageUploadBtn.addEventListener('click', () => imageInput.click());

// Show preview when image selected
imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (!file) return;
    selectedImageFile = file;
    const url = URL.createObjectURL(file);
    imagePreview.src = url;
    imagePreviewContainer.classList.remove('hidden');
});

// Remove selected image
removeImageBtn.addEventListener('click', () => {
    selectedImageFile = null;
    imageInput.value = '';
    imagePreviewContainer.classList.add('hidden');
    imagePreview.src = '';
});

// Open modal
fabBtn.addEventListener('click', () => modal.classList.remove('hidden'));

// Close modal
closeBtn.addEventListener('click', closeModal);
modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

function closeModal() {
    modal.classList.add('hidden');
    postContent.value = '';
    selectedImageFile = null;
    imageInput.value = '';
    imagePreviewContainer.classList.add('hidden');
    imagePreview.src = '';
}

// Format time ago
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

// Render a single post card matching your design
function createPostCard(post, currentUser) {
     
    const username = post.profiles?.display_name || 'Unknown';
    const avatarUrl = post.profiles?.avatar_url;
    const time = timeAgo(post.created_at);

    const article = document.createElement('article');
    article.className = 'bg-surface-container rounded-2xl p-6 relative overflow-hidden';
    article.innerHTML = `
        <div class="absolute -right-12 -top-12 w-48 h-48 bg-primary/5 blur-3xl rounded-full"></div>
        <div class="flex items-center gap-3 mb-4">
            <a href="other_profile.html?id=${post.user_id}" class="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                ${avatarUrl
                    ? `<img class="w-full h-full object-cover" src="${avatarUrl}" alt="${username}"/>`
                    : `<div style="width:40px;height:40px;border-radius:8px;background:linear-gradient(135deg,#7e51ff,#03fbfc);display:flex;align-items:center;justify-content:center;font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:16px;color:#fff;">${getInitial(username)}</div>`
                }
            </a>
            <div>
                <a href="other_profile.html?id=${post.user_id}">
                    <h4 class="text-sm font-bold text-on-surface hover:text-primary transition-colors">${username}</h4>
                </a>
                <span class="text-[10px] text-on-surface-variant font-label">${time}</span>
            </div>
        </div>
        <p class="text-sm leading-relaxed text-on-surface/90 font-body mb-4">${post.content}</p>
${post.image_url
    ? `<div class="relative w-full rounded-xl overflow-hidden mb-4">
        <img src="${post.image_url}" class="w-full object-cover max-h-96"/>
       </div>`
    : ''
}
        <div class="flex items-center justify-between border-t border-white/5 pt-4">
        <div class="flex items-center gap-4">
          <button class="like-btn flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors" data-id="${post.id}" data-liked="false">
    <span class="material-symbols-outlined text-xl">favorite</span>
    <span class="like-count text-xs font-label">${post.likes_count ?? 0}</span>
</button>
           <button class="comment-btn flex items-center gap-1.5 text-on-surface-variant hover:text-secondary transition-colors" data-id="${post.id}">
    <span class="material-symbols-outlined text-xl">comment</span>
    <span class="comment-count text-xs font-label">${post.comments_count ?? 0}</span>
</button>
            <button class="share-btn flex items-center gap-1.5 text-on-surface-variant hover:text-tertiary transition-colors" data-id="${post.id}">
    <span class="material-symbols-outlined text-xl">share</span>
</button>
        </div>
        <div class="flex items-center gap-2">
            <button class="text-on-surface-variant hover:text-white transition-colors">
                <span class="material-symbols-outlined">bookmark</span>
            </button>
            ${currentUser && currentUser.id === post.user_id
                ? `<button class="delete-btn text-on-surface-variant hover:text-error transition-colors" data-id="${post.id}">
                    <span class="material-symbols-outlined">delete</span>
                   </button>`
                : ''
            }
        </div>
    </div>
    
   <div class="comments-section hidden px-0 pt-4" id="comments-${post.id}">
            <div class="comments-list space-y-3 mb-4"></div>
            <div class="flex gap-3 items-center">
                <input 
                    type="text" 
                    placeholder="Add a comment..." 
                    class="comment-input flex-1 bg-surface-container-low border-none rounded-full px-4 py-2 text-sm font-body text-on-surface placeholder:text-on-surface-variant/50 focus:ring-1 focus:ring-primary/50"
                    data-id="${post.id}"
                />
                <button class="submit-comment-btn text-primary hover:bg-primary/10 p-2 rounded-full transition-colors" data-id="${post.id}">
                    <span class="material-symbols-outlined">send</span>
                </button>
            </div>
        </div>
    `;
    return article;
}

// Load posts from Supabase
async function loadFeed() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();

    const { data: posts, error } = await window.supabaseClient
        .from('posts')
        .select('id, content, created_at, user_id, likes_count, comments_count, image_url, profiles(display_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Feed error:', error.message);
        feedContainer.innerHTML = '<p class="text-center text-error font-label text-sm py-8">Failed to load feed.</p>';
        return;
    }

    feedContainer.innerHTML = '';

    if (!posts.length) {
        feedContainer.innerHTML = '<p class="text-center text-on-surface-variant font-label text-sm py-8">No transmissions yet. Be the first!</p>';
        return;
    }

    posts.forEach(post => feedContainer.appendChild(createPostCard(post, user)));
    // Check which posts the current user has already liked
if (user) {
    const { data: userLikes } = await window.supabaseClient
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id);

    if (userLikes) {
        const likedPostIds = userLikes.map(l => l.post_id);
        likedPostIds.forEach(postId => {
            const btn = feedContainer.querySelector(`.like-btn[data-id="${postId}"]`);
            if (!btn) return;
            btn.dataset.liked = 'true';
            btn.querySelector('.material-symbols-outlined').style.fontVariationSettings = "'FILL' 1";
            btn.classList.add('text-primary');
            btn.classList.remove('text-on-surface-variant');
        });
    }
}
}

// Broadcast post
broadcastBtn.addEventListener('click', async () => {
    const content = postContent.value.trim();
    if (!content) return;

    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return;

    broadcastBtn.disabled = true;
    broadcastBtn.innerText = 'Transmitting...';

    let imageUrl = null;

    // Upload image if one is selected
    if (selectedImageFile) {
        const fileExt = selectedImageFile.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await window.supabaseClient.storage
            .from('posts')
            .upload(filePath, selectedImageFile);

        if (uploadError) {
            console.error('Image upload error:', uploadError.message);
            broadcastBtn.disabled = false;
            broadcastBtn.innerText = 'Failed. Try again.';
            return;
        }

        const { data: urlData } = window.supabaseClient.storage
            .from('posts')
            .getPublicUrl(filePath);

        imageUrl = urlData.publicUrl;
    }

    

    const { error } = await window.supabaseClient
        .from('posts')
        .insert({ user_id: user.id, content, image_url: imageUrl });

    if (error) {
        console.error('Post error:', error.message);
        broadcastBtn.disabled = false;
        broadcastBtn.innerText = 'Failed. Try again.';
        return;
    }

    closeModal();
    broadcastBtn.disabled = false;
    broadcastBtn.innerHTML = `Broadcast <span class="material-symbols-outlined">send</span>`;
    loadFeed();
});
// Handle delete clicks
feedContainer.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (!deleteBtn) return;

    const postId = deleteBtn.dataset.id;
    if (!confirm('Delete this transmission?')) return;

    const { error } = await window.supabaseClient
        .from('posts')
        .delete()
        .eq('id', postId);

    if (error) {
        console.error('Delete error:', error.message);
        return;
    }

    deleteBtn.closest('article').remove();
});
// Handle like clicks
feedContainer.addEventListener('click', async (e) => {
    const likeBtn = e.target.closest('.like-btn');
    if (!likeBtn) return;
    if (likeBtn.dataset.loading === 'true') return; // prevent double click

    likeBtn.dataset.loading = 'true'; // lock the button

    const postId = likeBtn.dataset.id;
    const liked = likeBtn.dataset.liked === 'true';
    const countEl = likeBtn.querySelector('.like-count');
    const icon = likeBtn.querySelector('.material-symbols-outlined');

    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) { likeBtn.dataset.loading = 'false'; return; }

    if (liked) {
        await window.supabaseClient
            .from('likes')
            .delete()
            .eq('user_id', user.id)
            .eq('post_id', postId);

        likeBtn.dataset.liked = 'false';
        icon.style.fontVariationSettings = "'FILL' 0";
        likeBtn.classList.remove('text-primary');
        likeBtn.classList.add('text-on-surface-variant');
        countEl.innerText = Math.max(0, parseInt(countEl.innerText) - 1);
    } else {
        await window.supabaseClient
            .from('likes')
            .insert({ user_id: user.id, post_id: postId });

        likeBtn.dataset.liked = 'true';
        icon.style.fontVariationSettings = "'FILL' 1";
        likeBtn.classList.add('text-primary');
        likeBtn.classList.remove('text-on-surface-variant');
        countEl.innerText = parseInt(countEl.innerText) + 1;
    }

    likeBtn.dataset.loading = 'false'; // unlock the button
});
// Handle comment button click (toggle comments section)
feedContainer.addEventListener('click', async (e) => {
    const commentBtn = e.target.closest('.comment-btn');
    if (!commentBtn) return;

    const postId = commentBtn.dataset.id;
    const section = document.getElementById(`comments-${postId}`);
    const isHidden = section.classList.contains('hidden');

    if (isHidden) {
        section.classList.remove('hidden');
        loadComments(postId);
    } else {
        section.classList.add('hidden');
    }
});

// Load comments for a post
async function loadComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    const list = section.querySelector('.comments-list');
    list.innerHTML = '<p class="text-xs text-on-surface-variant font-label">Loading...</p>';

    const { data: comments, error } = await window.supabaseClient
        .from('comments')
        .select('id, content, created_at, user_id, profiles(display_name, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) { list.innerHTML = '<p class="text-xs text-error">Failed to load comments.</p>'; return; }

    list.innerHTML = '';

    if (!comments.length) {
        list.innerHTML = '<p class="text-xs text-on-surface-variant font-label">No comments yet. Be the first!</p>';
        return;
    }

    const { data: { user } } = await window.supabaseClient.auth.getUser();

    comments.forEach(c => {
        const username = c.profiles?.display_name || 'Unknown';
        const div = document.createElement('div');
        div.className = 'flex items-start gap-3';
        div.innerHTML = `
            <div class="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 ${c.profiles?.avatar_url ? '' : 'flex items-center justify-center'}" 
                 style="${c.profiles?.avatar_url ? '' : 'background:linear-gradient(135deg,#7e51ff,#03fbfc);font-family:Space Grotesk,sans-serif;font-weight:700;font-size:11px;color:#fff;'}">
                ${c.profiles?.avatar_url
                    ? `<img src="${c.profiles.avatar_url}" class="w-full h-full object-cover"/>`
                    : getInitial(username)
                }
            </div>
            <div class="flex-1 bg-surface-container-low rounded-xl px-3 py-2">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-on-surface">${username}</span>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] text-on-surface-variant font-label">${timeAgo(c.created_at)}</span>
                        ${user && user.id === c.user_id
                            ? `<button class="delete-comment-btn text-on-surface-variant hover:text-error transition-colors" data-comment-id="${c.id}" data-post-id="${postId}">
                                <span class="material-symbols-outlined" style="font-size:14px;">delete</span>
                               </button>`
                            : ''
                        }
                    </div>
                </div>
                <p class="text-xs text-on-surface/80 font-body mt-1">${c.content}</p>
            </div>
        `;
        list.appendChild(div);
    });
}

// Handle submit comment
feedContainer.addEventListener('click', async (e) => {
    const submitBtn = e.target.closest('.submit-comment-btn');
    if (!submitBtn) return;
    if (submitBtn.dataset.loading === 'true') return;

    submitBtn.dataset.loading = 'true';

    const postId = submitBtn.dataset.id;
    const section = document.getElementById(`comments-${postId}`);
    const input = section.querySelector('.comment-input');
    const content = input.value.trim();
    if (!content) { submitBtn.dataset.loading = 'false'; return; }

    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) { submitBtn.dataset.loading = 'false'; return; }

    const { error } = await window.supabaseClient
        .from('comments')
        .insert({ user_id: user.id, post_id: postId, content });

    if (error) { console.error('Comment error:', error.message); submitBtn.dataset.loading = 'false'; return; }

    input.value = '';

    const countEl = document.querySelector(`.comment-btn[data-id="${postId}"] .comment-count`);
    if (countEl) countEl.innerText = parseInt(countEl.innerText) + 1;

    loadComments(postId);
    submitBtn.dataset.loading = 'false';
});
// Handle delete comment
feedContainer.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.delete-comment-btn');
    if (!deleteBtn) return;

    const commentId = deleteBtn.dataset.commentId;
    const postId = deleteBtn.dataset.postId;

    const { error } = await window.supabaseClient
        .from('comments')
        .delete()
        .eq('id', commentId);

    if (error) { console.error('Delete comment error:', error.message); return; }

    // Update comment count
    const countEl = document.querySelector(`.comment-btn[data-id="${postId}"] .comment-count`);
    if (countEl) countEl.innerText = Math.max(0, parseInt(countEl.innerText) - 1);

    loadComments(postId);
});
// Handle share clicks
feedContainer.addEventListener('click', async (e) => {
    const shareBtn = e.target.closest('.share-btn');
    if (!shareBtn) return;

    const postId = shareBtn.dataset.id;
    const postUrl = `${window.location.origin}/pages/post.html?id=${postId}`;

    if (navigator.share) {
        // Mobile native share sheet
        await navigator.share({
            title: 'NEON STAGE Transmission',
            text: 'Check out this transmission on NEON STAGE!',
            url: postUrl
        });
    } else {
        // Desktop fallback — copy to clipboard
        await navigator.clipboard.writeText(postUrl);
        
        // Visual feedback
        const icon = shareBtn.querySelector('.material-symbols-outlined');
        icon.innerText = 'check';
        shareBtn.classList.add('text-secondary');
        setTimeout(() => {
            icon.innerText = 'share';
            shareBtn.classList.remove('text-secondary');
        }, 2000);
    }
});
// Initialize
loadFeed();