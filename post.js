// post.js

const postContainer = document.getElementById('post-container');
const commentsList = document.getElementById('comments-list');
const commentInput = document.getElementById('comment-input');
const submitComment = document.getElementById('submit-comment');

const params = new URLSearchParams(window.location.search);
const postId = params.get('id');

if (!postId) window.location.href = 'home.html';

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

async function loadPost() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();

    const { data: post, error } = await window.supabaseClient
        .from('posts')
        .select('id, content, created_at, user_id, likes_count, comments_count, profiles(display_name, avatar_url)')
        .eq('id', postId)
        .single();

    if (error || !post) {
        postContainer.innerHTML = '<p class="text-center text-error font-label text-sm py-8">Transmission not found.</p>';
        return;
    }

    // Update page title
    document.title = `${post.profiles?.display_name || 'Unknown'} | NEON STAGE`;

    const username = post.profiles?.display_name || 'Unknown';
    const avatarUrl = post.profiles?.avatar_url;

    // Check if already liked
    let liked = false;
    if (user) {
        const { data: likeData } = await window.supabaseClient
            .from('likes')
            .select('post_id')
            .eq('user_id', user.id)
            .eq('post_id', postId)
            .single();
        liked = !!likeData;
    }

    postContainer.innerHTML = `
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
                <span class="text-[10px] text-on-surface-variant font-label">${timeAgo(post.created_at)}</span>
            </div>
        </div>
        <p class="text-sm leading-relaxed text-on-surface/90 font-body mb-6">${post.content}</p>
        <div class="flex items-center gap-4 border-t border-white/5 pt-4">
            <button id="like-btn" class="flex items-center gap-1.5 transition-colors ${liked ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}">
                <span class="material-symbols-outlined text-xl" style="font-variation-settings: '${liked ? 'FILL' : 'FILL'} ${liked ? 1 : 0}'">favorite</span>
                <span id="like-count" class="text-xs font-label">${post.likes_count ?? 0}</span>
            </button>
            <span class="flex items-center gap-1.5 text-on-surface-variant">
                <span class="material-symbols-outlined text-xl">comment</span>
                <span class="text-xs font-label">${post.comments_count ?? 0}</span>
            </span>
        </div>
    `;

    // Like button logic
    const likeBtn = document.getElementById('like-btn');
    const likeCount = document.getElementById('like-count');
    let isLiked = liked;

    likeBtn.addEventListener('click', async () => {
        if (!user) return;
        const icon = likeBtn.querySelector('.material-symbols-outlined');

        if (isLiked) {
            await window.supabaseClient.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
            isLiked = false;
            icon.style.fontVariationSettings = "'FILL' 0";
            likeBtn.classList.remove('text-primary');
            likeBtn.classList.add('text-on-surface-variant');
            likeCount.innerText = Math.max(0, parseInt(likeCount.innerText) - 1);
        } else {
            await window.supabaseClient.from('likes').insert({ user_id: user.id, post_id: postId });
            isLiked = true;
            icon.style.fontVariationSettings = "'FILL' 1";
            likeBtn.classList.add('text-primary');
            likeBtn.classList.remove('text-on-surface-variant');
            likeCount.innerText = parseInt(likeCount.innerText) + 1;
        }
    });

    loadComments(user);
}

async function loadComments(user) {
    const { data: comments, error } = await window.supabaseClient
        .from('comments')
        .select('id, content, created_at, user_id, profiles(display_name, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) { commentsList.innerHTML = '<p class="text-xs text-error">Failed to load comments.</p>'; return; }

    commentsList.innerHTML = '';

    if (!comments.length) {
        commentsList.innerHTML = '<p class="text-xs text-on-surface-variant font-label">No comments yet. Be the first!</p>';
        return;
    }

    comments.forEach(c => {
        const username = c.profiles?.display_name || 'Unknown';
        const div = document.createElement('div');
        div.className = 'flex items-start gap-3';
        div.innerHTML = `
            <a href="other_profile.html?id=${c.user_id}" class="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 ${c.profiles?.avatar_url ? '' : 'flex items-center justify-center'}"
               style="${c.profiles?.avatar_url ? '' : 'background:linear-gradient(135deg,#7e51ff,#03fbfc);font-family:Space Grotesk,sans-serif;font-weight:700;font-size:11px;color:#fff;'}">
                ${c.profiles?.avatar_url
                    ? `<img src="${c.profiles.avatar_url}" class="w-full h-full object-cover"/>`
                    : getInitial(username)
                }
            </a>
            <div class="flex-1 bg-surface-container-low rounded-xl px-3 py-2">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-bold text-on-surface">${username}</span>
                    <div class="flex items-center gap-2">
                        <span class="text-[10px] text-on-surface-variant font-label">${timeAgo(c.created_at)}</span>
                        ${user && user.id === c.user_id
                            ? `<button class="delete-comment-btn text-on-surface-variant hover:text-error transition-colors" data-comment-id="${c.id}">
                                <span class="material-symbols-outlined" style="font-size:14px;">delete</span>
                               </button>`
                            : ''
                        }
                    </div>
                </div>
                <p class="text-xs text-on-surface/80 font-body mt-1">${c.content}</p>
            </div>
        `;
        commentsList.appendChild(div);
    });

    // Delete comment logic
    commentsList.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-comment-btn');
        if (!deleteBtn) return;
        const commentId = deleteBtn.dataset.commentId;
        await window.supabaseClient.from('comments').delete().eq('id', commentId);
        loadComments(user);
    });
}

// Submit comment
submitComment.addEventListener('click', async () => {
    const content = commentInput.value.trim();
    if (!content) return;

    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return;

    await window.supabaseClient.from('comments').insert({ user_id: user.id, post_id: postId, content });
    commentInput.value = '';
    loadComments(user);
});

// Enter key submits comment
commentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitComment.click();
});

loadPost();