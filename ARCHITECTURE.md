# Kurio Editions - Architecture Document

Este documento descreve as decisões arquiteturais, padrões de código, e desvios pontuais tomados no desenvolvimento da aplicação frontend de marketplace de NFTs. O objetivo central foi criar uma experiência de "luxo e alto desempenho" usando React.

---

## 1. Contratos REST e Eventos

A comunicação da aplicação com o backend (mockado via MSW) ocorre puramente através de contratos REST fortemente tipados na pasta `src/api/contracts`.

- **Formato REST:** Todos os retornos obedecem a hierarquia tipada no cliente, retornando um payload padrão ou um `ApiError` estruturado.
- **APIs de Carrinho, Checkout e Listagem:** Os retornos são paginados ou envelopados conforme as melhores práticas, permitindo validações exatas entre `requests` (`AddToCartRequest`, `QuoteRequest`, etc) e respostas mapeadas diretamente no cache.
- **Eventos:** Os eventos assíncronos e subscrições para status em tempo real são processados localmente baseados na abstração `useSocket`, onde as transmissões de eventos REST/SSE/WS são mockadas.

---

## 2. Política de Sessão

A autenticação foi estruturada com uso de tokens fictícios de acesso (`access_token`) controlados inteiramente por memória e LocalStorage, com validade e interceptação no MSW para as rotas autenticadas.
- **Carts Anônimos vs Usuários:** Foi implementada uma política unificada de `guest checkout`. Usuários não autenticados utilizam um identificador em Local Storage de sessão anônima. Quando realizam o login, o carrinho é mesclado (`merge`) no banco de dados local da store MSW (exposto pelo handler) com as chaves persistidas. 
- **Rotas:** O `TanStack Router` faz checagem e roteamento via `beforeLoad` (guards estritos), enviando redirecionamentos invisíveis se o usuário acessar rotas privadas como `/checkout` ou `/account` quando não logado.

---

## 3. Estado do Carrinho

O carrinho foi concebido para possuir uma estratégia de "Update Otimista" (Optimistic Updates) e leitura unificada:
- Todo incremento, deleção, ou mescla de quantidade é inicialmente mutada no cliente assumindo sucesso. 
- O hook `useCart` envelopa o estado local (`localCart`) e o `serverCart` injetado pelo React Query.
- Graças às correções no cache (garantindo o merge dos objetos brutos retornados pelo res.data ao invés de AxiosResponses aninhadas), o "source of truth" do carrinho é sempre validado na rede, enquanto a UI interage na velocidade da luz graças à predição de estado.

---

## 4. Estratégia de Cache

Usamos o **TanStack Query v5** como engrenagem central do cache de servidor e persistência de fetch requests.

- **Stale Time e Revalidações:** Requisições caras como lista de NFTs têm um `staleTime` moderado de ~1 minuto e invalidação baseada em ações transacionais do usuário.
- **Invalidação Transparente (Mutations):** Ações puras de escrita do cliente, como `Favorite` ou `AddToCart`, chamam os métodos de `invalidationHelpers` que forçam os refetches focados e silenciosos.

---

## 5. Reconciliação entre REST e Socket.IO

Os "Eventos em tempo real" baseados no mercado dinâmico de Web3 são simulados usando a fundação de re-fetch e pooling com uma camada de abstração.
- No lugar de WebSockets literais com o backend mockado, o `useSocket.ts` estabelece um mecanismo robusto simulado que emite sinais baseados nos limites definidos na camada MSW.
- Quando o socket dispara "preço atualizado" (Price Updates), o React Query roda uma invalidação inteligente ou injeta o dado diretamente no Cache do `queryClient`, garantindo que a árvore REST não saia de sincronia (reconciliação direta cache-a-cache).

---

## 6. Limitações Conhecidas (Trade-offs)

- A complexidade do mock em MSW pode gerar um processamento síncrono que bloqueia ligeiramente a sub-thread do Browser, algo imperceptível para demonstrações, mas diferente de um processamento de rede assíncrona pura real.
- O Web3 Connect (Conectar Carteira como MetaMask real) está totalmente enclausurado em componentes visuais ou formulários "mockados" em prol do escopo do desafio frontend, sem instanciar `ethers.js` ou interagir com providers (Ethereum Window objects).

---

## 7. Decisões de UX e Desvios do Figma

O projeto utilizou a planta central do *Figma* como bíblia de diretrizes visuais. No entanto, algumas concessões e adições benéficas foram incluídas:

1. **Modais Dinâmicos (Auth):** No Figma original, telas de *Login* e *Cadastro* podiam existir de forma isolada, porém a implementação as aninhou via URL como um Modal fixo por sobre a **Home Page**. Isso melhora violentamente o fluxo ("não abandonar a vitrine").
2. **Interações Expandidas de "Luxo":** Foram inseridas transições *glow*, anéis dourados de foco (paleta de Amber customizada e Surface-Dark), animações de drop-shadows suaves nos inputs e badges e botões de UI com efeitos magnéticos em sub-menus (não estritamente presentes nos grids estáticos), dando vida à aplicação.
3. **Semântica (Campos Visuais):** Nomes ENS e Códigos Referenciais (indicados para telas) estão 100% integrados esteticamente, sem engessar a validação Zod severa e backend, entregando o valor de UI ao usuário e o isolamento de dados no formulário sem quebrar.
