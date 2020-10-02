/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react"
import { useStaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"

import { rhythm } from "../utils/typography"

const Bio = () => {
  const data = useStaticQuery(graphql`
    query BioQuery {
      avatar: file(absolutePath: { regex: "/garage-from-side-512px.jpg/" }) {
        childImageSharp {
          fixed(width: 50, height: 50) {
            ...GatsbyImageSharpFixed
          }
        }
      }
      site {
        siteMetadata {
          author
          social {
            twitter
          }
        }
      }
    }
  `)

  const { author, social } = data.site.siteMetadata
  return (
    <div className="flex mb-20">
      <Image
        className="mr-4 mb-0 rounded-md"
        fixed={data.avatar.childImageSharp.fixed}
        alt={author}
        style={{
          minWidth: 50,
        }}
      />
      <div className="flex flex-col">
        <p>
          Content created by <strong>{author}</strong>. {` `}
        </p>
        <p>
          <a style={{ color: "blue" }} href="mailto:vinnie@vinnie.work">
            vinnie@vinnie.work
          </a>
        </p>
      </div>
    </div>
  )
}

export default Bio
