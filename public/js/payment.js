function showSpinner(event) {
    event.preventDefault();
    
    const name = document.querySelector('input[name="name"]').value.trim();
    const email = document.querySelector('input[name="email"]').value.trim();
    
    if (!name || !email) {
        alert("Please enter your name and email before proceeding.");
        return;
    }

    document.querySelector('.spinner').style.display = 'block';

    setTimeout(() => {
        event.target.closest('form').submit(); 
    }, 1500);
}
