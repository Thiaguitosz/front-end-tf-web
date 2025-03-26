const API_URL = 'https://back-end-tf-web-alpha.vercel.app/api';

// Verifica se já existe um token armazenado
if (localStorage.getItem('token')) {
    // Se o token existir, redireciona para o dashboard
    window.location.href = '../';
}

// Função para formatar o número de telefone
function formatPhoneNumber(input) {
    // Remove todos os caracteres não numéricos
    const phoneNumber = input.replace(/\D/g, '');
   
    // Limita o número de caracteres
    const truncatedPhone = phoneNumber.slice(0, 11);
   
    // Aplica a formatação brasileira
    let formattedPhone = '';
    if (truncatedPhone.length > 0) {
        formattedPhone += `(${truncatedPhone.slice(0, 2)}`;
        if (truncatedPhone.length > 2) {
            formattedPhone += `) ${truncatedPhone.slice(2, 3)}`;
            if (truncatedPhone.length > 3) {
                formattedPhone += ` ${truncatedPhone.slice(3, 7)}`;
                if (truncatedPhone.length > 7) {
                    formattedPhone += `-${truncatedPhone.slice(7, 11)}`;
                }
            }
        }
    }
   
    return formattedPhone;
}

// Função para validar email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Função para validar senha
function validatePassword(password) {
    // Senha deve ter pelo menos 8 caracteres, 
    // conter pelo menos uma letra maiúscula, 
    // uma letra minúscula e um número
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return re.test(password);
}

// Adiciona evento de formatação em tempo real para o número de telefone
document.getElementById('phone').addEventListener('input', function(e) {
    const input = e.target;
    input.value = formatPhoneNumber(input.value);
});

async function signup(event) {
    event.preventDefault();  // Impede o envio do formulário
   
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('password').value;
    const confirmSenha = document.getElementById('confirm-password').value;
    const telefone = document.getElementById('phone').value.replace(/\D/g, '');
   
    // Validações
    const errors = [];

    if (nome === '') {
        errors.push('Nome é obrigatório');
    }
   
    if (email === '') {
        errors.push('E-mail é obrigatório');
    } else if (!validateEmail(email)) {
        errors.push('E-mail inválido');
    }
   
    if (telefone.length !== 11) {
        errors.push('Número de telefone incompleto');
    }
   
    if (senha === '') {
        errors.push('Senha é obrigatória');
    } else if (!validatePassword(senha)) {
        errors.push('Senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas e números.');
    }
   
    if (senha !== confirmSenha) {
        errors.push('As senhas não coincidem');
    }
   
    // Exibe erros se houver
    if (errors.length > 0) {
        const errorMessage = errors.join('\n');
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        errorContainer.textContent = errorMessage;
        
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        document.getElementById('signupForm').insertBefore(errorContainer, document.querySelector('button'));
        return;
    }
   
    try {
        // Desabilita o botão durante o envio
        const submitButton = document.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Cadastrando...';
        submitButton.classList.add('loading');

        const res = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nome,
                email,
                senha,
                telefone: `+55${telefone}`
            })
        });
       
        const data = await res.json();
        
        if (data.token) {
            localStorage.setItem('token', data.token);
            window.location.href = '../';  // Redireciona para o dashboard após cadastro bem-sucedido
        } else {
            // Reabilita o botão em caso de erro
            submitButton.disabled = false;
            submitButton.textContent = 'Cadastrar';
            submitButton.classList.remove('loading');
            
            const errorContainer = document.createElement('div');
            errorContainer.className = 'error-message';
            errorContainer.textContent = data.error || 'Erro ao cadastrar';
            
            const existingError = document.querySelector('.error-message');
            if (existingError) {
                existingError.remove();
            }
            
            document.getElementById('signupForm').insertBefore(errorContainer, document.querySelector('button'));
        }
    } catch (error) {
        console.error('Erro:', error);
        
        // Reabilita o botão em caso de erro de conexão
        const submitButton = document.querySelector('button[type="submit"]');
        submitButton.disabled = false;
        submitButton.textContent = 'Cadastrar';
        submitButton.classList.remove('loading');
        
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        errorContainer.textContent = 'Erro na conexão. Tente novamente.';
        
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        document.getElementById('signupForm').insertBefore(errorContainer, document.querySelector('button'));
    }
}

// Adiciona o eventListener para chamar a função signup
document.getElementById('signupForm').addEventListener('submit', signup);

// altereie aq