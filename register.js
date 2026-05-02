// register.js
const registerForm = document.querySelector('form');

// Password Visibility Toggle for Register
document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = button.querySelector('.material-symbols-outlined');

        if (input.type === 'password') {
            input.type = 'text';
            icon.textContent = 'visibility_off';
            icon.classList.add('text-primary'); 
        } else {
            input.type = 'password';
            icon.textContent = 'visibility';
            icon.classList.remove('text-primary');
        }
    });
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerText;
    
    submitBtn.disabled = true;
    submitBtn.innerText = "CONNECTING...";

    const email = document.querySelector('#email').value;
    const username = document.querySelector('#username').value;
    const password = document.querySelector('#password').value;
    const confirmPassword = document.querySelector('#confirm-password').value;

    if (password.length < 8) {
        alert("CRITICAL ERROR: Password must be at least 8 characters long!");
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
        return;
    }

    if (password !== confirmPassword) {
        alert("CRITICAL ERROR: Passwords do not match!");
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
        return;
    }

    // 4. Send the data to Supabase with Redirect Option
    const { data, error } = await window.supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            // This ensures the email link knows where to go
            emailRedirectTo: 'http://127.0.0.1:5500/pages/login.html', 
            data: {
                display_name: username,
            }
        }
    });

    // 5. Handle the result for Email Confirmation
    if (error) {
        alert("Registration failed: " + error.message);
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
    } else {
        // Check if the user is created but session is null (Means they MUST verify email)
        if (data.user && !data.session) {
            alert("NEXUS SIGNAL SENT: Please check your email inbox to verify your account before logging in.");
            window.location.href = 'login.html'; 
        } else {
            // If email confirmation is OFF in Supabase, this will still work
            console.log("User created and logged in automatically!");
            window.location.href = 'home.html'; 
        }
    }
});