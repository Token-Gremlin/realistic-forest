# Sylva

[English](README.md) · [Português](#sylva)

Por [Token Gremlin](https://x.com/TokenGremlin).

Uma floresta cinematográfica em tempo real no navegador. **Nada é carregado.**
Não há texturas, malhas, HDRIs nem materiais prontos no repositório. Terreno,
árvores, grama, água, céu, nuvens e clima saem da matemática em runtime.

Feito com [Three.js](https://threejs.org/) e **WebGL2**. A sessão padrão é um
**editor de floresta em inglês**, com um botão EN / PT-BR, looks nomeados, URL
partilhável e câmara andável.

Demo ao vivo: [token-gremlin.github.io/realistic-forest](https://token-gremlin.github.io/realistic-forest/).

A documentação principal, os prints e o detalhe técnico estão em
[inglês](README.md).

## Começar

```bash
git clone https://github.com/Token-Gremlin/realistic-forest.git
cd realistic-forest
npm install
npm run dev        # http://localhost:5173
```

Precisa de um browser com WebGL2 e `EXT_color_buffer_float`.

```bash
npm run build      # bundle estático em dist/
npm run preview    # servir o bundle
```

## Controlos

| tecla | acção |
| --- | --- |
| `H` | mostrar / esconder o editor |
| `C` | câmara cinematográfica |
| `N` / `B` | clima seguinte / anterior (desligado até carregar) |
| `G` | modo caminhada (câmara no chão) |
| `F` | profundidade de campo |
| `P` | pausa |
| rato / WASD / shift / scroll | câmara livre (clique para capturar o ponteiro) |

## Parâmetros da URL

| param | valores |
| --- | --- |
| `?q=` | `tiny` `low` `play` `medium` `high` `ultra` — qualidade (`play` é o defeito) |
| `?look=` | `bosque` `prado` `brejo` `mata` `clareira` `cinema` `rochoso` |
| `?gfx=` | `fluid` `balanced` `pretty` `max` |
| `?far=` | `full` (horizonte nítido) ou `blur` (desfoque) |
| `?act=` | acto de clima `0`–`11` |
| `?timeline=1` | liga a linha do tempo do clima |
| `?cine=1` | começa em câmara cinematográfica |
| `?panel=0` | esconde o editor |
| `?lang=` | `en` (defeito) ou `pt-BR` — idioma da interface |
| `?trees=` `?grass=` `?water=` `?hi=1` | overrides dos sliders |

O boot é **sol alto**, linha do tempo desligada. Chuva e tempestade só entram
se você ligar. A vista de abertura **assenta antes do overlay sumir** — árvores,
chão, grama e água já estão no sítio, sem teleportar do horizonte.

O renderer é WebGL2. Se o browser também expõe WebGPU, isso só entra como
pista na escolha da qualidade.

## Como está montado

O terreno (`src/world/terrainShader.js`) é uma função analítica de XZ, não um
heightmap. Uma janela à volta da câmara é bakeada em mapas
(`src/world/WorldMaps.js`). A distância de visão nunca passa dessa janela —
foi isso que tapava o buraco preto no horizonte.

Árvores nascem de um esqueleto por semente (`src/veg/TreeGenerator.js`). O LOD
é por **tamanho no ecrã**; a malha grosseira tipo Lego não entra na passagem a
cores. Há um teto de instâncias para o editor não gerar sete mil cones.

A grama é colocada na GPU. A água é um passe forward (refracção, SSR, cáusticas).
O pipeline deferred (`src/core/RenderPipeline.js`) trata sombras, g-buffer, céu,
AO, luz, volumetria, TAA e grade AgX.

Clima, chuva, relâmpago, fogo e vida estão em `src/director/` e `src/fx/`.

Há mais detalhe técnico no [README em inglês](README.md#how-it-is-put-together).

## Testes

```bash
npm run capture -- --q=tiny --w=960 --h=540 --out=shots/try
```

Chrome headless (SwiftShader) apanha erros de shader e grava stills. Os pins
estão em `tools/cap-*.js`.

## Licença

[MIT](LICENSE) — © 2026 [Token Gremlin](https://x.com/TokenGremlin).
