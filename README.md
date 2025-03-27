# FRONT-END-TF-WEB
# 🌍 Documentação Técnica do IFMOBI 🚗💨

## 🏛 Arquitetura Geral

### 🔑 Objeto `auth` (Autenticação)
Gerencia todas as operações relacionadas à autenticação.

Métodos principais:
- `getToken()`: Recupera o token de autenticação do localStorage
- `removeToken()`: Remove o token de autenticação
- `validateToken()`: Verifica a validade do token com o backend
- `hasActiveRide()`: Confere se o usuário tem uma carona ativa
- `isAuthenticated()`: Verifica se o usuário está autenticado
- `getUserType()`: Determina o tipo de usuário (comum ou administrador)

### 🎨 Objeto `ui` (Interface do Usuário)
Gerencia as interações e a renderização dinâmica do conteúdo.

Funcionalidades de gestão dinâmica da interface:
- `updateAuthButtons()`: Atualiza os botões de autenticação dinamicamente
- `createButton()`: Gera botões interativos de forma programada
- `setupScrollEffect()`: Adiciona efeitos ao cabeçalho com base no scroll
- `setupRequestButton()`: Configura interações para pedir carona
- `setupOfferButton()`: Gerencia a funcionalidade de oferecer caronas

## 🔄 Fluxos Principais da Aplicação

### 🔑 Fluxo de Autenticação
- Validação do token ao carregar a página
- Renderização dinâmica dos botões conforme o status de autenticação
- Redirecionamento e controle de acesso para usuários logados ou não

### 🚗 Gestão de Caronas

#### 🛑 Oferecer uma Carona
- Abrir um modal para inserir os detalhes da carona
- Preencher e validar as informações
- Criar a carona via API

#### 📍 Pedir uma Carona
- Carregar as caronas disponíveis
- Exibir as caronas na dashboard
- Permitir contato com os motoristas via WhatsApp

#### 🚘 Gerenciar Minhas Caronas
- Visualizar a carona ativa
- Editar os detalhes da carona
- Excluir uma carona existente

## 🔐 Página de Login

### 🌐 Configuração Básica
- **URL da API**: https://back-end-tf-web-alpha.vercel.app/api
- **Endpoint de Autenticação**: `/auth/login`
- **Método**: POST

### 📋 Componentes HTML
Campos de Entrada:
- E-mail (`input type="email"`)
- Senha (`input type="password"`)
- Botão de Submissão: Entrar
- Link Alternativo: Cadastre-se

### 🚀 Fluxo de Autenticação

#### 1. Captura de Dados
- Recupera valores de email e senha
- Previne envio padrão do formulário

#### 2. Requisição de Login
- Envia credenciais via JSON
- Utiliza método assíncrono com `fetch()`

#### 3. Tratamento de Resposta
**Sucesso**:
- Armazena token no localStorage
- Redireciona para página inicial

**Falha**:
- Exibe mensagem de erro em alerta

## 🌍 Página de Registro

### 🏗️ Estrutura da Página
Página de registro projetada para permitir que novos usuários criem uma conta no sistema IFMOBI.

### 📋 Componentes do Formulário
- **Nome**: Campo de texto para nome completo
- **E-mail**: Input para endereço de e-mail com validação
- **Telefone**: Campo de telefone com formatação brasileira (+55)
- **Senha**: Campo para criação de senha com requisitos de segurança
- **Confirmação de Senha**: Verificação de senha digitada corretamente

### 🔒 Validações de Registro

#### 📝 Validações de Entrada

**Nome**:
- Obrigatório
- Não pode estar em branco

**E-mail**:
- Formato válido de e-mail
- Uso de expressão regular para validação
- Não pode estar em branco

**Telefone**:
- Formato brasileiro (+55)
- Exatamente 11 dígitos
- Formatação automática durante a digitação

**Senha**:
- Mínimo de 8 caracteres
- Requer pelo menos:
  - Uma letra maiúscula
  - Uma letra minúscula
  - Um número
- Senhas devem coincidir

### 🔄 Fluxo de Registro

#### Preenchimento do Formulário
- Usuário preenche todos os campos obrigatórios
- Formatação em tempo real do número de telefone
- Validações instantâneas de formato

#### Envio do Formulário
- Prevenção do envio com dados inválidos
- Desabilitação do botão durante o processamento
- Indicador de carregamento

#### Comunicação com Backend
- **Endpoint**: https://back-end-tf-web-alpha.vercel.app/api/auth/signup
- Envio de dados formatados:
  - Nome
  - E-mail
  - Senha
  - Telefone com prefixo +55

#### Tratamento de Resposta
- **Sucesso**: Armazenamento do token no localStorage, redirecionamento para o dashboard
- **Falha**: Exibição de mensagem de erro personalizada

## 👤 Página de Perfil do Usuário

### 🏛 Arquitetura do Componente
Composta por três arquivos principais:
- `index.html`: Estrutura da página
- `script.js`: Lógica de interação e comunicação com o backend
- `styles.css`: Estilização visual da página

### 🔑 Funcionalidades Principais

#### 📂 Carregamento de Perfil
- `fetchProfile()`: Função assíncrona que busca os dados do usuário
  - Recupera token de autenticação do localStorage
  - Carrega informações de nome, email e telefone
  - Formata o número de telefone para exibição brasileira

#### ✏️ Edição de Perfil
- `toggleEditMode()`: Transforma campos em inputs editáveis
  - Campos editáveis: nome, email, telefone e senha
  - Validação de senhas (nova senha e confirmação)
  - Formatação automática de número de telefone

#### 💾 Salvamento de Alterações
- `saveProfile()`: Envia alterações para o backend
  - Coleta dados dos campos editados
  - Formata número de telefone com prefixo +55
  - Verifica compatibilidade de senhas
  - Tratamento de erros com mensagens específicas

### 🔐 Segurança e Validação
- Autenticação via token JWT
- Verificação de token antes de cada operação
- Redirecionamento para login se não autenticado
- Máscara de senha (************)

### 🎨 Interface do Usuário
- Design responsivo e moderno
- Tema escuro com paleta de cores azul e cinza
- Botões interativos de Editar/Salvar
- Container centralizado com sombra
- Feedback visual para campos editáveis

### 🔄 Fluxo de Interação

#### Carregamento da página
- Verifica autenticação
- Busca dados do perfil
- Renderiza informações

#### Modo de Edição
- Clique em "Editar"
- Transforma campos em inputs
- Permite modificação de dados

#### Salvamento
- Validação dos dados
- Envio para backend
- Atualização da interface
- Retorno ao modo de visualização

### ⚠️ Tratamento de Erros
- `showError()`: Exibe mensagens de erro temporárias
- Cenários cobertos:
  - Falha no carregamento do perfil
  - Senhas não coincidentes
  - Erros de comunicação com backend

## 🖥️ Página de Administração

### 🏛 Arquitetura da Página Admin
Interface sofisticada para gerenciamento de usuários e caronas.

### 🔐 Segurança e Autenticação
- Verificação rigorosa de permissão de admin
- Redirecionamento automático para login se não for admin
- Uso de token de autenticação para todas as requisições
- Validação de token a cada carregamento de página

### 📊 Seções Principais

#### Usuários
- Lista completa de usuários
- Campos: ID, Nome, Email, Telefone, Data de Criação
- Funções: Editar e Deletar usuários

#### Caronas
- Lista detalhada de caronas
- Campos: ID, Motorista, Local de Partida, Destino, Data, Horário, Vagas, Status
- Funções: Editar e Deletar caronas

### 🔄 Funcionalidades Dinâmicas

#### Navegação Interativa
- Troca de seções sem recarregar página
- Animações suaves de transição
- Prevenção de perda de dados durante edições

#### Gerenciamento de Dados
- Carregamento dinâmico de tabelas
- Edição inline de registros
- Confirmação antes de exclusões

### ✨ Recursos Especiais

#### Ordenação Inteligente
- Suporte para ordenação em múltiplas colunas
- Tratamento especial para diferentes tipos de dados
- Indicadores visuais de direção de ordenação

#### Dropdown Dinâmico
- Lista de motoristas atualizada em tempo real
- Seleção intuitiva durante edições

### 🛡️ Tratamento de Erros
- Mensagens de erro claras
- Prevenção de ações simultâneas
- Restauração de estado original em caso de falha

### 🖌️ Design e Experiência
- Interface escura profissional
- Cores consistentes
- Transições suaves
- Responsividade para diferentes dispositivos

### 🔍 Fluxo de Trabalho Típico
1. Autenticação como administrador
2. Carregamento das tabelas de usuários e caronas
3. Navegação entre seções
4. Edição ou exclusão de registros
5. Confirmação de ações
6. Atualização instantânea da interface
