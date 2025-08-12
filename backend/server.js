import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const MODEL = process.env.MODEL_NAME || "llama-3-70b";
const GROQ_KEY = process.env.GROQ_API_KEY;

// Armazena histórico por sessão (em memória)
const sessions = new Map();

// Template do sistema
const systemTemplate = `Você é um Assistente de Compras (linguagem: português - pt-BR).
Seu objetivo: ajudar o usuário a escolher e comprar produtos com clareza, confiança e economia.

Regras de comportamento:
1. Primeiro, sempre confirme o que o usuário quer (categoria, faixa de preço, marca, uso).
2. Se a entrada estiver ambígua ou faltar informação importante, faça uma pergunta de esclarecimento curta.
3. Sempre ofereça:
    - 1 recomendação principal com justificativa curta (2-3 linhas);
    - 2 alternativas (nome + razão resumida);
    - Faixa de preço aproximada em BRL (ex: "R$ 300-450");
    - Onde comprar (lojas online brasileiras quando possível) — se não tiver URL, indicar tipos de loja (ex: "loja oficial", "mercado eletrônico").
4. Ao final, pergunte se o usuário quer ajuda a comparar especificações, encontrar cupom ou escolher método de pagamento/entrega.
5. Seja conciso, objetivo e educado.

Formato de resposta (use exatamente este formato):
---
RECOMENDAÇÃO PRINCIPAL:
- Produto: <nome>
- Por quê: <2-3 linhas>
- Faixa de preço (BRL): <ex: R$ 300–450>
- Onde comprar: <loja(s) ou tipo de loja>

ALTERNATIVAS:
1) <nome> — <1 linha de razão>
2) <nome> — <1 linha de razão>

PERGUNTA:
- <pergunta de follow-up curta para esclarecer ou oferecer algo a mais>
---
Separe as frases da sua resposta com quebras de linha.
Preste atenção à segurança: não forneça links inseguros; não faça promessas falsas sobre estoque ou prazo. Sempre peça confirmação se for finalizar compra.`;

// Inicializa o modelo
const llm = new ChatGroq({
  model: MODEL,
  temperature: 0.7,
  apiKey: GROQ_KEY,
});

// Endpoint principal
app.post("/chat", async (req, res) => {
  const userMessage = req.body.message || "";
  const sessionId = req.body.sessionId || "default";

  // Recupera histórico ou inicia novo
  const history = sessions.get(sessionId) || [];

  // Adiciona nova mensagem do usuário
  history.push({ role: "user", content: userMessage });

  // Monta o prompt com histórico
  const messages = [
    { role: "system", content: systemTemplate },
    ...history
  ];

  try {
    const response = await llm.invoke(messages);

    // Adiciona resposta do assistente ao histórico
    history.push({ role: "assistant", content: response.content });

    // Atualiza sessão
    sessions.set(sessionId, history);

    res.json({ response: response.content });
  } catch (error) {
    console.error("Erro na requisição /chat:", error);
    res.status(500).json({ error: error.message || "Erro interno" });
  }
});

// Inicia o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
