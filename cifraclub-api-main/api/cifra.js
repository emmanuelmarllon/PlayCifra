const axios = require('axios');
const cheerio = require('cheerio');

const CIFRACLUB_URL = "https://www.cifraclub.com.br/";

class CifraClub {
    constructor() {
        this.session = axios.create({
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 // 10 segundos
        });
    }

    async cifra(artist, song) {
        const result = {
            artist: artist,
            name: song,
            cifraclub_url: `${CIFRACLUB_URL}${artist}/${song}`,
            error: null
        };

        try {
            const response = await this.session.get(result.cifraclub_url, {
                maxRedirects: 5,
                validateStatus: function (status) {
                    return status >= 200 && status < 400; // Aceita 3xx como válido
                }
            });
            
            // Se a URL final for diferente da requisitada, atualizar
            if (response.request.res.responseUrl !== result.cifraclub_url) {
                result.cifraclub_url = response.request.res.responseUrl;
            }
            
            const $ = cheerio.load(response.data);

            this.getDetails(result, $);
            this.getCifra(result, $);
        } catch (e) {
            result.error = e.message;
        }

        return result;
    }

    getDetails(result, $) {
        try {
            const titleElem = $('h1.t1').text().trim();
            if (titleElem) result.name = titleElem;

            const artistElem = $('h2.t3').text().trim();
            if (artistElem) result.artist = artistElem;

            const playerPlaceholder = $('div.player-placeholder img').attr('src');
            if (playerPlaceholder && playerPlaceholder.includes('/vi/')) {
                const cod = playerPlaceholder.split('/vi/')[1].split('/')[0];
                result.youtube_url = `https://www.youtube.com/watch?v=${cod}`;
            }
        } catch (e) {
            if (!result.error) result.error = `Erro ao obter detalhes: ${e.message}`;
        }
    }

    getCifra(result, $) {
        try {
            let cifraContent = $('div.cifra_cnt');
            if (!cifraContent.length) cifraContent = $('pre.js-tab-content');

            if (cifraContent.length) {
                let preTag = cifraContent.find('pre');
                if (!preTag.length) preTag = cifraContent;

                const cifraText = preTag.text().trim();
                if (cifraText) {
                    result.cifra = cifraText.split('\n').filter(line => line.trim());
                } else {
                    result.error = "Cifra não encontrada";
                }
            } else {
                result.error = "Conteúdo da cifra não encontrado";
            }
        } catch (e) {
            if (!result.error) result.error = `Erro ao obter cifra: ${e.message}`;
        }
    }
}

const cifraClub = new CifraClub();

function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    // Remover acentos
    const withoutAccents = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    return withoutAccents
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') // Remove hífens no início/fim
        .trim();
}

// Função exportada para Vercel
module.exports = async (req, res) => {
    // Suporte a CORS básico
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    // Rate limiting básico (não usa express-rate-limit, pois é serverless)
    // Para um controle mais robusto, use um serviço externo ou banco de dados
    const { artist, song } = req.query;

    if (!artist || !song) {
        return res.status(400).json({
            error: "Os parâmetros 'artist' e 'song' são obrigatórios."
        });
    }

    const sanitizedArtist = sanitizeInput(artist);
    const sanitizedSong = sanitizeInput(song);

    if (!sanitizedArtist || !sanitizedSong) {
        return res.status(400).json({
            error: "Parâmetros inválidos após sanitização."
        });
    }

    try {
        const result = await cifraClub.cifra(sanitizedArtist, sanitizedSong);
        
        if (!result.error) {
            // Remover propriedades null ou undefined
            Object.keys(result).forEach(key => 
                (result[key] === null || result[key] === undefined) && delete result[key]
            );
            
            // Adicionar metadados úteis
            result.timestamp = new Date().toISOString();
            result.source = "CifraClub API";
        }
        
        res.status(200).json(result);
    } catch (e) {
        res.status(500).json({
            error: `Erro interno no servidor: ${e.message}`
        });
    }
};