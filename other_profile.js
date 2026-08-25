// other_profile.js

async function loadProfile() {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('id');

    if (!userId) {
        window.location.href = 'home.html';
        return;
    }

    const { data: profile, error } = await window.supabaseClient
        .from('profiles')
        .select('display_name, avatar_url, followers_count')
        .eq('id', userId)
        .single();

    if (error || !profile) {
        console.error('Profile not found:', error);
        window.location.href = 'home.html';
        return;
    }

    const name = profile.display_name || 'Unknown';

    const heroName = document.getElementById('profile-username');
    if (heroName) heroName.innerText = name;

    const avatarImg = document.getElementById('profile-avatar');
    if (avatarImg && profile.avatar_url) avatarImg.src = profile.avatar_url;

    const followersEl = document.getElementById('profile-followers');
    if (followersEl) followersEl.innerText = formatFollowers(profile.followers_count ?? 0);

    document.title = `${name} | NEON STAGE`;
}

function formatFollowers(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
}
// Message button
const messageBtn = document.getElementById('message-btn');
if (messageBtn) {
    messageBtn.addEventListener('click', () => {
        const params = new URLSearchParams(window.location.search);
        const userId = params.get('id');
        if (userId) window.location.href = `chat.html?user=${userId}`;
    });
}
loadProfile();
initOtherProfile();