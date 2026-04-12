// forgot-password.js
const forgotForm = document.querySelector('form');

forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.querySelector('#email').value;
    const submitBtn = forgotForm.querySelector('button');
    
    submitBtn.innerText = "INITIATING...";

    const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
        // IMPORTANT: This must be the URL where your NEW password form is located
        redirectTo: 'http://127.0.0.1:5500/pages/renew_password.html',
    });

    if (error) {
        alert("PROTOCOL ERROR: " + error.message);
        submitBtn.innerText = "RETRY REQUEST";
    } else {
        alert("RECOVERY LINK SENT. Check your transmission (inbox/spam).");
        submitBtn.innerText = "LINK SENT";
    }
});