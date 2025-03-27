// Base URL for API endpoints
const BASE_URL = 'https://back-end-tf-web-alpha.vercel.app/api/auth';

// Function to show error message
function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        setTimeout(() => {
            errorContainer.textContent = '';
            errorContainer.style.display = 'none';
        }, 5000);
    }
}

// Phone number formatting function
function formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If the number starts with +55, remove it
    const normalized = cleaned.startsWith('55') ? cleaned.slice(2) : cleaned;
    
    // Ensure we have at least 10 digits
    if (normalized.length < 10) return normalized;
    
    // Take the last 11 digits to handle longer numbers
    const digits = normalized.slice(-11);
    
    // Format: (XX) X XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

// Phone number input event listener
function setupPhoneInput(input) {
    input.addEventListener('input', function(e) {
        // Remove all non-digit characters
        let value = e.target.value.replace(/\D/g, '');
        
        // Limit to 11 digits
        value = value.slice(0, 11);
        
        // Format the phone number
        let formattedValue = '';
        
        if (value.length > 0) {
            // Add area code
            formattedValue += '(' + value.slice(0, 2);
            
            if (value.length > 2) {
                formattedValue += ') ' + value.slice(2, 3);
                
                if (value.length > 3) {
                    formattedValue += ' ' + value.slice(3, 7);
                    
                    if (value.length > 7) {
                        formattedValue += '-' + value.slice(7);
                    }
                }
            }
        }
        
        // Update the input value
        e.target.value = formattedValue;
    });

    // Add a max length to prevent over-typing
    input.maxLength = 16; // (XX) X XXXX-XXXX
}

// Verify authentication
function checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
    }
    return token;
}

// Fetch user profile
async function fetchProfile() {
    try {
        const token = checkAuthentication();
        const response = await fetch(`${BASE_URL}/profile`, {
            method: 'GET',
            headers: {
                'x-access-token': token
            }
        });
        if (!response.ok) {
            throw new Error('Erro ao carregar perfil');
        }
        const userData = await response.json();
       
        // Safely update elements if they exist
        const nameEl = document.getElementById('nameValue');
        const emailEl = document.getElementById('emailValue');
        const phoneEl = document.getElementById('phoneValue');
        
        if (nameEl) nameEl.textContent = userData.nome;
        if (emailEl) emailEl.textContent = userData.email;
        
        // Format phone number for display
        if (phoneEl) {
            const phoneNumber = userData.telefone.replace(/\D/g, '');
            phoneEl.textContent = formatPhoneNumber(phoneNumber);
        }
    } catch (error) {
        showError('Não foi possível carregar o perfil');
        console.error('Fetch error:', error);
    }
}

// Toggle edit mode
function toggleEditMode() {
    const profileInfo = document.getElementById('profileInfo');
    if (!profileInfo) return;
    const fields = profileInfo.querySelectorAll('.profile-field');
   
    fields.forEach(field => {
        const label = field.querySelector('.profile-field-label');
        const value = field.querySelector('.profile-field-value');
       
        // Skip password field
        if (field.dataset.field === 'password') {
            const newFieldContainer = document.createElement('div');
            newFieldContainer.innerHTML = `
                <span class="profile-field-label">Nova Senha</span>
                <input type="password" class="profile-field-input" id="newPassword" placeholder="Digite nova senha">
                <span class="profile-field-label" style="margin-top: 10px;">Repita a Nova Senha</span>
                <input type="password" class="profile-field-input" id="confirmPassword" placeholder="Confirme nova senha">
            `;
            field.innerHTML = '';
            field.appendChild(label);
            field.appendChild(newFieldContainer);
            field.classList.add('editable');
            return;
        }
       
        // Create input for other fields
        const input = document.createElement('input');
        
        if (field.dataset.field === 'email') {
            input.type = 'email';
        } else if (field.dataset.field === 'phone') {
            input.type = 'tel';
            input.maxLength = 17; // (XX) X XXXX-XXXX format
            setupPhoneInput(input);
        } else {
            input.type = 'text';
        }
        
        input.className = 'profile-field-input';
        input.value = value ? value.textContent : '';
       
        // Clear field and add input
        field.innerHTML = '';
        field.appendChild(label);
        field.appendChild(input);
        field.classList.add('editable');
    });
    
    // Replace Edit button with Save button
    const editButton = document.querySelector('.edit-button');
    if (editButton) {
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Salvar';
        saveButton.className = 'save-button';
        saveButton.onclick = saveProfile;
        editButton.parentNode.replaceChild(saveButton, editButton);
    }
}

// Save profile changes
async function saveProfile() {
    const token = checkAuthentication();
    const profileInfo = document.getElementById('profileInfo');
    if (!profileInfo) return;
    const fields = profileInfo.querySelectorAll('.profile-field');
   
    const updateData = {};
    fields.forEach(field => {
        const fieldName = field.dataset.field;
       
        if (fieldName === 'password') {
            const newPasswordEl = document.getElementById('newPassword');
            const confirmPasswordEl = document.getElementById('confirmPassword');
           
            if (newPasswordEl && confirmPasswordEl) {
                const newPassword = newPasswordEl.value;
                const confirmPassword = confirmPasswordEl.value;
               
                if (newPassword) {
                    if (newPassword !== confirmPassword) {
                        showError('As senhas não coincidem');
                        throw new Error('Senhas diferentes');
                    }
                    updateData.senha = newPassword;
                }
            }
        } else {
            const input = field.querySelector('.profile-field-input');
            if (input) {
                const fieldMap = {
                    'name': 'nome',
                    'email': 'email',
                    'phone': 'telefone'
                };

                let value = input.value;
                
                // For phone, remove formatting and add +55
                if (fieldName === 'phone') {
                    value = '+55' + value.replace(/\D/g, '');
                }

                updateData[fieldMap[fieldName]] = value;
            }
        }
    });
    
    try {
        const response = await fetch(`${BASE_URL}/edit-profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao atualizar perfil');
        }
        
        // Refresh profile after successful update
        await fetchProfile();
        toggleViewMode();
    } catch (error) {
        showError(error.message);
        console.error('Update error:', error);
    }
}

// Toggle back to view mode
function toggleViewMode() {
    const profileInfo = document.getElementById('profileInfo');
    if (!profileInfo) return;
    const fields = profileInfo.querySelectorAll('.profile-field');
   
    fields.forEach(field => {
        const label = field.querySelector('.profile-field-label');
       
        // Handle password field separately
        if (field.dataset.field === 'password') {
            const passwordField = document.createElement('span');
            passwordField.className = 'password-field';
            passwordField.textContent = '************';
           
            field.innerHTML = '';
            field.appendChild(label);
            field.appendChild(passwordField);
            field.classList.remove('editable');
            return;
        }
       
        // Get current value and create value span
        const input = field.querySelector('.profile-field-input');
        const valueSpan = document.createElement('span');
        valueSpan.className = 'profile-field-value';
       
        // Determine the field based on input
        switch(field.dataset.field) {
            case 'name':
                valueSpan.id = 'nameValue';
                break;
            case 'email':
                valueSpan.id = 'emailValue';
                break;
            case 'phone':
                valueSpan.id = 'phoneValue';
                break;
        }
       
        // Set value from input
        if (field.dataset.field === 'phone' && input) {
            // Format phone number for display
            const phoneNumber = input.value.replace(/\D/g, '');
            valueSpan.textContent = formatPhoneNumber(phoneNumber);
        } else {
            valueSpan.textContent = input ? input.value : '';
        }
       
        // Clear field and add value
        field.innerHTML = '';
        field.appendChild(label);
        field.appendChild(valueSpan);
        field.classList.remove('editable');
    });
    
    // Replace Save button with Edit button
    const saveButton = document.querySelector('.save-button');
    if (saveButton) {
        const editButton = document.createElement('button');
        editButton.textContent = 'Editar';
        editButton.className = 'edit-button';
        editButton.onclick = toggleEditMode;
        saveButton.parentNode.replaceChild(editButton, saveButton);
    }
}

// Initial page load
document.addEventListener('DOMContentLoaded', fetchProfile);