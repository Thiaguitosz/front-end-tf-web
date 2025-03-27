// Constantes e configurações
const API_URL = 'https://back-end-tf-web-alpha.vercel.app/api';
const AUTH_TOKEN_KEY = 'token';
const DOM_ELEMENTS = {
  authContainer: () => document.getElementById('auth-buttons'),
  offerButton: () => document.getElementById('offer-button'),
  requestButton: () => document.getElementById('request-button'),
  header: () => document.querySelector('header'),
  modal: () => document.getElementById('modal-container'),
  modalForm: () => document.getElementById('offer-ride-form'),
  ridesSection: () => document.getElementById('available-rides-section'),
  ridesContainer: () => document.getElementById('rides-container'),
  closeDashboard: () => document.getElementById('close-dashboard')
};

// Funções de autenticação - mantendo seu código original
const auth = {
  getToken: () => localStorage.getItem(AUTH_TOKEN_KEY),

  removeToken: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return null;
  },

  async validateToken() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/auth/validate-token`, {
        method: 'GET',
        headers: { 'x-access-token': token }
      });

      if (!response.ok) {
        // Erro na requisição, considerar token inválido
        this.removeToken();
        return false;
      }

      const data = await response.json();

      // Se o backend retornar false, remover o token
      if (data.valid === false) {
        alert("Seu token expirou! Faça login novamente.")
        this.removeToken();
        return false;
      }

      // Token é válido
      return true;
    } catch (error) {
      console.error("Erro ao validar token:", error);
      this.removeToken();
      return false;
    }
  },

  async hasActiveRide() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/caronas/minhas`, {
        method: 'GET',
        headers: { 'x-access-token': token }
      });

      if (!response.ok) {
        console.error('Erro ao verificar caronas ativas');
        return false;
      }

      const rides = await response.json();
      // Verifica se há alguma carona ativa (que ainda não foi encerrada)
      return rides.some(ride => ride.status === 'ativa');
    } catch (error) {
      console.error("Erro ao verificar caronas ativas:", error);
      return false;
    }
  },

  async isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${API_URL}/caronas`, {
        method: 'GET',
        headers: { 'x-access-token': token }
      });

      if (!response.ok) {
        if (response.status === 401) {
          this.removeToken();
          window.location.href = '/login';
        }
        return false;
      }
      return true;
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      return false;
    }
  },

  async getUserType() {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/auth/userType`, {
        method: 'GET',
        headers: { 'x-access-token': token }
      });

      if (!response.ok) {
        console.error('Erro ao verificar o tipo de usuário');
        return null;
      }

      const data = await response.json();
      return data.tipo;
    } catch (error) {
      console.error("Erro ao obter tipo de usuário:", error);
      return null;
    }
  }
};

// Funções de UI
const ui = {
  createButton(options) {
    const { href, className, iconSrc, iconAlt, text, onClick } = options;

    const anchor = document.createElement('a');
    anchor.href = href || '#';

    let buttonHTML = `<button class="${className}">`;
    if (iconSrc) {
      buttonHTML += `<img src="${iconSrc}" alt="${iconAlt}" class="${iconAlt.toLowerCase()}-icon">`;
    }
    buttonHTML += text ? `${text}</button>` : '</button>';

    anchor.innerHTML = buttonHTML;

    if (onClick) {
      anchor.addEventListener('click', onClick);
    }

    return anchor;
  },

  addMyRideButton() {
    const authContainer = DOM_ELEMENTS.authContainer();
    const offerButton = DOM_ELEMENTS.offerButton();

    // Verifica se o botão Minha Carona já não existe
    const existingMyRideButton = authContainer.querySelector('.my-ride');
    if (existingMyRideButton) return;

    // Criar botão Minha Carona
    const myRideButton = this.createButton({
      className: 'my-ride',
      iconSrc: 'img/car-icon.png',
      iconAlt: 'Minha Carona',
      text: 'Minha Carona',
      onClick: (event) => {
        event.preventDefault();
        this.openMyRideModal();
      }
    });

    // Inserir como primeiro elemento do authContainer
    if (authContainer.firstChild) {
      authContainer.insertBefore(myRideButton, authContainer.firstChild);
    } else {
      // Se o container estiver vazio, simplesmente adicionar
      authContainer.appendChild(myRideButton);
    }

    // Remove a classe disabled do botão de oferecer carona
    if (offerButton) {
      offerButton.classList.remove('disabled');
      offerButton.onclick = () => this.openOfferModal();
    }
  },

  // Existing method with added profile button logic

  // Update the updateAuthButtons method in the ui object
  async updateAuthButtons() {
    const authContainer = DOM_ELEMENTS.authContainer();
    const offerButton = DOM_ELEMENTS.offerButton();
    authContainer.innerHTML = '';

    const isAuthenticated = await auth.isAuthenticated();

    if (isAuthenticated) {
      // Verifies active rides before adding My Ride button
      try {
        const response = await fetch(`${API_URL}/caronas/minhas`, {
          method: 'GET',
          headers: { 'x-access-token': auth.getToken() }
        });

        if (!response.ok) {
          console.error('Erro ao verificar caronas ativas');
          return;
        }

        const rides = await response.json();
        const activeRide = rides.find(ride => ride.status === 'Ativa');

        // Add My Ride button only if there's an active ride
        if (activeRide) {
          const myRideButton = this.createButton({
            className: 'my-ride',
            iconSrc: 'img/car-icon.png',
            iconAlt: 'Minha Carona',
            text: 'Minha Carona',
            onClick: (event) => {
              event.preventDefault();
              this.openMyRideModal();
            }
          });
          authContainer.appendChild(myRideButton);
        }
      } catch (error) {
        console.error("Erro ao verificar caronas ativas:", error);
      }

      // Check if admin and add admin button if applicable
      const userType = await auth.getUserType();
      if (userType === 'admin') {
        const adminButton = this.createButton({
          href: '/admin',
          className: 'admin',
          iconSrc: 'img/shield-icon.png',
          iconAlt: 'Escudo',
          text: 'Admin'
        });
        authContainer.appendChild(adminButton);
      }

      const logoutButton = this.createButton({
        className: 'logout',
        iconSrc: 'img/logout-icon.png',
        iconAlt: 'Sair',
        text: 'Sair',
        onClick: (event) => {
          event.preventDefault();
          auth.removeToken();
          window.location.reload();
        }
      });
      authContainer.appendChild(logoutButton);

      // NEW: Profile Icon Button - Borderless, Icon-Only
      const profileIconButton = document.createElement('a');
      profileIconButton.href = '../profile/';
      profileIconButton.className = 'profile-icon-button';
      profileIconButton.style.display = 'flex';
      profileIconButton.style.alignItems = 'center';
      profileIconButton.style.justifyContent = 'center';
      profileIconButton.style.background = 'none';
      profileIconButton.style.border = 'none';
      profileIconButton.style.cursor = 'pointer';
      profileIconButton.style.padding = '8px';
      profileIconButton.style.borderRadius = '50%';
      profileIconButton.style.transition = 'background-color 0.3s ease';

      // Add hover effect
      profileIconButton.addEventListener('mouseover', () => {
        profileIconButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      });
      profileIconButton.addEventListener('mouseout', () => {
        profileIconButton.style.backgroundColor = 'transparent';
      });

      const profileIcon = document.createElement('img');
      profileIcon.src = 'img/profile-icon.png';
      profileIcon.alt = 'Perfil';
      profileIcon.style.width = '24px';
      profileIcon.style.height = '24px';
      profileIcon.style.filter = 'invert(100%)'; // Optional: to match other icons

      profileIconButton.appendChild(profileIcon);
      authContainer.appendChild(profileIconButton);

    } else {
      // Unauthenticated state
      const loginButton = this.createButton({
        href: '/login',
        className: 'login',
        text: 'Login'
      });

      const signupButton = this.createButton({
        href: '/register',
        className: 'signup',
        text: 'Cadastro'
      });

      authContainer.appendChild(loginButton);
      authContainer.appendChild(signupButton);

      // Disable offer button
      this.disableOfferButton(offerButton);
    }
  },

  disableOfferButton(button) {
    button.classList.add('disabled');
    button.onclick = function () {
      alert('Você precisa estar logado para oferecer carona.');
    };
  },

  setupScrollEffect() {
    const header = DOM_ELEMENTS.header();
    const scrollThreshold = 50;

    window.addEventListener('scroll', () => {
      if (window.scrollY > scrollThreshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  },

  // Configura o botão de pedir carona
  setupRequestButton() {
    const requestButton = DOM_ELEMENTS.requestButton();
    requestButton.onclick = () => this.openRidesDashboard();
  },

  // Nova função para abrir o dashboard de caronas
  // Função para abrir o dashboard de caronas - modificada para incluir botão de recarregar
  async openRidesDashboard() {
    const ridesSection = DOM_ELEMENTS.ridesSection();
    const header = DOM_ELEMENTS.header();

    // Mostrar a seção
    ridesSection.style.display = 'flex';

    // Obter a altura do header para usar como offset
    const headerHeight = header.offsetHeight;

    // Calcular a posição de scroll com o offset do header
    const sectionPosition = ridesSection.getBoundingClientRect().top + window.pageYOffset - headerHeight;

    // Fazer scroll para a posição calculada
    window.scrollTo({
      top: sectionPosition,
      behavior: 'smooth'
    });

    // Carregar as caronas
    await this.loadAvailableRides();

    // Configurar o botão de fechar
    const closeButton = DOM_ELEMENTS.closeDashboard();
    closeButton.onclick = () => this.closeRidesDashboard();

    // Criar um container para os botões se não existir
    let buttonsContainer = document.getElementById('dashboard-buttons-container');
    if (!buttonsContainer) {
      buttonsContainer = document.createElement('div');
      buttonsContainer.id = 'dashboard-buttons-container';
      buttonsContainer.style.display = 'flex';
      buttonsContainer.style.gap = '10px';

      // Substituir o botão de fechar original com nosso container
      closeButton.parentNode.insertBefore(buttonsContainer, closeButton);
      closeButton.parentNode.removeChild(closeButton);

      // Adicionar o botão de fechar ao container
      buttonsContainer.appendChild(closeButton);
    }

    // Verificar se já existe um botão de recarregar
    let reloadButton = document.getElementById('reload-dashboard');

    // Se não existir, criar o botão de recarregar
    if (!reloadButton) {
      reloadButton = document.createElement('button');
      reloadButton.id = 'reload-dashboard';

      // Estilo para um botão circular como o botão de fechar
      reloadButton.style.backgroundColor = 'transparent';
      reloadButton.style.border = 'none';
      reloadButton.style.cursor = 'pointer';
      reloadButton.style.padding = '8px';
      reloadButton.style.display = 'flex';
      reloadButton.style.alignItems = 'center';
      reloadButton.style.justifyContent = 'center';
      reloadButton.style.borderRadius = '50%';
      reloadButton.style.transition = 'all 0.3s ease';

      // Adiciona efeito hover similar ao botão de fechar
      reloadButton.onmouseover = () => {
        reloadButton.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      };
      reloadButton.onmouseout = () => {
        reloadButton.style.backgroundColor = 'transparent';
      };

      // Apenas o ícone, sem texto
      reloadButton.innerHTML = `<img src="img/refresh-icon.png" alt="Recarregar" style="width:24px;height:24px;filter:invert(100%);" class="reload-icon">`;

      // Inserir o botão antes do botão de fechar no container
      buttonsContainer.insertBefore(reloadButton, closeButton);
    }

    // Adicionar evento de clique ao botão de recarregar
    reloadButton.onclick = () => this.loadAvailableRides();
  },

  // Função para fechar o dashboard
  closeRidesDashboard() {
    const ridesSection = DOM_ELEMENTS.ridesSection();
    ridesSection.style.display = 'none';

    // Opcional: scroll de volta para os botões de ação
    document.querySelector('.action-section').scrollIntoView({ behavior: 'smooth' });
  },

  // Função para carregar caronas disponíveis
  async loadAvailableRides() {
    const ridesContainer = DOM_ELEMENTS.ridesContainer();

    // Mostrar estado de carregamento
    ridesContainer.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Carregando caronas disponíveis...</p>
      </div>
    `;

    try {
      // Fazer a requisição para a API
      const response = await fetch(`${API_URL}/caronas`);

      if (!response.ok) {
        throw new Error('Erro ao carregar caronas');
      }

      const rides = await response.json();

      // Verificar se há caronas para mostrar
      if (rides.length === 0) {
        this.showEmptyState(ridesContainer);
        return;
      }

      // Renderizar as caronas
      this.renderRides(rides);

    } catch (error) {
      console.error('Erro ao carregar caronas:', error);
      ridesContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">❌</div>
          <p class="empty-text">Ocorreu um erro ao carregar as caronas.</p>
          <button class="refresh-btn" onclick="ui.loadAvailableRides()">
            <img src="img/refresh-icon.png" alt="Atualizar" class="refresh-icon">
            Tentar novamente
          </button>
        </div>
      `;
    }
  },

  // Função para mostrar estado vazio
  showEmptyState(container) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🚗</div>
        <p class="empty-text">Não há caronas disponíveis no momento.</p>
        <button class="refresh-btn" onclick="ui.loadAvailableRides()">
          <img src="img/refresh-icon.png" alt="Atualizar" class="refresh-icon">
          Atualizar
        </button>
      </div>
    `;
  },

  // Função para renderizar as caronas - modificada para mostrar o motorista
  renderRides(rides) {
    const ridesContainer = DOM_ELEMENTS.ridesContainer();
    ridesContainer.innerHTML = '';

    rides.forEach(ride => {
      try {
        // Parsing and formatting the date
        const rideDate = new Date(ride.horario);
        let dateDisplay = 'Data indisponível';
        let timeDisplay = '';

        if (!isNaN(rideDate.getTime())) {
          // Format date in DD/MM/YYYY
          const day = String(rideDate.getDate()).padStart(2, '0');
          const month = String(rideDate.getMonth() + 1).padStart(2, '0');
          const year = rideDate.getFullYear();
          dateDisplay = `${day}/${month}/${year}`;

          // Extract time
          timeDisplay = ride.horario.substring(11, 16); // Pega "HH:MM"
        }

        // Nome do motorista - usar um valor padrão se não estiver disponível
        const driverName = ride.nome_motorista || "Motorista não identificado";

        const rideCard = document.createElement('div');
        rideCard.className = 'ride-card';
        rideCard.innerHTML = `
          <div class="ride-header">
            <div>
              <h3>${ride.local_partida || 'Origem'} → ${ride.destino || 'Destino'}</h3>
              <div class="ride-date">
                <img src="img/calendar-icon.png" alt="Data" class="date-icon">
                ${dateDisplay} ${timeDisplay ? `às ${timeDisplay}` : ''}
              </div>
            </div>
          </div>
          <div class="ride-info">
            <div class="info-item">
              <img src="img/route-icon.png" alt="Partida" class="info-icon">
              <span class="info-text">De: ${ride.local_partida || 'Local de partida'}</span>
            </div>
            <div class="info-item">
              <img src="img/location-icon.png" alt="Destino" class="info-icon">
              <span class="info-text">Para: ${ride.destino || 'Destino'}</span>
            </div>
            <div class="info-item">
              <img src="img/user-icon.png" alt="Motorista" class="info-icon">
              <span class="info-text">Motorista: ${driverName}</span>
            </div>
          </div>
          <div class="ride-footer">
            <div class="available-seats">
              <img src="img/seat-icon.png" alt="Vagas" class="seat-icon">
              <span class="seats-text">${ride.vagas_disponiveis || 0} vagas disponíveis</span>
            </div>
            <button class="join-ride-btn" data-ride-id="${ride.id || ''}">Participar</button>
          </div>
        `;

        // Adicionar evento ao botão de participar
        const joinButton = rideCard.querySelector('.join-ride-btn');
        joinButton.addEventListener('click', () => this.handleJoinRide(ride.telefone_motorista, ride.destino, `${dateDisplay} às ${timeDisplay}`));

        ridesContainer.appendChild(rideCard);
      } catch (error) {
        console.error('Erro ao renderizar carona:', error, ride);
      }
    });
  },

  // Função para lidar com a participação em uma carona
  async handleJoinRide(numero_motorista, destino, horario) {
    try {
      // Criar a mensagem para o WhatsApp
      const mensagem = `Oi, vi sua carona no IFMobi e gostaria de participar! \nCarona para: ${destino} no dia ${horario}.`;

      // Redirecionar o usuário para o WhatsApp com a mensagem pré-preenchida
      const whatsappLink = `https://wa.me/${numero_motorista}?text=${encodeURIComponent(mensagem)}`;
      window.open(whatsappLink, '_blank');

      alert('Você será redirecionado para o WhatsApp do motorista para confirmar sua participação.');

    } catch (error) {
      console.error('Erro ao participar da carona:', error);
      alert(error.message || 'Erro ao participar da carona. Tente novamente.');
    }
  },

  setupOfferButton() {
    const offerButton = DOM_ELEMENTS.offerButton();
    // Verificamos a autenticação aqui para garantir que o botão tenha o comportamento correto
    if (auth.getToken()) {
      offerButton.classList.remove('disabled');
      offerButton.onclick = () => this.openOfferModal();
    } else {
      this.disableOfferButton(offerButton);
    }
  },

  createOfferRideModal() {
    // Verifica se já existe uma modal
    if (document.getElementById('modal-container')) {
      return;
    }

    // Função para definir o valor mínimo do campo datetime-local para a data/hora atual no horário de Brasília
    const setMinDateTime = (inputElement) => {
      // Obter a data/hora atual no horário de Brasília
      const now = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
      const brazilTime = new Date(now);

      // Formatar para o formato necessário para datetime-local (YYYY-MM-DDTHH:MM)
      const year = brazilTime.getFullYear();
      const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
      const day = String(brazilTime.getDate()).padStart(2, '0');
      const hours = String(brazilTime.getHours()).padStart(2, '0');
      const minutes = String(brazilTime.getMinutes()).padStart(2, '0');

      const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

      // Definir o valor mínimo do input
      inputElement.min = minDateTime;

      // Definir o valor atual do input para o momento atual
      inputElement.value = minDateTime;

      // Adicionar um atributo de dados com a data formatada para a mensagem de erro
      inputElement.dataset.minDateFormatted = brazilTime.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };


    // Criar container da modal
    const modalContainer = document.createElement('div');
    modalContainer.id = 'modal-container';
    modalContainer.className = 'modal-container';

    // Criar o conteúdo da modal
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    // Criar cabeçalho da modal
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';

    const modalTitle = document.createElement('h2');
    modalTitle.textContent = 'Oferecer Carona';

    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => this.closeOfferModal();

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);

    // Criar formulário
    const form = document.createElement('form');
    form.id = 'offer-ride-form';

    // Campo de Local de Partida
    const departureDiv = document.createElement('div');
    departureDiv.className = 'form-group';

    const departureLabel = document.createElement('label');
    departureLabel.setAttribute('for', 'local_partida');
    departureLabel.textContent = 'Local de Partida:';

    const departureInput = document.createElement('input');
    departureInput.type = 'text';
    departureInput.id = 'local_partida';
    departureInput.name = 'local_partida';
    departureInput.required = true;

    departureDiv.appendChild(departureLabel);
    departureDiv.appendChild(departureInput);

    // Campo de Destino
    const destinationDiv = document.createElement('div');
    destinationDiv.className = 'form-group';

    const destinationLabel = document.createElement('label');
    destinationLabel.setAttribute('for', 'destino');
    destinationLabel.textContent = 'Destino:';

    const destinationInput = document.createElement('input');
    destinationInput.type = 'text';
    destinationInput.id = 'destino';
    destinationInput.name = 'destino';
    destinationInput.required = true;

    destinationDiv.appendChild(destinationLabel);
    destinationDiv.appendChild(destinationInput);

    // Campo de Horário
    const timeDiv = document.createElement('div');
    timeDiv.className = 'form-group';

    const timeLabel = document.createElement('label');
    timeLabel.setAttribute('for', 'horario');
    timeLabel.textContent = 'Horário:';

    const timeInput = document.createElement('input');
    timeInput.type = 'datetime-local';
    timeInput.id = 'horario';
    timeInput.name = 'horario';
    timeInput.required = true;

    // Definir horário mínimo inicial
    setMinDateTime(timeInput);

    // Adicionar evento para sempre manter atualizado
    timeInput.addEventListener('focus', () => {

      setMinDateTime(timeInput);
    });

    // Adicionar os novos eventos de validação
    timeInput.addEventListener('invalid', (event) => {
      event.target.setCustomValidity(`Selecione um valor não anterior a ${event.target.dataset.minDateFormatted}`);
    });

    timeInput.addEventListener('input', (event) => {
      event.target.setCustomValidity('');
    });

    timeDiv.appendChild(timeLabel);
    timeDiv.appendChild(timeInput);

    // Campo de Vagas Disponíveis
    const seatsDiv = document.createElement('div');
    seatsDiv.className = 'form-group';

    const seatsLabel = document.createElement('label');
    seatsLabel.setAttribute('for', 'vagas_disponiveis');
    seatsLabel.textContent = 'Vagas Disponíveis:';

    const seatsInput = document.createElement('input');
    seatsInput.type = 'number';
    seatsInput.id = 'vagas_disponiveis';
    seatsInput.name = 'vagas_disponiveis';
    seatsInput.min = '1';
    seatsInput.value = '1';
    seatsInput.required = true;

    seatsDiv.appendChild(seatsLabel);
    seatsDiv.appendChild(seatsInput);

    // Botões de ação
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'form-actions';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Cancelar';
    cancelButton.className = 'cancel-button';
    cancelButton.onclick = () => this.closeOfferModal();

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Criar';
    submitButton.className = 'submit-button';

    actionsDiv.appendChild(cancelButton);
    actionsDiv.appendChild(submitButton);

    // Adicionar elementos ao formulário
    form.appendChild(departureDiv);
    form.appendChild(destinationDiv);
    form.appendChild(timeDiv);
    form.appendChild(seatsDiv);
    form.appendChild(actionsDiv);

    // Adicionar evento de submit ao formulário
    form.onsubmit = this.handleOfferRideSubmit;

    // Montar a modal
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(form);
    modalContainer.appendChild(modalContent);

    // Adicionar modal ao body
    document.body.appendChild(modalContainer);
  },

  async openOfferModal() {
    // Verificar autenticação novamente antes de abrir a modal
    if (!auth.getToken()) {
      alert('Você precisa estar logado para oferecer carona.');
      return;
    }

    // Verificar se o usuário já tem uma carona ativa
    const hasActiveRide = await auth.hasActiveRide();
    if (hasActiveRide) {
      alert('Você já possui uma carona ativa. Encerre-a antes de criar uma nova.');
      return;
    }

    this.createOfferRideModal();
    const modal = DOM_ELEMENTS.modal();
    modal.style.display = 'flex';

    // Adicionar evento para fechar quando clicar fora
    modal.addEventListener('click', (event) => {
      if (event.target === modal) {
        this.closeOfferModal();
      }
    });
  }, // eu alterei aq 73

  closeOfferModal() {
    const modal = DOM_ELEMENTS.modal();
    if (modal) {
      modal.style.display = 'none';
    }
  },

  // Função para lidar com o formulário de oferecer carona
  handleOfferRideSubmit: async function (event) {
    event.preventDefault();

    const token = auth.getToken();
    if (!token) {
      alert('Você precisa estar logado para oferecer carona.');
      return;
    }

    // Collect form data
    const horarioInput = document.getElementById('horario');
    const inputTime = horarioInput.value;

    // Get current time in Brazil timezone
    const now = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
    const currentTime = new Date(now);
    const inputTimeDate = new Date(inputTime);

    // Validate input time
    if (inputTimeDate <= currentTime) {
      alert(`Selecione um horário futuro. O horário mínimo é: ${currentTime.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`);

      // Manually set the validation state
      horarioInput.setCustomValidity(`Selecione um horário após ${currentTime.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}`);

      // Trigger validation display
      horarioInput.reportValidity();
      return;
    }

    // Reset custom validity
    horarioInput.setCustomValidity('');

    // Collect other form data
    const formData = {
      local_partida: document.getElementById('local_partida').value,
      destino: document.getElementById('destino').value,
      horario: inputTime,
      vagas_disponiveis: parseInt(document.getElementById('vagas_disponiveis').value, 10)
    };

    try {
      const response = await fetch(`${API_URL}/caronas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao criar carona');
      }

      const data = await response.json();
      alert('Carona oferecida com sucesso!');
      ui.closeOfferModal();

      // Adiciona o botão Minha Carona de forma mais fluida
      ui.addMyRideButton();

      // Se o dashboard de caronas estiver aberto, atualizar a lista
      if (DOM_ELEMENTS.ridesSection().style.display === 'flex') {
        ui.loadAvailableRides();
      }
    } catch (error) {
      console.error('Erro ao oferecer carona:', error);
      alert(error.message || 'Erro ao oferecer carona. Tente novamente.');
    }
  },

  // Open My Ride Modal with current ride details
  async openMyRideModal() {
    const token = auth.getToken();
    if (!token) {
      alert('Você precisa estar logado.');
      return;
    }

    try {
      // Buscar caronas ativas do usuário
      const response = await fetch(`${API_URL}/caronas/minhas`, {
        method: 'GET',
        headers: { 'x-access-token': token }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar caronas');
      }

      const rides = await response.json();
      const activeRide = rides.find(ride => ride.status === 'Ativa');

      if (!activeRide) {
        alert('Nenhuma carona ativa encontrada.');
        return;
      }

      // INÍCIO DA NOVA FUNÇÃO DE VALIDAÇÃO DE DATA
      const setMinDateTime = (inputElement) => {
        const now = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
        const brazilTime = new Date(now);

        const year = brazilTime.getFullYear();
        const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
        const day = String(brazilTime.getDate()).padStart(2, '0');
        const hours = String(brazilTime.getHours()).padStart(2, '0');
        const minutes = String(brazilTime.getMinutes()).padStart(2, '0');

        const minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;

        inputElement.min = minDateTime;

        inputElement.dataset.minDateFormatted = brazilTime.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      };
      // FIM DA NOVA FUNÇÃO DE VALIDAÇÃO DE DATA

      const modal = document.getElementById('edit-ride-modal');
      const form = document.getElementById('edit-ride-form');

      // Remove any existing delete button to prevent duplication
      const existingDeleteButton = form.querySelector('.delete-ride-button');
      if (existingDeleteButton) {
        existingDeleteButton.remove();
      }

      // Populate form with updated ride details
      document.getElementById('edit-origin').value = activeRide.local_partida || '';
      document.getElementById('edit-destination').value = activeRide.destino || '';

      // Convert ISO date to datetime-local input format
      const horarioISO = activeRide.horario;

      // Extraindo data e hora diretamente da string sem conversão
      const formattedDateTime = horarioISO.substring(0, 16); // "YYYY-MM-DDTHH:MM"

      const departureTimeInput = document.getElementById('edit-departure-time');
      departureTimeInput.value = formattedDateTime;

      // INÍCIO DOS NOVOS EVENTOS DE VALIDAÇÃO
      // Definir horário mínimo inicial
      setMinDateTime(departureTimeInput);

      // Adicionar evento para sempre manter atualizado
      departureTimeInput.addEventListener('focus', () => {
        setMinDateTime(departureTimeInput);
      });

      // Adicionar os novos eventos de validação
      departureTimeInput.addEventListener('invalid', (event) => {
        event.target.setCustomValidity(`Selecione um valor não anterior a ${event.target.dataset.minDateFormatted}`);
      });

      departureTimeInput.addEventListener('input', (event) => {
        event.target.setCustomValidity('');
      });
      // FIM DOS NOVOS EVENTOS DE VALIDAÇÃO

      document.getElementById('edit-available-seats').value = activeRide.vagas_disponiveis || 1;

      // Show modal
      modal.style.display = 'flex';

      // Setup close buttons
      const closeButton = document.getElementById('close-edit-ride-modal');

      // Close modal functions
      const closeModal = () => {
        modal.style.display = 'none';
      };

      closeButton.onclick = closeModal;

      // Close on outside click
      modal.onclick = (event) => {
        if (event.target === modal) {
          closeModal();
        }
      };

      // Remove the cancel button
      const cancelButton = document.getElementById('cancel-edit-ride');
      if (cancelButton) {
        cancelButton.remove();
      }

      // Handle form submission
      form.onsubmit = async (event) => {
        event.preventDefault();

        const token = auth.getToken();
        if (!token) {
          alert('Você precisa estar logado para atualizar carona.');
          return;
        }

        // Get the input time directly
        const inputTime = document.getElementById('edit-departure-time').value;

        // Create a date object from the input
        const horarioDate = new Date(inputTime);

        // Manually format the date to preserve the exact time
        const year = horarioDate.getFullYear();
        const month = String(horarioDate.getMonth() + 1).padStart(2, '0');
        const day = String(horarioDate.getDate()).padStart(2, '0');
        const hours = String(horarioDate.getHours()).padStart(2, '0');
        const minutes = String(horarioDate.getMinutes()).padStart(2, '0');
        const seconds = '00';

        // Create the formatted string without timezone conversion
        const horario = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;

        const formData = {
          local_partida: document.getElementById('edit-origin').value,
          destino: document.getElementById('edit-destination').value,
          horario: horario,
          vagas_disponiveis: parseInt(document.getElementById('edit-available-seats').value, 10)
        };

        try {
          const response = await fetch(`${API_URL}/caronas/${activeRide.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'x-access-token': token
            },
            body: JSON.stringify(formData)
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao atualizar carona');
          }

          alert('Carona atualizada com sucesso!');
          closeModal();

          // Reload dashboard if open
          if (DOM_ELEMENTS.ridesSection().style.display === 'flex') {
            ui.loadAvailableRides();
          }
        } catch (error) {
          console.error('Erro ao atualizar carona:', error);
          alert(error.message || 'Erro ao atualizar carona. Tente novamente.');
        }
      };

      // Create delete button
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Excluir Carona';
      deleteButton.className = 'delete-ride-button';
      deleteButton.type = 'button';

      deleteButton.onclick = async () => {
        if (!confirm('Tem certeza que deseja excluir esta carona?')) return;

        try {
          const response = await fetch(`${API_URL}/caronas/${activeRide.id}`, {
            method: 'DELETE',
            headers: {
              'x-access-token': token
            }
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao excluir carona');
          }

          alert('Carona excluída com sucesso!');
          closeModal();

          // Reload auth buttons to remove My Ride button
          await this.updateAuthButtons();

          // Reload dashboard if open
          if (DOM_ELEMENTS.ridesSection().style.display === 'flex') {
            this.loadAvailableRides();
          }
        } catch (error) {
          console.error('Erro ao excluir carona:', error);
          alert(error.message || 'Erro ao excluir carona. Tente novamente.');
        }
      };

      // Get form actions div
      const formActions = form.querySelector('.form-actions');

      // Insert delete button before the submit button
      const submitButton = formActions.querySelector('button[type="submit"]');
      formActions.insertBefore(deleteButton, submitButton);
    } catch (error) {
      console.error('Erro ao abrir modal de carona:', error);
      alert('Erro ao carregar detalhes da carona. Tente novamente.');
    }
  },

  // Helper method to format date/time for submission
  formatDateTimeForSubmission(timeString) {
    const now = new Date();
    const [hours, minutes] = timeString.split(':');
    now.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return now.toISOString();
  }
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', async () => {
  await auth.validateToken();

  ui.setupScrollEffect();
  ui.setupRequestButton();
  ui.setupOfferButton();

  // Atualiza os botões de autenticação
  await ui.updateAuthButtons();
});