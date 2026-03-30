require('dotenv').config()
const fs = require('fs')

const wppconnect = require('@wppconnect-team/wppconnect')
const { perguntar } = require('./ia')

// Define qual empresa corresponde a este número de WhatsApp
// Quando tiveres vários clientes, adicionas aqui
const EMPRESA_ID = 'MuanaMilunga'


// Inicia o cliente do WhatsApp
wppconnect
  .create({

    // Configurações do cliente
    session: 'sessionName',
    catchQR: (base64Qr, asciiQR) => {
      console.log('📱 Escaneia o QR code:')
      console.log(asciiQR)
      const qrPath = 'qrcode.png'
      fs.writeFileSync(qrPath, Buffer.from(base64Qr, 'base64'))
      console.log(`✅ QR salvo em ${qrPath}`)
    },

    // Callback para status da sessão
    statusFind: (statusSession) => {
      console.log('Status:', statusSession)
      if (statusSession === 'inChat') {
        console.log('✅ WhatsApp conectado!')
      }
    },

    // Outras configurações
    headless: true,
    devtools: false,
  })

  // Inicia o cliente e passa para a função de start
  .then((client) => start(client))

  // Captura erros na inicialização
  .catch((error) => {
    console.error('❌ Erro ao iniciar:', error)
  })



  // Função principal para lidar com mensagens
function start(client) {
  console.log('🚀 Bot iniciado!')


  // Escuta mensagens recebidas
  client.onMessage(async (message) => {
    try {
      // Ignora grupos e broadcasts
      if (message.isGroupMsg) return
      if (message.from === 'status@broadcast') return

      // Extrai mensagem e ID do cliente
      const mensagem = message.body
      const clienteId = message.from // número do cliente é o ID único
      const nomeClienteCompleto = message.sender?.name || message.sender?.pushname || message.sender?.formattedName || message.notifyName || 'Cliente'
      const nomeCliente = nomeClienteCompleto.split(' ')[0]

      // Loga a mensagem recebida
      console.log(`\n📩 De: ${message.from}`)
      console.log(`👤 Nome do cliente: ${nomeClienteCompleto}`)
      console.log(`👤 Primeiro nome: ${nomeCliente}`)
      console.log(`📝 Mensagem: ${mensagem}`)

      // Manda para a IA e espera resposta
      const resposta = await perguntar(mensagem, EMPRESA_ID, clienteId)

      console.log(`🤖 Resposta: ${resposta}`)

      // Envia a resposta no WhatsApp
      await client.sendText(message.from, resposta)

    } catch (erro) {
      console.error('❌ Erro:', erro.message)
      await client.sendText(message.from, 'Desculpe, ocorreu um erro. Tente novamente.')
    }
  })
}