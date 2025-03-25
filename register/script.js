// Verifica se já existe um token armazenado
if (localStorage.getItem('token')) {
    // Se o token existir, redireciona para o dashboard
    window.location.href = '../dashboard';
}

const API_URL = 'https://back-end-tf-web-alpha.vercel.app/api';

async function signup(event) {
    event.preventDefault();  // Impede o envio do formulário

    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('password').value;
    const confirmSenha = document.getElementById('confirm-password').value;
    const telefone = document.getElementById('phone').value;

    // Verifica se as senhas são iguais
    if (senha !== confirmSenha) {
        alert('As senhas não coincidem');
        return;
    }

    const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, senha, telefone })
    });

    const data = await res.json();
    console.log(data);

    if (data.token) {
        localStorage.setItem('token', data.token);
        window.location.href = '../dashboard';  // Redireciona para o dashboard após cadastro bem-sucedido
    } else {
        alert(data.error || 'Erro ao cadastrar');
    }
}

document.querySelector('form').addEventListener('submit', signup);  // Adiciona o eventListener para chamar a função signup
