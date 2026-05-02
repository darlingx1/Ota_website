// follows.js

function formatCount(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
}

// Get follower + following counts for any user id
async function getFollowCounts(userId) {
    const [followersRes, followingRes] = await Promise.all([
        window.supabaseClient
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId),
        window.supabaseClient
            .from('follows')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId)
    ]);
    return {
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0
    };
}

// Check if the logged-in user is following a target user
async function isFollowing(targetUserId) {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return false;
    const { data } = await window.supabaseClient
        .from('follows')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();
    return !!data;
}

// Follow a user
async function followUser(targetUserId) {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return;
    await window.supabaseClient
        .from('follows')
        .insert({ follower_id: user.id, following_id: targetUserId });
}

// Unfollow a user
async function unfollowUser(targetUserId) {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return;
    const { error } = await window.supabaseClient
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
    if (error) console.error('Unfollow error:', error.message);
}

// Run on user_profile.html — shows YOUR counts
async function initUserProfile() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return;
    const counts = await getFollowCounts(user.id);
    const followersEl = document.getElementById('follower-count');
    const followingEl = document.getElementById('following-count');
    if (followersEl) followersEl.innerText = formatCount(counts.followers);
    if (followingEl) followingEl.innerText = formatCount(counts.following);
}

// Run on home.html — shows YOUR counts in sidebar
async function initHomeSidebar() {
    const { data: { user } } = await window.supabaseClient.auth.getUser();
    if (!user) return;
    const counts = await getFollowCounts(user.id);
    const followersEl = document.getElementById('sidebar-followers');
    const followingEl = document.getElementById('sidebar-following');
    if (followersEl) followersEl.innerText = formatCount(counts.followers);
    if (followingEl) followingEl.innerText = formatCount(counts.following);
}

// Run on other_profile.html — shows THAT user's counts + follow button
async function initOtherProfile() {
    const params = new URLSearchParams(window.location.search);
    const targetUserId = params.get('id');
    if (!targetUserId) return;

    // Load counts
    const counts = await getFollowCounts(targetUserId);
    const followersEl = document.getElementById('profile-followers');
    const followingEl = document.getElementById('profile-following');
    if (followersEl) followersEl.innerText = formatCount(counts.followers);
    if (followingEl) followingEl.innerText = formatCount(counts.following);

    // Follow button
    const followBtn = document.getElementById('follow-btn');
    if (!followBtn) return;

    // Set initial button state
    const already = await isFollowing(targetUserId);
    setFollowBtn(followBtn, already);

    followBtn.addEventListener('click', async () => {
    const currentlyFollowing = followBtn.dataset.following === 'true';
    if (currentlyFollowing) {
        await unfollowUser(targetUserId);
        setFollowBtn(followBtn, false);
    } else {
        await followUser(targetUserId);
        setFollowBtn(followBtn, true);
    }
    // Always fetch fresh count from Supabase after toggle
    const fresh = await getFollowCounts(targetUserId);
    if (followersEl) followersEl.innerText = formatCount(fresh.followers);
});
}

function setFollowBtn(btn, isFollowing) {
    btn.dataset.following = isFollowing;
    if (isFollowing) {
        btn.innerHTML = `<span class="material-symbols-outlined text-lg" style="font-variation-settings:'FILL' 1;">check_circle</span> Following`;
        btn.classList.add('bg-secondary', 'text-on-secondary-fixed', 'neon-glow-secondary');
        btn.classList.remove('bg-surface-container-highest', 'text-on-surface');
    } else {
        btn.innerHTML = `<span class="material-symbols-outlined text-lg">add_circle</span> Follow`;
        btn.classList.remove('bg-secondary', 'text-on-secondary-fixed', 'neon-glow-secondary');
        btn.classList.add('bg-surface-container-highest', 'text-on-surface');
    }
}