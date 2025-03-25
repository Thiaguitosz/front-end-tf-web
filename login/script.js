const API_URL = 'https://back-end-tf-web-alpha.vercel.app/api';

async function login(event) {
    event.preventDefault();  // Impede o envio do formulário

    const email = document.getElementById('email').value;
    const senha = document.getElementById('password').value;
    
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
    });
    
    const data = await res.json();
    console.log(data);
    if (data.token) {
        localStorage.setItem('token', data.token);
        window.location.href = '../'
    } else {
        alert(data.error || 'Erro no login');
    }
}

document.getElementById('loginForm').addEventListener('submit', login);  // Adiciona o eventListener para chamar a função login