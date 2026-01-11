# 🃏 Coup Online - Realtime Multiplayer Game

![Project Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Tech](https://img.shields.io/badge/stack-React%20|%20Firebase%20|%20Vercel-orange)

> "Onde a mentira é a única verdade."

Uma implementação completa, multiplayer e em tempo real do clássico jogo de tabuleiro **Coup**, rodando diretamente no navegador. Desenvolvido com foco em **Performance**, **UX Responsiva** e **Lógica de Estado Complexa**.

🔗 **Jogue Agora:** [https://coup-game-xi.vercel.app/](https://coup-game-xi.vercel.app/)

---

## 📸 Screenshots

<img width="1905" height="960" alt="image" src="https://github.com/user-attachments/assets/6b4fd12e-2d40-43e2-bd40-31b67fe0eb2b" />

<img width="940" height="884" alt="image" src="https://github.com/user-attachments/assets/bb1cbbec-150d-40a2-81a1-bbe62c686d78" />

<img width="1919" height="960" alt="image" src="https://github.com/user-attachments/assets/6e6719c8-3848-4af8-97e0-b832af78d34a" />

<img width="1919" height="954" alt="image" src="https://github.com/user-attachments/assets/b3fb4b01-885f-474b-81d5-bf02398a0303" />

---

## 🚀 Funcionalidades

### 🎮 Gameplay Completa
- **Multiplayer em Tempo Real:** Sincronização instantânea entre todos os jogadores usando WebSockets (via Firebase).
- **Todas as Ações do Jogo:** Renda, Ajuda Externa, Taxa, Assassinar, Extorquir e Trocar.
- **Sistema de Reações:** Bloqueios e Contestações com janelas de tempo (Timer) para decisão.
- **Variante Inquisidor:** Suporte opcional para a regra do Inquisidor (substituindo o Embaixador).

### 🛡️ Robustez & UX
- **Host Migration:** Se o dono da sala sair, a coroa passa automaticamente para o próximo jogador. A sala nunca morre.
- **Vitória por W.O. (Abandonment Win):** Se todos os oponentes desconectarem, o último sobrevivente vence automaticamente.
- **Reconnect Inteligente:** Suporte a F5 (Refresh). Se você atualizar a página, volta exatamente para o estado onde estava.
- **Distributed "Janitor" Cleanup:** Sistema inteligente de limpeza de salas inativas sem necessidade de servidor backend dedicado (Serverless).

---

## 🛠️ Stack Tecnológica

- **Frontend:** React (Vite)
- **Estilização:** TailwindCSS (Design System customizado, Dark Mode nativo)
- **Backend-as-a-Service:** Firebase Realtime Database
- **Auth:** Firebase Auth (Anônimo - para segurança das regras de banco)
- **Deploy:** Vercel (CI/CD Automático)
- **Gerenciamento de Estado:** Context API + Reducers (para lidar com a Máquina de Estados do jogo)

---

## 🧠 Destaques Técnicos.

Este projeto vai além de um simples CRUD. Os principais desafios de engenharia resolvidos foram:

### 1. Máquina de Estados Síncrona
O Coup possui um fluxo complexo: *Ação -> (Janela de Contestação) -> (Janela de Bloqueio) -> (Janela de Contestação do Bloqueio) -> Resolução*.
Implementei uma máquina de estados rigorosa para garantir que nenhum jogador possa agir fora de sua vez ou interagir (contestar) quando não permitido.

### 2. "Distributed Garbage Collection"
Para evitar custos com Cloud Functions, implementei uma estratégia de **Lazy Cleanup**.
Sempre que um usuário cria uma sala nova, o cliente dele verifica se existem salas "fantasmas" (inativas há >10min) no banco e realiza a limpeza. O custo computacional é distribuído entre os usuários (Edge Computing na prática).

### 3. Prevenção de "Zumbis"
Jogadores com 0 cartas são tratados imediatamente como espectadores.
- **Guard Clauses:** O backend (Firebase Rules + Validações no Client) rejeita qualquer tentativa de interação de jogadores eliminados.
- **UI Adaptativa:** A interface remove botões de ação para quem está apenas assistindo.

---

## ⚡ Como Rodar Localmente

Pré-requisitos: Node.js e uma conta no Firebase.

1. **Clone o repositório**
   ```bash
   git clone [https://github.com/seu-usuario/coup-online.git](https://github.com/seu-usuario/coup-online.git)
   cd coup-online
   ```
2. Instale as dependências
   ```bash
   npm install
   ```
3. Configure as Variáveis de Ambiente Crie um arquivo .env na raiz e adicione suas chaves do Firebase:
   ```bash
   VITE_FIREBASE_API_KEY=sua_key
   VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=seu_banco.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=seu_projeto_id
   VITE_FIREBASE_STORAGE_BUCKET=seu_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu_id
   VITE_FIREBASE_APP_ID=seu_app_id
   ```
4. Rode o servidor de desenvolvimento
   ```bash
   npm run dev
   ```
   
## 🤝 Contribuição
Pull Requests são bem-vindos. Para mudanças maiores, por favor abra uma issue primeiro para discutir o que você gostaria de mudar.

## 📝 Licença

[MIT](https://choosealicense.com/licenses/mit/)

Desenvolvido com ☕ por Nailson Lima.
