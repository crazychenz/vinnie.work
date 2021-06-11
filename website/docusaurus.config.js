/** @type {import('@docusaurus/types').DocusaurusConfig} */
module.exports = {
  title: "Vinnie dot Work",
  tagline: "",
  url: "https://www.vinnie.work",
  baseUrl: "/",
  onBrokenLinks: "throw",
  onBrokenMarkdownLinks: "warn",
  favicon: "img/favicon.ico",
  organizationName: "crazychenz", // Usually your GitHub org/user name.
  projectName: "vinnie.work", // Usually your repo name.
  themeConfig: {
    navbar: {
      title: "Vinnie dot Work",
      logo: {
        alt: "My Site Logo",
        src: "img/profile.png",
      },
      items: [
        // {
        //   type: "doc",
        //   docId: "intro",
        //   position: "left",
        //   label: "Tutorial",
        // },
        { to: "/blog", label: "Blog", position: "left" },
        { to: "/about", label: "About", position: "left" },
        // {
        //   href: "https://github.com/facebook/docusaurus",
        //   label: "GitHub",
        //   position: "left",
        // },
      ],
    },
    footer: {
      style: "dark",
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
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          editUrl:
            "https://github.com/facebook/docusaurus/edit/master/website/",
        },
        blog: {
          /**
           * Path to data on filesystem relative to site dir.
           */
          path: "blog",
          /**
           * Base url to edit your site.
           * Docusaurus will compute the final editUrl with "editUrl + relativeDocPath"
           */
          editUrl:
            "https://github.com/facebook/docusaurus/edit/master/website/",
          /**
           * For advanced cases, compute the edit url for each markdown file yourself.
           */
          editUrl: ({ locale, blogDirPath, blogPath, permalink }) => {
            return `https://github.com/facebook/docusaurus/edit/master/website/${blogDirPath}/${blogPath}`;
          },
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
          blogTitle: "Blog title",
          /**
           * Blog page meta description for better SEO
           */
          blogDescription: "Blog",
          /**
           * Number of blog post elements to show in the blog sidebar
           * 'ALL' to show all blog posts
           * 0 to disable
           */
          blogSidebarCount: 100,
          /**
           * Title of the blog sidebar
           */
          blogSidebarTitle: "All our posts",
          /**
           * URL route for the blog section of your site.
           * *DO NOT* include a trailing slash.
           */
          routeBasePath: "blog",
          include: ["*.md", "*.mdx"],
          postsPerPage: 10,
          /**
           * Theme components used by the blog pages.
           */
          blogListComponent: "@theme/BlogListPage",
          blogPostComponent: "@theme/BlogPostPage",
          blogTagsListComponent: "@theme/BlogTagsListPage",
          blogTagsPostsComponent: "@theme/BlogTagsPostsPage",
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
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
  plugins: [
    [
      "@docusaurus/plugin-client-redirects",
      {
        redirects: [
          {
            to: "/blog", // string
            from: ["/"], // string | string[]
          },
        ],
      },
    ],
  ],
};
