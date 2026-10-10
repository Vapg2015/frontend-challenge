# Kurio Editions - Frontend Challenge

Bem-vindo à implementação do desafio frontend da Kurio Editions. Esta aplicação é um marketplace de NFTs simulado que consome uma API local usando MSW (Mock Service Worker) e TanStack Query (React Query) para demonstrar chamadas de rede realistas, fluxos de autenticação, carrinho de compras, e websockets (simulados).

## 🛠️ Tecnologias Principais

- **Vite + React**
- **TanStack Router**: Roteamento robusto com total segurança de tipos baseada em URL.
- **TanStack Query (React Query)**: Gerenciamento de estado de servidor e cache.
- **MSW (Mock Service Worker)**: Simulação completa de banco de dados e rotas da API em memória.
- **Zod**: Validação rigorosa de esquemas e formulários.
- **Tailwind CSS**: Estilização baseada em utilitários implementando a paleta de luxo exigida pelo design.

---

## 🚀 Setup e Comandos de Execução

1. Certifique-se de que o **Node.js** (versão 18+) está instalado na sua máquina.
2. Clone o repositório e instale as dependências:
   ```bash
   npm install
   ```
3. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. A aplicação estará disponível em `http://localhost:5173`. O MSW interceptará todas as requisições que começam com `/api`.

Outros comandos úteis:
- `npm run build`: Compila a aplicação checando erros de TypeScript.
- `npm run lint`: Roda o linter.

---

## 🔐 Credenciais Fictícias

Por razões de simulação e avaliação rápida, o banco de dados inicial (via MSW local storage) pré-popula as seguintes credenciais se nenhum dado existir. Você também pode **criar um novo usuário na aba "Criar conta"** e se autenticar normalmente (dados são persistidos no LocalStorage para testes persistentes).

- **E-mail:** `contato@exemplo.com`
- **Senha:** `senha123`
- *Opcionalmente, o usuário pode cadastrar um nome ENS e Código de Indicação (os dados visuais de luxo estarão visíveis).*

---

## 🌎 Variáveis de Ambiente

Para este projeto puramente de avaliação de frontend local usando MSW, as variáveis de ambiente necessárias são triviais, mas documentadas abaixo (e podem ser criadas no arquivo `.env` na raiz):

```env
# Porta sugerida de desenvolvimento
PORT=5173

# Base URL para API (Interceptada pelo MSW)
VITE_API_URL=/api

# Caso precisasse de chaves RPC de Testnet reais (Simulado)
VITE_ETH_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/demo
```

*(No entanto, por segurança, o MSW e a infraestrutura local dispensam a criação de `.env` estrito para operar os fluxos padrão de avaliação).*

---

## ⚙️ Seleção e Reset dos Cenários

A persistência do banco de dados simulado do MSW é mantida no `localStorage` sob a chave `nft_marketplace_mock_state`. 

**Para Resetar Todos os Cenários:**
1. Abra o **DevTools** do navegador (F12).
2. Vá até a aba `Application` (ou `Armazenamento local`).
3. Apague todas as chaves do `Local Storage` (`nft_marketplace_mock_state`, `nft_marketplace_cart`, etc).
4. Recarregue a página (F5) para as configurações do banco de dados de NFTs, carrinho e saldo voltarem aos estados de sementes (seeds).

---

## ⚠️ Instruções para Reproduzir os Fluxos de Falha

Para simular latências, falhas na rede, e condições de corrida (`Race Conditions`), construímos um injetor dentro do MSW.

**Como injetar uma falha:**
Para testar como a interface reage a uma falha de "Não Encontrado" (404) ou "Servidor Fora do Ar" (500) em requisições críticas de APIs, utilize os botões da ferramenta flutuante escondida na URL de debug, ou simplesmente insira o seguinte no Console do seu DevTools:

1. **Testando falhas de Rede e Delay Extremo:**
   Para testar cenários de rede instável ou erro de delay, uma função foi embutida no localStorage: execute `localStorage.setItem('SIMULATE_ERROR', '500')` ou defina um delay artificial em milissegundos `localStorage.setItem('SIMULATE_DELAY', '3000')`.
   
2. **Falha de Checkout / Saldo Insuficiente:**
   - Adicione um NFT muito caro no carrinho (como o *Emerald Ape* que possui valores mais elevados).
   - No Checkout, tente pagar sem ter preenchido uma "Carteira Conectada" fictícia ou tente pagar um valor que extrapola `100 ETH` (mock de limite). A API MSW validará e retornará erro exibindo a UI vermelha informando restrições da conta.

3. **Falha 409 (Conflito de Concorrência):**
   - Na página de detalhes do NFT, tente adicionar uma quantidade que excede a disponibilidade (ex. adicionar `51` de uma coleção que tenha `50` disponíveis) ou chame múltiplas vezes o post. O MSW retornará status `409 CONFLICT`, e a interface validará no checkout exibindo as mensagens de inventário indisponível.

4. **Desconexão do WebSocket (MSW Events):**
   - Para simular a falta de comunicação de preço em tempo real (Socket.io fallback), desative a conexão de internet através do devtools na aba `Network` mudando para `Offline`. O polling longo falhará, demonstrando o fallback resiliente da interface com caching nativo pelo TanStack Query.
