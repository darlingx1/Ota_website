// profile.js

async function loadProfile() {
    // 1. Get the current user
    const { data: { user }, error } = await window.supabaseClient.auth.getUser();

    // 2. Security Check: If not logged in, send to login page
    if (error || !user) {
        window.location.href = 'login.html';
        return;
    }

    // 3. Fetch data from metadata
    const username = user.user_metadata.display_name || "New Recruit";
    const email = user.email;

    // 4. Inject into the page (Matching your NEW IDs)
    
    // Update the Sidebar (Small Text)
    const sidebarName = document.getElementById('sidebar-username');
    if (sidebarName) sidebarName.innerText = username.toUpperCase();

    // Update the Hero Title (Big Text)
    const mainName = document.getElementById('profile-name-main');
    if (mainName) mainName.innerText = username;

    // Update the Sidebar Level (Optional static text for now)
    const sidebarLevel = document.getElementById('sidebar-level');
    if (sidebarLevel) sidebarLevel.innerText = "Level 1 Ronin";

    // Update Avatars (if you added those IDs)
    const navAvatar = document.getElementById('nav-avatar');
    const mainAvatar = document.getElementById('main-avatar');
    
    // For now, we use a placeholder, but this is ready for when you add upload logic
    if (navAvatar) navAvatar.src = `https://ui-avatars.com/api/?name=${username}&background=b6a0ff&color=fff`;
    if (mainAvatar) mainAvatar.src = `https://ui-avatars.com/api/?name=${username}&background=b6a0ff&color=fff`;

    console.log("Nexus Profile Synced:", username);
}

// 5. Logout Logic (For the profile page sidebar button)
// 5. Logout Logic
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault(); // Stop the page from jumping
        await window.supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    });
}

// Initialize
loadProfile();
initUserProfile();