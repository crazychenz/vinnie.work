require("dotenv").config()
const env = process.env

module.exports = {
  pathPrefix: "/rel",
  siteMetadata: {
    title: `Vinnie's Research & Exploration Log`,
    author: `Vinnie Agriesti`,
    description: `A simple log of discoveries and research.`,
    siteUrl: `https://rel.vinnie.work/`,
    social: { twitter: "" },
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/assets`,
        name: `assets`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 590,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          `gatsby-remark-prismjs`,
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        //trackingId: `ADD YOUR TRACKING ID HERE`,
      },
    },
    `gatsby-plugin-feed`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Vinnie's Research & Exploration Log`,
        short_name: `Vinnie REL`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#663399`,
        display: `minimal-ui`,
        icon: `content/assets/garage-from-side-512px.jpg`,
      },
    },
    `gatsby-plugin-offline`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-plugin-typography`,
      options: {
        pathToConfigModule: `src/utils/typography`,
      },
    },
    `gatsby-plugin-postcss`,
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        trackingId: env.GATSBY_GOOGLE_ANALYTICS_ID,
      },
    },
    {
      resolve: "gatsby-plugin-firebase",
      options: {
        credentials: {
          apiKey: env.GATSBY_FIREBASE_API_KEY,
          authDomain: env.GATSBY_FIREBASE_AUTH_DOMAIN,
          databaseURL: env.GATSBY_FIREBASE_DATABASE_URL,
          projectId: env.GATSBY_FIREBASE_PROJECT_ID,
          storageBucket: env.GATSBY_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: env.GATSBY_FIREBASE_MESSAGING_SENDER_ID,
          appId: env.GATSBY_FIREBASE_APP_ID,
        },
      },
    },
    "gatsby-theme-comments",
  ],
}
