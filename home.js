// home.js

async function checkUser() {
    // Get the current user session
    const { data: { user }, error } = await window.supabaseClient.auth.getUser();
    
    if (error || !user) {
        // No session found, send back to entrance
        window.location.href = 'login.html'; 
    } else {
        console.log("Nexus Connection Stable:", user.email);
        
        // Use the metadata we saved during Register
        const username = user.user_metadata.display_name || "New Recruit";
        const email = user.email;

        // --- UPDATE THE UI ---
        
        // 1. Update Drawer
        const drawerName = document.getElementById('drawer-username');
        const drawerEmail = document.getElementById('drawer-email');
        if (drawerName) drawerName.innerText = username;
        if (drawerEmail) drawerEmail.innerText = email;

        // 2. Update Sidebar
        const sidebarName = document.getElementById('sidebar-username');
        const sidebarEmail = document.getElementById('sidebar-email');
        if (sidebarName) sidebarName.innerText = username;
        if (sidebarEmail) sidebarEmail.innerText = email;
    }
}

// 2. LOGOUT LOGIC
const logoutBtn = document.querySelector('#logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        logoutBtn.innerText = "DISCONNECTING...";
        await window.supabaseClient.auth.signOut();
        window.location.href = 'login.html';
    });
}

// Run the check immediately
checkUser();
initHomeSidebar();