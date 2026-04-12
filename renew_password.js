const resetForm = document.querySelector('form');
// Toggle Password Visibility Logic
const toggleBtns = document.querySelectorAll('.toggle-password-btn');

toggleBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        // Find the input associated with this specific button
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = this.querySelector('.material-symbols-outlined');

        if (input.type === 'password') {
            input.type = 'text';
            icon.textContent = 'visibility_off';
            icon.classList.add('text-secondary'); // Make it glow when active
        } else {
            input.type = 'password';
            icon.textContent = 'visibility';
            icon.classList.remove('text-secondary');
        }
    });
});

// ... rest of your reset password logic (auth.updateUser, etc)

resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.querySelector('#new-password').value;
    const confirmPassword = document.querySelector('#confirm-password').value;
    const submitBtn = resetForm.querySelector('button');

    // 1. Basic validation
    if (newPassword !== confirmPassword) {
        alert("PASSWORDS DO NOT MATCH. PLEASE RE-ENTER.");
        return;
    }

    if (newPassword.length < 6) {
        alert("SECURITY PROTOCOL: PASSWORD MUST BE AT LEAST 6 CHARACTERS.");
        return;
    }

    // 2. UI Loading State
    submitBtn.disabled = true;
    submitBtn.innerText = "SYNCHRONIZING...";

    // 3. Update the password in Supabase
    // Note: Supabase knows which user this is because of the link they clicked!
    const { error } = await window.supabaseClient.auth.updateUser({
        password: newPassword
    });

    if (error) {
        console.error("Update Error:", error);
        alert("UPDATE FAILED: " + error.message.toUpperCase());
        submitBtn.disabled = false;
        submitBtn.innerText = "RETRY UPDATE";
    } else {
        // SUCCESS
        alert("PASSWORD UPDATED. IDENTITY VERIFIED.");
        
        // Redirect to login after a short delay
        window.location.href = 'login.html';
    }
});