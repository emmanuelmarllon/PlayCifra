# Cifra Club API

Esse projeto cria uma API Rest para obter a cifra de uma música do [Cifra Club](https://www.cifraclub.com.br).

Este projeto é baseado na [versão original em Python](https://github.com/code4music/cifraclub-api) criada pelo @code4music, porém reimplementada em Node.js e otimizada para ser executada como uma função serverless na Vercel.

## Sobre o projeto

A ideia é disponibilizar as cifras em formato JSON através de uma interface de API Rest, para facilitar a interação com outros sistemas ou criar automações.

O endpoint de API `/api/cifra?artist=:artist&song=:song` utiliza scraping com Axios e Cheerio para ler a página web do Cifra Club e extrair a cifra e meta dados da música, retornando-os no formato JSON.

## Tecnologias utilizadas

- Node.js
- Axios (para requisições HTTP)
- Cheerio (para parsing HTML)
- Vercel Serverless Functions

## Como utilizar a API online

Esta API está disponível online através da Vercel. Você pode utilizá-la diretamente acessando:

```
https://cifraclub-api.vercel.app/api/cifra?artist=coldplay&song=the-scientist
```

## Como rodar o projeto localmente

Para executar o projeto na sua máquina local, certifique-se que você tem o Node.js instalado. Em seguida, clone o repositório e instale as dependências:

```console
git clone https://github.com/seu-usuario/cifraclub-api.git
cd cifraclub-api
npm install
```

Para iniciar o servidor localmente:

```console
npm start
```

O servidor local estará disponível em [localhost:3000](http://localhost:3000). A API incluí um servidor HTTP simples (`server.js`) que direciona as requisições para a mesma função serverless utilizada na Vercel.

Alternativamente, se você tiver o Vercel CLI instalado:

```console
vercel dev
```

## Como obter uma cifra

Com o projeto rodando, você pode fazer uma requisição para:

```
http://localhost:3000/api/cifra?artist=legiao-urbana&song=tempo-perdido
```

Ou se preferir obter o JSON da música pelo terminal, execute:

```console
curl "http://localhost:3000/api/cifra?artist=legiao-urbana&song=tempo-perdido"
```

## Estrutura do projeto

```
cifraclub-api/
├── api/
│   └── cifra.js       # Função principal da API (serverless)
├── server.js          # Servidor HTTP local para desenvolvimento
├── package.json       # Dependências e scripts
├── vercel.json        # Configuração de implantação na Vercel
└── README.md          # Documentação
```

## Exemplo de resposta

O retorno da API será algo como:

```json
{
  "artist": "Legião Urbana",
  "name": "Tempo Perdido",
  "cifraclub_url": "https://www.cifraclub.com.br/legiao-urbana/tempo-perdido",
  "youtube_url": "https://www.youtube.com/watch?v=zpzoG5KGaHg",
  "cifra": [
    "Intro: C  Am  Em  F  C  Am  Em  F",
    "",
    "C             Am",
    "Todos os dias quando acordo",
    "      Em                 F",
    "Não tenho mais o tempo que passou",
    "C                 Am",
    "Mas tenho muito tempo",
    "      Em             F",
    "Temos todo o tempo do mundo",
    // ... outras linhas da cifra ...
  ]
}
```

## Diferenças em relação ao projeto original

- Implementação em Node.js ao invés de Python
- Uso de Cheerio para parsing HTML em vez de Selenium WebDriver
- Otimizado para execução serverless na Vercel
- Endpoint com parâmetros de query ao invés de parâmetros de rota
- Servidor HTTP local para desenvolvimento

## Limitações

- A API está sujeita a mudanças no layout do site Cifra Club
- Possui rate-limiting básico para evitar sobrecarga
- O conteúdo extraído é de propriedade do Cifra Club e deve ser utilizado de acordo com os termos do site

## Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir uma issue ou enviar um pull request.

## Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para mais detalhes.
