require('dotenv').config()

const Groq = require('groq-sdk')
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const empresas = require('./empresas')

// Histórico de conversas por cliente
const historicos = {}

async function perguntar(mensagem, empresaId, clienteId) {

  const empresa = empresas[empresaId]

  // Se a empresa não existe no molde, resposta padrão
  if (!empresa) {
    return 'Desculpe, não consigo identificar a empresa. Tente novamente.'
  }

  const systemPrompt = `
    ${empresa.personalidade}
    INFORMAÇÕES DA EMPRESA:
    ${empresa.informacoes}
    CURIOSIDADES:
    ${empresa.curiosidades}
    
  `

  // Cria histórico para este cliente se não existir
  if (!historicos[clienteId]) {
    historicos[clienteId] = []
  }

  // Adiciona mensagem do cliente ao histórico
  historicos[clienteId].push({
    role: 'user',
    content: mensagem
  })

  // Limita o histórico a 20 mensagens para não sobrecarregar a API
  if (historicos[clienteId].length > 20) {
    historicos[clienteId] = historicos[clienteId].slice(-20)
  }

  const resultado = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemPrompt },
      ...historicos[clienteId]
    ]
  })

  const resposta = resultado.choices[0].message.content

  // Adiciona resposta da IA ao histórico
  historicos[clienteId].push({
    role: 'assistant',
    content: resposta
  })

  return resposta
}

module.exports = { perguntar }