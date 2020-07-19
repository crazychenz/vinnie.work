const config = {
  gatsby: {
    pathPrefix: '/portfolio',
    siteUrl: 'https://omethingelseshouldgohere',
    gaTrackingId: null,
    trailingSlash: false,
  },
  header: {
    logo: 'vinnie-lighthouse.png',
    logoLink: '',
    title: 'Portfolio',
    githubUrl: 'https://github.com/crazychenz',
    helpUrl: '',
    tweetText: '',
    social: `<li>
        <a href="https://discordapp.com/invite/hasura" target="_blank" rel="noopener">
          <div class="discordBtn">
            <img src='https://graphql-engine-cdn.hasura.io/learn-hasura/assets/homepage/discord-brands-block.svg' alt={'Discord'}/>
          </div>
        </a>
      </li>`,
    links: [{ text: 'Home', link: '' }],
    search: {
      enabled: false,
      indexName: '',
      algoliaAppId: process.env.GATSBY_ALGOLIA_APP_ID,
      algoliaSearchKey: process.env.GATSBY_ALGOLIA_SEARCH_KEY,
      algoliaAdminKey: process.env.ALGOLIA_ADMIN_KEY,
    },
  },
  sidebar: {
    forcedNavOrder: [
      // summary should be on landing page
      '/resume',
      '/usdod',
      '/gamedev',
      '/snip',
      '/llc',
      '/usna',
      '/contracts',
      '/oddjobs',
      '/hobbies',
    ],
    collapsedNav: [
      '/usdod',
      '/snip',
      '/gamedev',
      '/llc',
      '/usna',
      '/contracts',
      '/oddjobs',
      '/hobbies',
    ],
    links: [
      { text: 'Stackoverflow Profile', link: 'https://stackoverflow.com/users/6316437/vincent-agriesti' },
      { text: 'GitHub Profile', link: 'https://github.com/crazychenz' },
      { text: '(New) LinkedIn Profile', link: 'https://www.linkedin.com/in/vincent-agriesti-267aa21ab/' },
    ],
    frontline: false,
    ignoreIndex: true,
    title: "Section List",
    //"<a href='https://somelink1'>link1 </a><div class='greenCircle'></div><a href='https://somelink2'>link2</a>",
  },
  siteMetadata: {
    title: 'Gatsby Gitbook Boilerplate | Hasura',
    description: 'Documentation built with mdx. Powering hasura.io/learn ',
    ogImage: null,
    docsLocation: 'https://github.com/hasura/gatsby-gitbook-boilerplate/tree/master/content',
    favicon: 'https://graphql-engine-cdn.hasura.io/img/hasura_icon_black.svg',
  },
  pwa: {
    enabled: false, // disabling this will also remove the existing service worker.
    manifest: {
      name: 'Gatsby Gitbook Starter',
      short_name: 'GitbookStarter',
      start_url: '/',
      background_color: '#6b37bf',
      theme_color: '#6b37bf',
      display: 'standalone',
      crossOrigin: 'use-credentials',
      icons: [
        {
          src: 'src/pwa-512.png',
          sizes: `512x512`,
          type: `image/png`,
        },
      ],
    },
  },
};

module.exports = config;
