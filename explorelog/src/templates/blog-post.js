import React, { useEffect, useState } from "react"
import { Link, graphql } from "gatsby"

import TextField from "@material-ui/core/TextField/TextField"
import Button from "@material-ui/core/Button"
import moment from "moment"

import Bio from "../components/bio"
import Layout from "../components/layout"
import SEO from "../components/seo"
import { createPostComment, readCommentPage } from "../components/firebase"

// import { rhythm, scale } from "../utils/typography"

// TODO: Comment Page needs paging, flagging, ?gravatar?, hiding.

function CommentPage({ slug }) {
  const [comments, setComments] = useState([])
  useEffect(() => {
    readCommentPage({ slug })
      .then(result => {
        console.log("Setting comments: ", result.data.comments)
        setComments(result.data.comments)
      })
      .catch(error => {
        console.log(error)
      })
  }, [slug])

  return (
    <>
      {comments &&
        comments.map(entry => {
          console.log("Entry: ", entry)
          const postDate = moment(entry.date)
          return (
            <div style={{ marginBottom: 10 }} key={entry.signature}>
              <span className="font-bold text-black-500">{entry.username}</span>
              {"  -  "}
              <span className="text-gray-700">{postDate.fromNow()}</span>
              {"  "}
              <span className="text-gray-500">
                ({postDate.format("YYYY-MM-DDTHH:mm:ss")})
              </span>
              <div>{entry.comment}</div>
            </div>
          )
        })}
    </>
  )
}

function CommentForm({ post, slug }) {
  //Spam Checking: akismet.com
  //Serverless with Firebase Functions
  //Comments stored in Firestore
  const [values, setValues] = useState({
    username: "",
    password: "",
    captcha: "",
    comment: "",
    slug: slug.slice(1, slug.length - 1),
  })

  const styles = {
    form: {
      overflow: "hidden",
      flex: 1,
      //backgroundColor: "#FFF4FF",
    },

    // label: {
    //   float: "left",
    //   width: "200px",
    //   paddingRight: "24px",
    // },

    username: {
      //float: "left",
      //width: "calc(100% - 200px)",
      width: "100%",
      flex: 1,
      //border: "1px solid #c1c1c1",
      marginTop: 5,
      padding: 5,
    },

    password: {
      //float: "left",
      //width: "calc(100% - 200px)",
      width: "100%",
      flex: 1,
      //border: "1px solid #c1c1c1",
      marginTop: 5,
      padding: 5,
    },

    captcha: {
      //float: "left",
      //width: "calc(100% - 200px)",
      width: "100%",
      flex: 1,
      //border: "1px solid #c1c1c1",
      marginTop: 5,
      padding: 5,
    },

    comment: {
      //float: "left",
      //width: "calc(100% - 200px)",
      width: "100%",
      flex: 1,
      //border: "1px solid #c1c1c1",
      marginTop: 5,
      padding: 5,
    },

    button: {
      padding: 5,
      float: "right",

      // border: "1px solid #c1c1c1",
      // borderRadius: 3,
      // marginTop: 5,
      // width: "calc(100% - 200px)",
    },
  }

  async function handleSubmit() {
    console.log("We are handling the submit: ", values)

    // Ideally, the backend of this service will require a create call and
    // an update call. The create call simply creates a blog comment entry
    // with an author alias and password hash. The update function will allow
    // the original author to modify/hide their post.

    const result = await createPostComment(values)
    console.log("Result: ", result)
  }
  return (
    <div
      style={{
        borderColor: "#CCC",
        borderWidth: 3,
        padding: 10,
        borderRadius: 10,
      }}
    >
      <form method="post" onSubmit={handleSubmit} className="overflow-hidden">
        <div className="text-2xl">Leave A Comment</div>
        <div style={styles.form}>
          <TextField
            id="username"
            label="Username / Alias / Name"
            variant="outlined"
            style={styles.username}
            onChange={evt =>
              setValues({ ...values, username: evt.target.value })
            }
          />
          <br />

          <TextField
            id="password"
            label="Password / Secret"
            variant="outlined"
            type="password"
            style={styles.password}
            onChange={evt =>
              setValues({ ...values, password: evt.target.value })
            }
          />
          <br />
          <TextField
            id="captcha"
            label={'Type "human" to verify you are a human.'}
            variant="outlined"
            style={styles.captcha}
            onChange={evt =>
              setValues({ ...values, captcha: evt.target.value })
            }
          />
          <br />
          <TextField
            id="comment"
            label="Comment"
            variant="outlined"
            style={styles.comment}
            multiline
            rows={6}
            onChange={evt =>
              setValues({ ...values, comment: evt.target.value })
            }
          />
          <br />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            style={styles.button}
          >
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}

class BlogPostTemplate extends React.Component {
  render() {
    const post = this.props.data.markdownRemark
    const siteTitle = this.props.data.site.siteMetadata.title
    const { slug, previous, next } = this.props.pageContext

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

        <CommentForm post={post} slug={slug} />
        <CommentPage slug={slug} />

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
