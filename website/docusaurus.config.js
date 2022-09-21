// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Vinnie dot Work',
  tagline: '',
  url: 'https://www.vinnie.work',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  organizationName: 'crazychenz', // Usually your GitHub org/user name.
  projectName: 'vinnie.work', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      //hideableSidebar: true,
      navbar: {
        title: 'Vinnie dot Work',
        logo: {
          alt: 'Vinnie dot Work Site Logo',
          src: 'img/profile.png',
        },
        items: [
          { to: '/blog', label: 'Blog', position: 'left' },
          { type: 'doc', docId: 'Inform', label: 'Inform', position: 'left' },
          { type: 'doc', docId: 'Stream', label: 'Stream', position: 'left' },
          { to: '/about', label: 'About', position: 'left' },
          //{ href: "https://github.com/", label: "GitHub", position: "left" },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          // {
          //   title: 'Docs',
          //   items: [
          //     {
          //       label: 'Tutorial',
          //       to: '/docs/intro',
          //     },
          //   ],
          // },
          // {
          //   title: 'Community',
          //   items: [
          //     {
          //       label: 'Stack Overflow',
          //       href: 'https://stackoverflow.com/questions/tagged/docusaurus',
          //     },
          //     {
          //       label: 'Discord',
          //       href: 'https://discordapp.com/invite/docusaurus',
          //     },
          //     {
          //       label: 'Twitter',
          //       href: 'https://twitter.com/docusaurus',
          //     },
          //   ],
          // },
          // {
          //   title: 'More',
          //   items: [
          //     {
          //       label: 'Blog',
          //       to: '/blog',
          //     },
          //     {
          //       label: 'GitHub',
          //       href: 'https://github.com/facebook/docusaurus',
          //     },
          //   ],
          // },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Vincent Agriesti.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
  /*scripts: [
    {
      src: 'http://desktopvm.vinnie.work:3000/remark42.js',
      async: true,
      defer: true,
    },
  ],*/
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/crazychenz/vinnie.work/edit/trunk/website/',
        },
        blog: {
          /**
           * Path to data on filesystem relative to site dir.
           */
          path: 'blog',
          /**
           * Base url to edit your site.
           * Docusaurus will compute the final editUrl with "editUrl + relativeDocPath"
           */
          editUrl: 'https://github.com/crazychenz/vinnie.work/edit/trunk/website/',
          /**
           * For advanced cases, compute the edit url for each markdown file yourself.
           */
          //editUrl: ({ locale, blogDirPath, blogPath, permalink }) => {
          //  return `https://github.com/facebook/docusaurus/edit/master/website/${blogDirPath}/${blogPath}`;
          //},
          /**
           * Useful if you commit localized files to git.
           * When markdown files are localized, the edit url will target the localized file,
           * instead of the original unlocalized file.
           * Note: this option is ignored when editUrl is a function
           */
          editLocalizedFiles: false,
          /**
           * Blog page title for better SEO
           */
          blogTitle: 'Vinnie dot Work',
          /**
           * Blog page meta description for better SEO
           */
          blogDescription: '',
          /**
           * Number of blog post elements to show in the blog sidebar
           * 'ALL' to show all blog posts
           * 0 to disable
           */
          blogSidebarCount: 100,
          /**
           * Title of the blog sidebar
           */
          blogSidebarTitle: 'Articles',
          /**
           * URL route for the blog section of your site.
           * *DO NOT* include a trailing slash.
           */
          routeBasePath: 'blog',
          include: ['*.md', '*.mdx'],
          postsPerPage: 10,
          /**
           * Theme components used by the blog pages.
           */
          blogListComponent: '@theme/BlogListPage',
          blogPostComponent: '@theme/BlogPostPage',
          blogTagsListComponent: '@theme/BlogTagsListPage',
          blogTagsPostsComponent: '@theme/BlogTagsPostsPage',
          /**
           * Remark and Rehype plugins passed to MDX.
           */
          remarkPlugins: [
            /* require('remark-math') */
          ],
          rehypePlugins: [],
          /**
           * Custom Remark and Rehype plugins passed to MDX before
           * the default Docusaurus Remark and Rehype plugins.
           */
          beforeDefaultRemarkPlugins: [],
          beforeDefaultRehypePlugins: [],
          /**
           * Truncate marker, can be a regex or string.
           */
          truncateMarker: /<!--\s*(truncate)\s*-->/,
          /**
           * Show estimated reading time for the blog post.
           */
          showReadingTime: false,
          /**
           * Blog feed.
           * If feedOptions is undefined, no rss feed will be generated.
           */
          /*
        feedOptions: {
          type: "", // required. 'rss' | 'feed' | 'all'
          title: "", // default to siteConfig.title
          description: "", // default to  `${siteConfig.title} Blog`
          copyright: "",
          language: undefined, // possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
        },*/
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],
  plugins: [
    // [
    //   "@docusaurus/plugin-client-redirects",
    //   {
    //     redirects: [
    //       {
    //         to: "/blog", // string
    //         from: ["/"], // string | string[]
    //       },
    //     ],
    //   },
    // ],
  ],
};

module.exports = config;
