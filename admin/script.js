function initTableSorting() {
    const tables = document.querySelectorAll('#users, #rides');
    
    tables.forEach(table => {
        const headers = table.querySelectorAll('thead th');
        
        headers.forEach((header, index) => {
            // Determina colunas não sorteáveis
            const nonSortableColumns = {
                'users': [3, headers.length - 1],  // Telefone e Ações
                'rides': [5, headers.length - 1]   // Horário e Ações
            };

            const tableId = table.id;
            if (nonSortableColumns[tableId].includes(index)) return;
            
            // Adiciona estilo de cursor pointer
            header.style.cursor = 'pointer';
            header.classList.add('sortable-header');
            
            header.addEventListener('click', () => {
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));
                const isAscending = header.getAttribute('data-order') !== 'asc';
                
                // Remove indicadores de sorting de outros headers
                headers.forEach(h => {
                    h.classList.remove('sorted-asc', 'sorted-desc');
                });
                
                // Adiciona indicador de sorting no header atual
                header.classList.add(isAscending ? 'sorted-asc' : 'sorted-desc');
                header.setAttribute('data-order', isAscending ? 'asc' : 'desc');
                
                rows.sort((a, b) => {
                    const cellA = a.querySelectorAll('td')[index].textContent.trim();
                    const cellB = b.querySelectorAll('td')[index].textContent.trim();
                    
                    // Tratamento especial para diferentes tipos de dados
                    if (index === 0) {  // ID (numérico)
                        return isAscending 
                            ? Number(cellA) - Number(cellB) 
                            : Number(cellB) - Number(cellA);
                    }
                    
                    if (index === 4) {  // Colunas de data
                        // Converte data de "DD/MM/YYYY" para formato comparável
                        const parseDate = (dateStr) => {
                            const [day, month, year] = dateStr.split('/');
                            return new Date(year, month - 1, day);
                        };
                        
                        const dateA = parseDate(cellA);
                        const dateB = parseDate(cellB);
                        
                        return isAscending 
                            ? dateA - dateB 
                            : dateB - dateA;
                    }
                    
                    // Sorting para campos de texto (ordem alfabética)
                    if ([1, 2, 3].includes(index)) {
                        return isAscending 
                            ? cellA.localeCompare(cellB) 
                            : cellB.localeCompare(cellA);
                    }
                    
                    // Sorting para números (vagas disponíveis)
                    if (index === 6) {
                        return isAscending 
                            ? Number(cellA) - Number(cellB) 
                            : Number(cellB) - Number(cellA);
                    }
                    
                    // Fallback para comparação padrão
                    return isAscending 
                        ? cellA.localeCompare(cellB) 
                        : cellB.localeCompare(cellA);
                });
                
                // Reinsere as linhas na ordem correta
                tbody.innerHTML = '';
                rows.forEach(row => tbody.appendChild(row));
            });
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Configuração global
    const API_BASE_URL = "https://back-end-tf-web-alpha.vercel.app/api/admin";
    const token = localStorage.getItem("token");

    // Variável para controlar edição em andamento
    let isEditing = false;

    if (!token) {
        alert("Token não encontrado. Faça login novamente.");
        window.location.href = "/";
        return;
    }

    const headers = {
        "Content-Type": "application/json",
        "x-access-token": token
    };

    // Lista para armazenar todos os usuários (para o dropdown)
    let allUsers = [];

    // Inicializar interface
    initNavigation();
    loadAllUsers(); // Carrega a lista de todos os usuários primeiro
    initDataTables();
    initButtons();

    // Função para inicializar navegação
    function initNavigation() {
        const navItems = document.querySelectorAll(".nav-item");
        const sections = document.querySelectorAll(".section");

        navItems.forEach(item => {
            item.addEventListener("click", (e) => {
                e.preventDefault();

                // Verifica se existe alguma edição em andamento
                if (isEditing) {
                    if (!confirm("Você tem uma edição em andamento. Deseja cancelar e mudar de seção?")) {
                        return;
                    }
                    cancelCurrentEditing();
                }

                navItems.forEach(nav => nav.classList.remove("active"));
                item.classList.add("active");

                sections.forEach(section => {
                    section.classList.remove("active");
                    setTimeout(() => {
                        section.style.display = "none";
                    }, 600);
                });

                const sectionToShow = document.getElementById(item.getAttribute("data-section"));
                setTimeout(() => {
                    sectionToShow.style.display = "flex";
                    setTimeout(() => {
                        sectionToShow.classList.add("active");
                    }, 100);
                }, 600);
            });
        });
    }

    // Função para carregar todos os usuários para usar no dropdown
    async function loadAllUsers() {
        try {
            const response = await fetch(`${API_BASE_URL}/usuarios`, { headers });
            if (!response.ok) throw new Error(`Erro ao buscar usuários (${response.status})`);
            allUsers = await response.json();
        } catch (error) {
            console.error("Erro ao carregar lista de usuários:", error);
            alert("Não foi possível carregar a lista de usuários para o dropdown de motoristas.");
        }
    }

    async function refreshUsersList() {
        try {
            const response = await fetch(`${API_BASE_URL}/usuarios`, { headers });
            if (!response.ok) throw new Error(`Erro ao buscar usuários (${response.status})`);
            allUsers = await response.json();

            // Atualiza o dropdown se já existir
            updateDriverDropdown();
        } catch (error) {
            console.error("Erro ao atualizar lista de usuários:", error);
            alert("Não foi possível atualizar a lista de usuários.");
        }
    }

    // Nova função para atualizar o dropdown de motoristas
    function updateDriverDropdown() {
        const motoristaSelect = document.getElementById("motorista-select");
        if (motoristaSelect) {
            const currentValue = motoristaSelect.value;
            
            // Limpa as opções atuais
            motoristaSelect.innerHTML = "";
            
            // Reinsere os usuários atualizados
            allUsers.forEach(user => {
                const option = document.createElement("option");
                option.value = user.nome;
                option.textContent = `${user.id} | ${user.nome}`;
                
                // Mantém a seleção atual, se possível
                // Note: This might need adjustment if you want to match the new display format
                if (user.nome === currentValue) {
                    option.selected = true;
                }
                
                motoristaSelect.appendChild(option);
            });
        }
    }

    // Função para inicializar tabelas de dados
    function initDataTables() {
        const usersTableBody = document.querySelector("#users tbody");
        const ridesTableBody = document.querySelector("#rides tbody");

        fetchData(`${API_BASE_URL}/usuarios`, usersTableBody, "users");
        fetchData(`${API_BASE_URL}/caronas`, ridesTableBody, "rides");

        // Delegação de eventos para botões nas tabelas
        document.addEventListener("click", (e) => {
            // Tratamento para botões de edição
            if (e.target.classList.contains("edit-btn")) {
                handleEditClick(e);
            }

            // Tratamento para botões de exclusão de usuários
            if (e.target.classList.contains("user-delete")) {
                // Verifica se existe alguma edição em andamento
                if (isEditing) {
                    alert("Finalize a edição atual antes de excluir um item.");
                    return;
                }

                const userId = e.target.getAttribute("data-id");
                deleteItem(userId, "usuarios", usersTableBody, "users");
            }

            // Tratamento para botões de exclusão de caronas
            if (e.target.classList.contains("ride-delete")) {
                // Verifica se existe alguma edição em andamento
                if (isEditing) {
                    alert("Finalize a edição atual antes de excluir um item.");
                    return;
                }

                const rideId = e.target.getAttribute("data-id");
                deleteItem(rideId, "caronas", ridesTableBody, "rides");
            }
        });
        initTableSorting();
    }

    // Função para inicializar botões de navegação
    function initButtons() {
        // Botão "Voltar à Home"
        document.querySelector(".home").addEventListener("click", () => {
            // Verifica se existe alguma edição em andamento
            if (isEditing) {
                if (!confirm("Você tem uma edição em andamento. Deseja cancelar e voltar à página inicial?")) {
                    return;
                }
                cancelCurrentEditing();
            }
            window.location.href = "/";
        });

        // Botão "Sair"
        document.querySelector(".logout").addEventListener("click", () => {
            // Verifica se existe alguma edição em andamento
            if (isEditing) {
                if (!confirm("Você tem uma edição em andamento. Deseja cancelar e sair?")) {
                    return;
                }
                cancelCurrentEditing();
            }

            if (confirm("Tem certeza que deseja sair?")) {
                localStorage.removeItem("token");
                window.location.href = "/";
            }
        });
    }

    // Função para buscar dados da API
    async function fetchData(url, tableBody, type) {
        try {
            const response = await fetch(url, { headers });
            if (!response.ok) throw new Error(`Erro ao buscar dados (${response.status})`);
            const data = await response.json();

            tableBody.innerHTML = ""; // Limpa a tabela antes de preencher

            data.forEach(item => {
                const row = document.createElement("tr");

                if (type === "users") {
                    row.innerHTML = `
                        <td>${item.id}</td>
                        <td>${item.nome}</td>
                        <td>${item.email}</td>
                        <td>${item.telefone || "N/A"}</td>
                        <td>${formatDate(item.criado_em)}</td>
                        <td>
                            <button class="edit-btn" data-id="${item.id}">Editar</button>
                            <button class="delete-btn user-delete" data-id="${item.id}">Deletar</button>
                        </td>
                    `;
                } else if (type === "rides") {
                    // Extrair data e hora do timestamp
                    const { dateStr, timeStr } = extractDateAndTime(item.horario);

                    row.innerHTML = `
                        <td>${item.id}</td>
                        <td>${item.motorista}</td>
                        <td>${item.local_partida}</td>
                        <td>${item.destino}</td>
                        <td>${dateStr}</td>
                        <td>${timeStr}</td>
                        <td>${item.vagas_disponiveis}</td>
                        <td>${item.status}</td>
                        <td>
                            <button class="edit-btn" data-id="${item.id}">Editar</button>
                            <button class="delete-btn ride-delete" data-id="${item.id}">Deletar</button>
                        </td>
                    `;
                }

                tableBody.appendChild(row);
            });
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            tableBody.innerHTML = `<tr><td colspan="9" class="error-message">Erro ao carregar dados: ${error.message}</td></tr>`;
        }
    }

    // Função para extrair data e hora de um timestamp
    function extractDateAndTime(timestamp) {
        if (!timestamp) return { dateStr: "N/A", timeStr: "N/A" };

        // Garantir que a string do timestamp está intacta e extrair data e hora manualmente
        const datePart = timestamp.substring(0, 10); // "YYYY-MM-DD"
        const timePart = timestamp.substring(11, 16); // "HH:MM"

        // Reformatar para o padrão DD/MM/YYYY
        const [year, month, day] = datePart.split('-');
        const dateStr = `${day}/${month}/${year}`;

        return { dateStr, timeStr: timePart, originalTimestamp: timestamp };
    }


    // Função para deletar item (usuário ou carona)
    async function deleteItem(id, type, tableBody, dataType) {
        const itemName = type === "usuarios" ? "usuário" : "carona";
        if (!confirm(`Tem certeza que deseja excluir este ${itemName}?`)) return;

        try {
            const response = await fetch(`${API_BASE_URL}/${type}/${id}`, {
                method: "DELETE",
                headers
            });

            const result = await response.json();

            if (!response.ok) {
                alert(result.error || `Erro ao excluir ${itemName}.`);
                return;
            }

            alert(`${itemName.charAt(0).toUpperCase() + itemName.slice(1)} deletado com sucesso!`);
            fetchData(`${API_BASE_URL}/${type}`, tableBody, dataType);

        } catch (error) {
            console.error(`Erro ao excluir ${itemName}:`, error);
            alert(`Erro ao excluir ${itemName}.`);
        }
    }

    // Função para formatar datas
    function formatDate(dateString) {
        if (!dateString) return "N/A";

        // Extrai a parte da data sem modificar o fuso horário
        const datePart = dateString.substring(0, 10); // "YYYY-MM-DD"

        // Reformatar para o padrão DD/MM/YYYY
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year}`;
    }

    // Função para cancelar edição atual e restaurar a interface
    function cancelCurrentEditing() {
        // Encontrar o botão de confirmar que está ativo
        const confirmBtn = document.querySelector(".confirm-btn");
        if (confirmBtn) {
            const row = confirmBtn.closest("tr");
            const table = row.closest("table");
            const isCaronasTable = table && table.classList.contains("caronas-table");
            const endpoint = isCaronasTable ? "caronas" : "usuarios";
            const tableBody = table.querySelector("tbody");

            // Recarrega os dados da tabela para desfazer as mudanças
            fetchData(`${API_BASE_URL}/${endpoint}`, tableBody, isCaronasTable ? "rides" : "users");
        }

        // Reseta o estado de edição
        isEditing = false;

        // Reabilita todos os botões de edição e exclusão
        enableAllButtons();
    }

    // Função para desabilitar todos os botões de edição e exclusão (exceto o atual)
    function disableAllButtonsExcept(currentBtn) {
        const allEditButtons = document.querySelectorAll(".edit-btn");
        const allDeleteButtons = document.querySelectorAll(".delete-btn");

        allEditButtons.forEach(btn => {
            if (btn !== currentBtn) {
                btn.disabled = true;
                btn.style.cursor = "not-allowed";
                btn.style.opacity = "0.5";
            }
        });

        allDeleteButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.cursor = "not-allowed";
            btn.style.opacity = "0.5";
        });
    }

    // Função para reabilitar todos os botões
    function enableAllButtons() {
        const allEditButtons = document.querySelectorAll(".edit-btn");
        const allDeleteButtons = document.querySelectorAll(".delete-btn");

        allEditButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.cursor = "pointer";
            btn.style.opacity = "1";
        });

        allDeleteButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.cursor = "pointer";
            btn.style.opacity = "1";
        });
    }

    // Função para tornar uma linha editável
    function makeRowEditable(row) {
        const table = row.closest("table");
        const isCaronasTable = table && table.classList.contains("caronas-table");
        const cells = row.querySelectorAll("td:not(:first-child):not(:last-child)");

        cells.forEach((cell, index) => {
            const originalText = cell.textContent.trim();

            // Tabela de Caronas
            if (isCaronasTable) {
                // Campo de motorista (primeiro campo após ID) - criar dropdown com usuários
                if (index === 0) {
                    const select = document.createElement("select");
                    select.id = "motorista-select";

                    // Adiciona usuários ao dropdown
                    allUsers.forEach(user => {
                        const option = document.createElement("option");
                        option.value = user.nome;
                        option.textContent = `${user.id} | ${user.nome}`;
                        if (user.nome === originalText) {
                            option.selected = true;
                        }
                        select.appendChild(option);
                    });

                    cell.textContent = "";
                    cell.appendChild(select);
                }

                // Colunas de data e hora (agora separadas) - ambas não editáveis
                else if (index === 3 || index === 4) {
                    // Mantém o texto original, não cria input
                    cell.setAttribute("data-original", originalText);
                    cell.innerHTML = `<span class="non-editable">${originalText}</span>`;
                }
                // Campo de status
                else if (index === 6) {
                    const select = document.createElement("select");
                    select.classList.add("status-select");
                    ["Ativa", "Inativa"].forEach(optionText => {
                        const option = document.createElement("option");
                        option.value = optionText;
                        option.textContent = optionText;
                        if (optionText === originalText) option.selected = true;
                        select.appendChild(option);
                    });
                    cell.textContent = "";
                    cell.appendChild(select);
                }
                // Campo numérico para vagas disponíveis
                else if (index === 5) {
                    const input = document.createElement("input");
                    input.type = "number";
                    input.min = "1";
                    input.value = originalText;
                    cell.textContent = "";
                    cell.appendChild(input);
                }
                // Para local de partida e destino
                else {
                    const input = document.createElement("input");
                    input.type = "text";
                    input.value = originalText;
                    cell.textContent = "";
                    cell.appendChild(input);
                }
            }
            // Tabela de Usuários
            else {
                // Campo de data de criação (não editável)
                if (index === 3) {
                    // Mantém o texto original, não cria input
                    cell.setAttribute("data-original", originalText);
                    cell.innerHTML = `<span class="non-editable">${originalText}</span>`;
                }
                // Para os demais campos (nome, email, telefone)
                else {
                    const input = document.createElement("input");
                    input.type = "text";
                    input.value = originalText;
                    cell.textContent = "";
                    cell.appendChild(input);
                }
            }
        });
    }

    // Função para lidar com o evento de clique no botão de edição
    function handleEditClick(e) {
        // Verifica se já existe uma edição em andamento
        if (isEditing) {
            alert("Finalize a edição atual antes de iniciar uma nova.");
            return;
        }

        // Marca que estamos em modo de edição
        isEditing = true;

        const row = e.target.closest("tr");
        makeRowEditable(row);

        // Altera o botão "Editar" para "Confirmar"
        e.target.textContent = "Confirmar";
        e.target.classList.remove("edit-btn");
        e.target.classList.add("confirm-btn");

        // Desabilita todos os outros botões de edição e exclusão
        disableAllButtonsExcept(e.target);

        // Substitui o evento do botão
        e.target.removeEventListener("click", handleEditClick);
        e.target.addEventListener("click", handleConfirmClick);
    }

    // Função para lidar com o evento de clique no botão de confirmar edição
    async function handleConfirmClick(e) {
        const row = e.target.closest("tr");
        const table = row.closest("table");
        const isCaronasTable = table.classList.contains("caronas-table");
        const id = row.querySelector("td:first-child").textContent.trim();

        // Define as chaves baseado no tipo de tabela
        let keys;
        if (isCaronasTable) {
            // Ajustado para incluir data e hora separadamente
            keys = ["motorista", "local_partida", "destino", "data", "hora", "vagas_disponiveis", "status"];
        } else {
            keys = ["nome", "email", "telefone", "criado_em"];
        }

        // Coleta os dados
        const data = {};
        const cells = row.querySelectorAll("td:not(:first-child):not(:last-child)");

        // Para caronas, precisamos preservar o timestamp original
        let originalTimestamp = "";

        if (isCaronasTable) {
            // Pegar as células de data e hora para extrair o timestamp original
            const dateCell = cells[3]; // Índice da célula de data
            const timeCell = cells[4]; // Índice da célula de hora

            if (dateCell.hasAttribute("data-original") && timeCell.hasAttribute("data-original")) {
                // Se temos os dados originais, vamos usar para manter o timestamp
                originalTimestamp = row.getAttribute("data-timestamp");
            }
        }

        cells.forEach((cell, index) => {
            const key = keys[index];

            // Pula campos não editáveis (mantém valor original)
            if (cell.querySelector(".non-editable")) {
                if (isCaronasTable && (key === "data" || key === "hora")) {
                    // Não fazemos nada aqui, vamos lidar com o timestamp no final
                } else if (!isCaronasTable && key === "criado_em") {
                    // Preserva a data de criação original para usuários
                    // Este campo não será enviado na atualização
                }
            }
            // Coleta dados de inputs e selects
            else {
                const input = cell.querySelector("input, select");
                if (input) {
                    if (key === "vagas_disponiveis") {
                        // Garante que vagas_disponiveis seja um número válido
                        let vagas = parseInt(input.value, 10);
                        if (isNaN(vagas) || vagas <= 0) {
                            vagas = 1;
                        }
                        data[key] = vagas;
                    } else if (key === "motorista") {
                        // Certifica-se de pegar apenas o nome do motorista
                        const selectedOption = input.options[input.selectedIndex];
                        data[key] = selectedOption.value; // This will be just the name
                    } else {
                        data[key] = input.value.trim();
                    }
                }
            }
        });

        // Remove a data de criação dos dados a serem atualizados para usuários
        if (!isCaronasTable) {
            delete data.criado_em;
        } else {
            // Para caronas, removemos os campos de data e hora separados
            // e mantemos apenas o campo horario original
            delete data.data;
            delete data.hora;

            // Preservar o timestamp original
            data.horario = originalTimestamp;
        }

        try {
            const endpoint = isCaronasTable ? "caronas" : "usuarios";
            const response = await fetch(`${API_BASE_URL}/${endpoint}/${id}`, {
                method: "PUT",
                headers,
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro ao atualizar (${response.status})`);
            }

            alert("Atualização realizada com sucesso!");
            // Recarrega os dados em vez de recarregar a página inteira
            const usersTableBody = document.querySelector("#users tbody");
            const ridesTableBody = document.querySelector("#rides tbody");
            fetchData(`${API_BASE_URL}/usuarios`, usersTableBody, "users");
            fetchData(`${API_BASE_URL}/caronas`, ridesTableBody, "rides");

            refreshUsersList();

            // Restaura o estado de edição
            isEditing = false;
            enableAllButtons();

        } catch (error) {
            console.error("Erro ao atualizar:", error);
            alert(`Erro ao atualizar os dados: ${error.message}`);
        }
    }
});