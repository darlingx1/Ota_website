// register.js
const registerForm = document.querySelector('form');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Grab the button to show loading state
    const submitBtn = registerForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerText;
    
    // Disable button & show "loading"
    submitBtn.disabled = true;
    submitBtn.innerText = "CONNECTING...";

    // 2. Grab the data from your HTML inputs
    const email = document.querySelector('#email').value;
    const username = document.querySelector('#username').value;
    const password = document.querySelector('#password').value;
    const confirmPassword = document.querySelector('#confirm-password').value;

    // 3. Check: Do passwords match?
    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
        return;
    }

    // 4. Send the data to Supabase
    const { data, error } = await window.supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: {
            data: {
                display_name: username, // Saving username to metadata
            }
        }
    });

    // 5. Handle the result
    if (error) {
        alert("Registration failed: " + error.message);
        // Reset button so they can try again
        submitBtn.disabled = false;
        submitBtn.innerText = originalBtnText;
    } else {
        // SUCCESS! 
        console.log("User created successfully!");
        // We go straight to home.html
        window.location.href = '/pages/home.html'; 
    }
});