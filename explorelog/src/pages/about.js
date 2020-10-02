import React from "react"
import { Link, useStaticQuery, graphql } from "gatsby"
import Image from "gatsby-image"
import { useImage } from "react-image"

import { InlineIcon } from "@iconify/react"
// npm install --save-dev @iconify/react @iconify/icons-mdi

//import githubIcon from "@iconify/icons-mdi/github"
//import linkedinIcon from "@iconify/icons-mdi/linkedin"
//import stackOverflow from "@iconify/icons-mdi/stack-overflow"

import githubIcon from "../../content/assets/GitHub-Mark-120px-plus.png"
import linkedinIcon from "../../content/assets/LI-In-Bug.png"
import stackOverflow from "../../content/assets/so-icon.png"

import Layout from "../components/layout"

export default function AboutPage(props) {
  const bio = useStaticQuery(graphql`
    query BioQuery2 {
      avatar: file(absolutePath: { regex: "/garage-from-side-512px.jpg/" }) {
        childImageSharp {
          fixed(width: 512, height: 555) {
            ...GatsbyImageSharpFixed
          }
        }
      }
      site {
        siteMetadata {
          author
        }
      }
    }
  `)

  const icon_width = 60
  const icon_height = 60
  //const { soIcon } = useImage({
  //  srcList: "content/assets/so-icon.png",
  //})
  return (
    <Layout location={props.location} title={"About Me"}>
      <br />

      <div className="flex flex-row">
        <Image
          className="inline-block object-contain mr-6 mb-0 rounded-lg"
          fixed={bio.avatar.childImageSharp.fixed}
          alt={bio.site.author}
          style={{
            minWidth: 50,
            minHeight: 54,
            width: 256,
            height: 278,
          }}
        />
        <div className="flex flex-col">
          <a href="https://github.com/crazychenz">
            <img
              style={{ margin: 10, width: 60 }}
              src={githubIcon}
              alt="github"
            />
          </a>
          <a href="https://www.linkedin.com/in/vincent-agriesti-267aa21ab/">
            <img
              style={{ margin: 10, width: 60 }}
              src={linkedinIcon}
              alt="linkedin"
            />
          </a>
          <a href="https://stackoverflow.com/users/71865/crazy-chenz">
            <img
              style={{ width: 80 }}
              src={stackOverflow}
              alt="Stackoverflow"
            />
          </a>
        </div>
      </div>
      <div className="flex flex-col">
        <p>Vinnie Agriesti</p>
        <p>
          <a style={{ color: "blue" }} href="mailto:vinnie@vinnie.work">
            vinnie@vinnie.work
          </a>
        </p>
      </div>

      <h2 className="text-2xl font-sans font-black mt-10 mb-6">Welcome</h2>
      <p>
        Greetings!, My name is Vincent Agriesti but I generally go by Vinnie. I
        am an engineer, teacher, and founder. I'm excited about creating
        software and applications for custom hardware, kernels, embedded
        systems, backend services, frontend GUIs, and games. This site is where
        I showcase discoveries, thoughts on various topics, and my general
        interest in creating things.
      </p>
      <h2 className="text-2xl font-sans font-black mt-10 mb-6">Background</h2>
      <p>
        I've been learning the craft of software development since 1995. I
        started out by doing neighborhood IT support and application development
        for my friends, family, and school system as a teenager. I got my first
        professional experience as an employee of the US Naval Academy in 2003.
        There I would develop and maintain their backend automation for their IT
        department. In 2008, I moved from USNA to other US Gov't Command Centers
        where I primarily did Linux Kernel C development for commercial security
        solutions and and custom GOTS hardware solutions.
      </p>
      <h2 className="text-2xl font-sans font-black mt-10 mb-6">
        Current Job Responsibilities
      </h2>
      <p>
        Technical Lead of organizational teams responsible for the integration
        of technologies into deployable products and the development/maintenance
        of the software development kit used to develop systems for use on all
        deployed hardware.
      </p>
      <ul className="list-disc ml-8 mt-8">
        <li>
          <span className="font-bold">Software Engineering</span> - Development
          of system designs and concept of operations to solve customer problems
          and gaps. Development of C, C++, Python, code to satisfy objectives.
          Mentorship of intern on software engineering.
        </li>
        <li>
          <span className="font-bold">Systems Engineering</span> - Develop
          implementation vision and design for to-be capabilities. Review
          products of direct reports including code, documentation, CONOPs,
          requirements, and test plans. Discovery of stakeholders and work
          directly with customers to determine requirements.
        </li>
        <li>
          <span className="font-bold">Scrum Lead</span>- Prioritization and
          delegation of operational development business cases and requirements
          handed down from leadership.
        </li>
        <li>
          <span className="font-bold">Technical Lead</span> - Coordinating with
          the section team leads to prioritize and schedule strategic
          development across all organizational product lines.
        </li>
      </ul>
      <h2 className="text-2xl font-sans font-black mt-10 mb-6">
        Experience Summary
      </h2>
      <p>TBD</p>
      <h2 className="text-2xl font-sans font-black mt-10 mb-6">
        Past Positions
      </h2>
      <ul className="list-disc ml-8 mt-8">
        <li>
          <span className="font-bold">Founder and Technical Lead</span>, Player
          First Studios LLC (2020-present)
        </li>
        <li>
          <span className="font-bold">Capability Development Specialist</span>,
          Department Of Defense (2014-present)
        </li>
        <li>
          <span className="font-bold">
            Intern for Computer Network Operations
          </span>
          , Department Of Defense (2011-2014)
        </li>
        <li>
          <span className="font-bold">Information Security Designer</span>,
          Department Of Defense (2008-2011)
        </li>
        <li>
          <span className="font-bold">IT Support and Systems Developer</span>,
          US Naval Academy (2003-2008)
        </li>
        <li>
          <span className="font-bold">Web Development</span>, Free Lance (2005)
        </li>
        <li>
          <span className="font-bold">IT Support</span>, Bignell Watkins Hasser
          (2007)
        </li>
      </ul>
      <h2 className="text-2xl font-sans font-black mt-10 mb-6">
        Education / Training
      </h2>
      <ul className="list-disc ml-8">
        <li>MS in Information Systems Engineering from JHU 2020</li>
        <li>BS in Information Systems from UMUC 2008 (aka UMGC)</li>
        <li>AA in General Studies from AACC 2004</li>
        <li>Adjunct Intructor at National Cryptologic School</li>
      </ul>
    </Layout>
  )
}
