import React, { useState } from "react"
import { Link, graphql } from "gatsby"

import Bio from "../components/bio"
import Layout from "../components/layout"
import SEO from "../components/seo"
//import { rhythm, scale } from "../utils/typography"

function CommentForm({ post }) {
  //Spam Checking: akismet.com
  //Serverless with Firebase Functions
  //Comments stored in Firestore
  const [values, setValues] = useState({
    name: "",
    email: "",
    comment: "",
  })

  const styles = {
    form: {
      overflow: "hidden",
    },

    label: {
      float: "left",
      width: "200px",
      paddingRight: "24px",
    },

    input: {
      float: "left",
      width: "calc(100% - 200px)",
      border: "1px solid #c1c1c1",
      marginTop: 5,
    },

    button: {
      padding: 5,
      float: "right",
      border: "1px solid #c1c1c1",
      borderRadius: 3,
      marginTop: 5,
      //width: "calc(100% - 200px)",
    },
  }

  function handleSubmit() {
    console.log("We are handling the submit: ", values)
  }
  return (
    <form
      style={styles.form}
      method="post"
      onSubmit={handleSubmit}
      className="overflow-hidden"
    >
      <label style={styles.label} for="name" class="name">
        Name
      </label>
      <input
        style={styles.input}
        type="text"
        value={values.name}
        onChange={evt => setValues({ ...values, name: evt.target.value })}
      />
      <br />

      <label style={styles.label} for="email" class="email">
        E-Mail (for gravatar)
      </label>
      <input
        style={styles.input}
        type="text"
        value={values.email}
        onChange={evt => setValues({ ...values, email: evt.target.value })}
      />
      <br />

      <label style={styles.label} for="comment" class="comment">
        Comment
      </label>
      <textarea
        style={styles.input}
        value={values.comment}
        onChange={evt => setValues({ ...values, comment: evt.target.value })}
      />
      <br />

      <input
        style={styles.button}
        type="button"
        value="Submit"
        onClick={handleSubmit}
      />
      <pre>{post ? post.id : ""}</pre>
    </form>
  )
}

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark
    const siteTitle = this.props.data.site.siteMetadata.title
    const { previous, next } = this.props.pageContext

    return (
      <Layout location={this.props.location} title={siteTitle}>
        <SEO
          title={post.frontmatter.title}
          description={post.frontmatter.description || post.excerpt}
        />
        <article>
          <header>
            <h1 className="text-5xl font-black mt-8 mb-0">
              {post.frontmatter.title}
            </h1>
            <p className="text-sm leading-loose mb-8 ">
              {post.frontmatter.date}
            </p>
          </header>
          <section
            className="markdown"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
          <hr className="h-px mb-8" />
          <footer>
            <Bio />
          </footer>
        </article>

        <nav>
          <ul
            className="flex flex-wrap justify-between mb-8"
            // style={{
            //   display: `flex`,
            //   flexWrap: `wrap`,
            //   justifyContent: `space-between`,
            //   listStyle: `none`,
            //   padding: 0,
            // }}
          >
            <li>
              {previous && (
                <Link
                  className="text-blue-600"
                  to={previous.fields.slug}
                  rel="prev"
                >
                  ← {previous.frontmatter.title}
                </Link>
              )}
            </li>
            <li>
              {next && (
                <Link
                  className="text-blue-600"
                  to={next.fields.slug}
                  rel="next"
                >
                  {next.frontmatter.title} →
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </Layout>
    )
  }
}

export default BlogPostTemplate

export const pageQuery = graphql`
  query BlogPostBySlug($slug: String!) {
    site {
      siteMetadata {
        title
      }
    }
    markdownRemark(fields: { slug: { eq: $slug } }) {
      id
      excerpt(pruneLength: 160)
      html
      frontmatter {
        title
        date(formatString: "MMMM DD, YYYY")
        description
      }
    }
  }
`
