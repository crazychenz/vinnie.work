---
slug: 2021-06-11-blog-engine-take-3
title: 'Blog Engine ... Take 3'
draft: false
---

If you've read any of this blog before June 2021, you'll notice something things have changed. This is because I've moved everything to a new blog engine, Docusaurus.

When I first started writing blog articles I felt like I was learning a lot of new topics every week and I had a lot of follow up thoughts and opinions on the subject. I felt this flood of information made for good material that had a good mix of something new and opinions on the subject. In contrast, more often through out my life I have an abundance of opinion or knowledge but not a mix of the two.

<!--truncate-->

For example, I can go weeks where all I have to write about is "I did a thing". And then occasionally write up a piece on why I think X is a dead end technology without any actual background knowledge of the subject. Both of these feel week as an article, but should be captured and encouraged for the sake of reflection and posterity. This is after all the purpose of a developer journal.

## The Notebook Idea

The original theme of my first blog in early 2020 was the idea that I would start a developer diary and generate a portfolio of work to showcase. For several unrelated reasons, I dropped that format in favor of a blog only site. Since then, I've found that in those moments where I just want to capture a piece of information, I want a place to put that and maintain it without having to update or go back to a blog post that most other readers will only ever read once.

The solution to this is to create a notebook of sorts. The idea is that "I did a thing" information can be captured in a note taking pattern and evolved overtime as I learn new patterns and bits of information. This isn't just notes, but manuals for myself, my interactions, and the actions that I perform on or within various systems.

While the notebook is a living document that evolves over time, the blog can remain a place for event based things to write about. Perhaps I update something in the notebook, I can then write a blog post about what my thought process and feelings were at the time of that update.

## DocFX, Close but No

One of the blog sites that I started to favor over all of the others was the [docs.microsoft.com](https://docs.microsoft.com) content management system. There were a few things that I really liked about it above a lot of other sites. Features I liked included:

- An _Edit Page_ link
- Tabs in markdown
- Table of contents
- And the simple and focused presentation.

When I went looking for the actual blog engine that Microsoft uses, I found that its open sourced and is called [DocFX](https://dotnet.github.io/docfx/). Not surprisingly, its based on .Net. I went ahead and developed a Docker container for it and built a test site.

Here is the relevant part of the `Dockerfile` to install DocFX and its dependencies:

```dockerfile
RUN apt install -y \
    dirmngr \
    gnupg \
    apt-transport-https \
    ca-certificates \
    software-properties-common

RUN apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF
RUN apt-add-repository 'deb https://download.mono-project.com/repo/ubuntu stable-focal main'
RUN apt-get update && apt-get install -y mono-complete

RUN apt-get install -y unzip
ADD imports/docfx.zip /root/docfx.zip
RUN mkdir /opt/docfx
WORKDIR /opt/docfx
RUN unzip /root/docfx.zip ; chmod +x docfx.exe
ENV PATH="/opt/docfx:${PATH}"
```

Compared to the production Microsoft site, it was **bare bones**. It technically had all the widgets I was looking for but lacked any kind of clean design feel or decent navigability. Since the actual content of the Microsoft site was also hosted openly on github.com I tried to see if I could snag their theme. Turns out that this was not a published part of the system. There was even a github issue filed asking for the theme and someone from Microsoft explicitly explaining that there were no intentions to publish their theme.

## Docusaurus

Upset that I had gotten close to getting a much better blog engine, I decided to take another look at all the static site generators that were listed on [JAMstack's Generators Page](https://jamstack.org/generators/). Some of the hard to measure aspects of selecting any product is something that feels right as well as knowing it has community and vendor support. The last thing I want is to support the product myself. I just want to get words from my head onto the page.

An engine that continually caught my eye was the [Docusaurus](https://docusaurus.io/) generator's showcase. It wasn't because it was flashy, fancy, or exotic. Quite the opposite, Docusaurus sites seemed to be consistent, simple, and focused on _documentation_. I was hesitant to try it until I found out that it came with a vendor provided blogging capability. (Btw, the vendor is Facebook. Yep, the maintainer of React.)

I also generated a `Dockerfile` for this system as well. Initially I screwed up by grabbing the old v1 of Docusaurus from Dockerhub. This was vastly inferior to what I was viewing on JAMstack. Hence I started my own Docusaurus docker image from scratch. The relevant parts of the `Dockerfile` required to install Docusaurus and its dependencies is:

```dockerfile
RUN apt-get install -y \
    build-essential

RUN curl -sL https://deb.nodesource.com/setup_14.x  | bash -
RUN apt-get install -y nodejs

RUN npm install -g @docusaurus/init yarn
```

Similar to DocFX, there was an init script to generate a skeleton website and then you tweak from there. To create the skeleton directory structure in a the current directory (under a subdirectory named `website`) with the Docusaurus classic theme, run the following command:

```sh
docusaurus-init init website classic
```

Right off the bat, the site felt more complete and the user configuration felt more straight forward and easy to use than what I was familiar with Gatsby. After a little more experimentation, I found that the user experience was more simple at the cost of being less flexible. Most of the noise that I would have found in Gatsby and other blog engines was squirreled away in `node_modules` instead of sprawled out over the specific site's source code. The website really did only contain the minimal React components needed to express the site and not the mechanics of the site.

Right, long story short, I liked this and deemed it worth the effort to try in production.

## Search Engine

One of the fears I had with performing such a large transition from one blog engine to another this time around was that I had put some effort into getting my Google recognition up on a blog for the first time. This meant that I was going to have to figure out what to do about sitemaps and redirection in regards to the search engines.

Turns out its not that big of a deal for a small site like mine. I basically captured the roughly 50 articles that I had from my old site and created redirection links from each post to the new links in a `_redirects` file. This file is specified by [Netlify](https://netlify.com) (my host) as the way to generate 301 redirection links. I additionally implemented client side redirection in Javascript if for some reason I forget or the redirection links don't work. (Although you _really_ need the 301's to work for the search engine's sake.)

Finally, I captured my old (Gatsby auto-generated) `sitemap.xml`. Referencing this in the `robots.txt` along side the new Docusaurus `sitemap.xml` and uploading it explicitly to the Google search engine will help google find the 301 redirection links faster. The recommendations that I've found online is that after 6 months I should remove the old sitemap.

So this is great, a transition strategy for my site and search engine results.

## Results

So far I actually have no real results beyond my local testing and initial deployment. This is the first article that I'm writing for the new system. I hope to soon start filling out the notes section as well. There is a `tips and tricks` markdown file I've been kicking around for awhile that I don't know what to do with.

All in all, I have some big plans for Docusaurus outside of my little blog site and hope that it continues to improve. The next things to try out are the Google Analytics plugins and possibly a [Gitalk](https://github.com/gitalk/gitalk) plugin for _free-ish_ comment integration.
