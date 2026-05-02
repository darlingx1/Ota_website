// auth.js

// 1. Grab the elements from your HTML
const loginForm = document.querySelector('form');
const emailInput = document.querySelector('#email');
const passwordInput = document.querySelector('#password');
const errorDiv = document.querySelector('#error-message'); 

// NEW: Eye Toggle Elements
const toggleBtn = document.querySelector('#togglePassword');
const eyeIcon = document.querySelector('#eyeIcon');

// --- EYE TOGGLE LOGIC ---
if (toggleBtn && passwordInput && eyeIcon) {
    toggleBtn.addEventListener('click', () => {
        // Toggle the type attribute
        const isPassword = passwordInput.type === 'password';
        passwordInput.type = isPassword ? 'text' : 'password';
        
        // Swap the icon name
        eyeIcon.textContent = isPassword ? 'visibility_off' : 'visibility';
        
        // Visual flair: Toggle a glow class when active
        eyeIcon.classList.toggle('text-primary', isPassword);
    });
}
// Add this to the top of your login script
const urlParams = new URLSearchParams(window.location.search);
if (window.location.hash.includes('type=signup') || window.location.href.includes('confirmed')) {
    // Show a "Nexus Identity Verified" notification
    const feedback = document.createElement('div');
    feedback.className = "bg-secondary/20 border border-secondary p-4 rounded-lg text-secondary text-xs mb-4 text-center animate-pulse";
    feedback.innerText = "IDENTITY VERIFIED. ACCESS GRANTED. PLEASE LOG IN.";
    document.querySelector('form').prepend(feedback);
}

// --- LOGIN SUBMISSION LOGIC ---
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Reset: Hide the error box at the start of every attempt
    if (errorDiv) {
        errorDiv.classList.add('hidden');
        errorDiv.innerText = "";
    }

    const email = emailInput.value;
    const password = passwordInput.value;

    // Visual feedback for the button
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerText = "AUTHENTICATING...";

    // 3. Talk to Supabase
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        if (errorDiv) {
            errorDiv.innerText = "ACCESS DENIED: " + error.message.toUpperCase();
            errorDiv.classList.remove('hidden');
        } else {
            alert("Login Error: " + error.message);
        }
        // Reset button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    } else {
        console.log("Success! Session started:", data.session);
        window.location.href = 'home.html'; 
    }
});