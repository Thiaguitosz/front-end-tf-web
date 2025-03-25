const API_URL = 'https://scaling-fiesta-g456xjr6w9jqh9557-3000.app.github.dev/api';

const token = localStorage.getItem('token');

if (!token) {
    window.location.href = "../login";
}

async function carregarCaronas() {
    try {
        const resposta = await fetch('http://localhost:3000/api/caronas', {
            method: 'GET',
            headers: { 'x-access-token': token }
        });

        if (!resposta.ok) {
            if (resposta.status === 401) { // Só remove o token se for erro de autenticação
                if (localStorage.getItem("token") !== null) {
                    localStorage.removeItem("token");
                }
                window.location.href = "../login";
            }
            throw new Error('Erro ao buscar caronas');
        }   

        const caronas = await resposta.json();
        const lista = document.getElementById('caronas-list');
        lista.innerHTML = '';

        caronas.forEach(c => {
            const item = document.createElement('li');
            item.textContent = `De: ${c.local_partida} Para: ${c.destino} - Horário: ${c.horario}`;
            lista.appendChild(item);
        });

    } catch (erro) {
        alert('Erro ao carregar caronas.');
    }
}

document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = "../";
});

carregarCaronas();