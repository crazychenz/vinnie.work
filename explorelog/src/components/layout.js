import React from "react"
import { Link } from "gatsby"

//import { rhythm, scale } from "../utils/typography"

class Layout extends React.Component {
  render() {
    const { location, title, children } = this.props
    const rootPath = `${__PATH_PREFIX__}/`
    let header

    if (location.pathname === rootPath) {
      header = (
        <h1 className="text-5xl font-black font-sans mb-10 mt-0">
          <Link className="shadow-none" to={`/`}>
            {title}
          </Link>
        </h1>
      )
    } else {
      header = (
        <h3 className="text-2xl font-sans font-black mt-0">
          <Link className="shadow-none" to={`/`}>
            {title}
          </Link>
        </h3>
      )
    }
    return (
      <>
        <div style={{ ["text-align"]: "center", marginTop: 10 }}>
          <center>
            <Link to={`/`}>Home</Link>
            {"\u00A0\u00A0\u00A0\u00A0\u00A0"}|
            {"\u00A0\u00A0\u00A0\u00A0\u00A0"}
            <Link to={`/about`}>About</Link>
          </center>
        </div>
        <div className="max-w-2xl mx-auto px-5 py-10">
          <header>{header}</header>
          <main>{children}</main>
          <footer className="mt-30">
            © {new Date().getFullYear()}, Vincent Agriesti
          </footer>
        </div>
      </>
    )
  }
}

export default Layout
