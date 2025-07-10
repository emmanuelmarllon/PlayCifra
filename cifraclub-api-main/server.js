const http = require('http');
const url = require('url');
const cifraHandler = require('./api/cifra');

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/api/cifra') {
    // Adapta a requisição e resposta HTTP para o formato que a função serverless espera
    const adaptedReq = {
      query: parsedUrl.query,
      method: req.method
    };
    
    // Cria um objeto de resposta adaptado
    const adaptedRes = {
      setHeader: (name, value) => res.setHeader(name, value),
      status: (statusCode) => {
        res.statusCode = statusCode;
        return adaptedRes;
      },
      json: (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      }
    };
    
    // Chama o handler serverless
    await cifraHandler(adaptedReq, adaptedRes);
  } else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Rota não encontrada' }));
  }
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Teste a API em: http://localhost:${PORT}/api/cifra?artist=legiao-urbana&song=tempo-perdido`);
}); 