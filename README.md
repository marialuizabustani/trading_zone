# Trading Zone

Dashboard estático para monitorar as cartas mais valiosas das coleções recentes e abrir a pesquisa correspondente no TCGplayer.

## Estado atual

- `index.html` é um dashboard sem framework, pronto para GitHub Pages.
- O snapshot embutido é demonstrativo. Ele mantém o produto utilizável antes da conexão com dados reais.
- O painel aceita um JSON público no botão **Conectar dados**. O contrato esperado está no próprio modal.
- A atualização real deve rodar em backend ou GitHub Actions. Não coloque `PUBLIC_KEY`, `PRIVATE_KEY` ou `ACCESS_TOKEN` no `index.html`.

O TCGplayer documenta endpoints para catálogo e market pricing, mas exige autenticação e informa que novas chaves de API não estão sendo concedidas no momento. Por isso, o navegador consome apenas o JSON já tratado pelo pipeline.

## GitHub Pages

1. No repositório, abra **Settings → Pages** e escolha **GitHub Actions** como fonte.
2. O workflow `deploy-pages.yml` publica o conteúdo da branch `main` a cada push.
3. Se o repositório continuar privado, a disponibilidade do Pages depende do plano da conta/organização.

## Feed do TCGplayer

O workflow opcional `update-tcgplayer-data.yml` está preparado para rodar mensalmente ou manualmente. Antes de ativá-lo:

1. Crie `data/collections.json` com as coleções que deseja acompanhar. Cada linha deve ter `categoryId`, `groupId`, `name`, `game` e `year`.
2. Adicione os Secrets `TCGPLAYER_PUBLIC_KEY` e `TCGPLAYER_PRIVATE_KEY` em **Settings → Secrets and variables → Actions**.
3. Execute o workflow manualmente e valide o arquivo gerado em `data/cards.json`.

O script usa os endpoints oficiais de autenticação, catálogo e pricing. Ele não faz scraping de páginas HTML.

## Contrato do JSON

```json
{
  "updatedAt": "2026-10-21T12:00:00Z",
  "source": "tcgplayer",
  "cards": [
    {
      "name": "Nome da carta",
      "set": "Nome da coleção",
      "game": "Pokémon",
      "year": 2024,
      "marketPrice": 42.5,
      "change30d": 3.2,
      "url": "https://www.tcgplayer.com/...",
      "imageUrl": "https://..."
    }
  ]
}
```

O `change30d` é opcional. Quando não existir histórico de 30 dias, o card aparece com `0.0%`.

## Limites importantes

O TCGplayer é a fonte de preço e link de pesquisa. Os valores demo não são cotações atuais e o dashboard não é recomendação financeira. Para o feed real, use apenas acesso autorizado e respeite os termos do TCGplayer.

