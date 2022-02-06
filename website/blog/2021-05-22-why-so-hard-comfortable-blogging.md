---
slug: 2021-05-22-why-so-hard-comfortable-blogging
title: 'Why so hard? Comfortable Blogging'
draft: false
---

During the 2020 plague, when I finished my graduate degree, I decided that I was going to continue writing. I found writing to be a way for me to ramble without burdening my peers. I also get the added benefit of reflection and self documentation that I've frankly been lacking in my life.

<!--truncate-->

I started a [GitHub Pages](https://pages.github.com/)/[Jekyll](https://jekyllrb.com/) based blog. I wasn't really happy with the tone of the original content that I wrote and working with the Ruby based blog generator wasn't doing me any favors. I come from a background of PHP, Perl, JavaScript, and Python and I've little incentive to learn yet another scripting language for the sole reason to host a blog.

This is when I decided that I needed to reboot the whole thing, but this time I settled on using the JavaScript based [Gatsby](https://www.gatsbyjs.com/) framework with [Netlify](https://www.netlify.com/) as the host and [GitHub](https://github.com/) as the content VCS. This is where things currently are, but it requires too much effort on my part to get the words from my head into the computer.

## What Are The Alternatives?

There are a bunch of different blogging options and I've already tried (e.g. Jekyll and Gatsby). Obviously there are services like [Ghost](https://ghost.org/) and [WordPress](https://wordpress.com/), but those have some clear downsides. In fact, I believe my perfect blogging service includes the following:

- Works out of the box.
- Revision control (preferably git).
- Very Markdown Friendly
- Multiplatform accessible.
- Easy on the eyes.

Tools like Gatsby and Jekyll give you all of this accept there is a bunch of assembly required. I am working on too many other things to have my blogging experience cluttered with distractions of widgets and gadgets, so the whole statically generated thing is beginning to put me off.

Services like Ghost and WordPress fell like an assembled out of the box solution, but because of the way they store the actual content in a database, I don't feel like I own the data. Of course I could host my own WordPress, but that is not really an out of box experience and lacks the markdown centric ecosystem I desire.

## Current State Of Things

My current blogging workflow is a little nasty. I first ensure that I have an up to date clone of my blog's git repository. I then ensure that I have the `trunk` branch checked out. The `trunk` branch is where I stage articles that I've yet to publish. Once an article is constructed and written, I commit that to trunk. I then checkout my `netlify` branch and merge the relevant changes into that branch. This branch push automatically sends off a webhook to tell Netlify to build the blog and then my new article is published. All of the writing is performed in Visual Studio code.

With the advent of the [Windows 10 Creators Update](https://blogs.windows.com/windowsexperience/2017/04/11/whats-new-in-the-windows-10-creators-update/) and WSL, I put a lot of time in learning how I can use Windows as my "window manager". By this I mean that I am primary a (Fedora/Ubuntu) Linux user. I think it goes without saying that Linux desktop environments always feel clunky and a bit plain. While they can be great, Windows always feels more slick and easy on the eyes. Therefore, despite unpopular opinion, I actually do all of my development from Windows, regardless of the target platform. If I have to jump into a RDP, VNC, or Chrome Desktop for a few minutes to setup something up, its worth doing that and then returning to my comfortable Windows 10 environment. For those old enough, the analogy I love to use is that Linux is my DOS and Windows 10 is my Windows For Workgroups.

Ok, so knowing that I use Windows as my "window manager", I put in some heavy use of Windows Terminal and Visual Studio Code's Remote SSH extension. These tools are my primary portal into my typical Linux development environment. I say this because my blog is always checked out in the Linux environment and I generally write the articles in Visual Studio Code so I can write them directly into the remote repository directory.

This same setup is used from my desktop and my laptop, allowing me to write my articles from either, so long as I have a connection to my primary Linux host. When I don't have access to my primary Linux host, I have to once again do the `git clone` thing to my laptop to perform all of the synchronization. Ugh!

Several issues I have with this approach:

- I don't want to think about revision control to start writing an article.
- I just want to write and in a way that is non-distracting. Visual Studio Code is a _very_ distracting application.
- Staging articles in trunk feels like an unnecessary extra step. If I am writing a paper that may change a lot over time, this would be a nice feature, but the blog posts are more of a spew of information at that time and therefore don't really need version control during their creation.

## My Temporary Solution

Today, I feel like I've found an acceptable work around solution. The general idea is to identify an ideal markdown editor and an ideal file sharing service. The task of blogging is then dividing into two loosely coupled steps. The first is writing the article, distraction free. The second is to then publish the articles without concern for writing any more content.

More tangibly, I intent to:

- Write all the content with [Typora](https://typora.io/).
- Sync all the content between my laptop and desktop with [Google Drive](https://www.google.com/drive/download/).

I've chosen these for my own reasons, but obviously the markdown editor and backend file sharing can be replaced by any number of other services.

Other Backend Services:

- [Dropbox](https://www.dropbox.com/?_hp=b&landing=dbv2)
- [SSHFS-Win32](https://github.com/billziss-gh/sshfs-win) (self-hosted)
- [ownCloud](https://owncloud.com/) (self-hosted)
- [NextCloud](https://nextcloud.com/) (self-hosted)

When I am not in a writing mood or when I am in more of an administrative and email checking mood, I can then opt to simply copy and commit/push my Google Drive content directly to my `netlify` branch for publication. This also has the additional benefit of still being backed up but without the complexity associated with git's version control.

## Google Drive Configuration

One of the things I hate about services like Google Drive is their assumption that I want to always backup and synchronize everything. I do some ridiculous things on my computer that would fill cloud space in as much time as it would take to upload. **No good!** Therefore I've configured my Google Drive for Desktop to perform _No Backups_ and to only synchronize a single `journal` folder.

When setting up Google Drive for synchronization with a select set of folders, you'll need to perform several steps first:

- Put all loose top-level files in a folder. I dropped all of mine in a `clutter` folder. This is because even though I told Google Drive to only synchronize the `journal` folder, it decided that this meant only the selected folders AND all the top-level files. **Ugh!**
- You'll then want to create a place where all of the Google Drive folders will synchronize. You can think of this as the google drive namespace. I simply chose to put it in my Documents folder as `google-drive`.
- Once the above two steps are complete you can set the Google Drive Desktop application to start to synchronize the `journal` folder.

After everything is setup and synchronizing, simply fire up the Typora Markdown Editor and stream your consciousness.

## Typora Setup

While I love Typora out of the box, "it can be better!" The one thing I've done to improve my Typora experience is to install the [Fluent theme](https://github.com/HereIsLz/Fluent-Typora). This requires dropping three CSS files into the Typora themes directory and installing two fonts: [Inter](https://github.com/rsms/inter/) & [JetBrainsMono](https://www.jetbrains.com/lp/mono/).

The Fluent theme is pretty, comes with dark mode and light mode.

Note: My version of dark fluent had a black cursor/caret. You can fix that by dropping the following in the bottom of the fluent-dark.css file:

```css
.CodeMirror div.CodeMirror-cursor {
  border-left: 1px solid #b8bfc6;
  z-index: 3;
}
```

## Conclusion

In a perfect world, my blog service would have:

- All content revision controlled with GitHub.
- All content formatted with Markdown.
- All content presented with maximum accessibility but easy on the eyes.
- All content modifiable via Text Editor or a WYSIWYG editor like Typora from the web.
- No assembly required.

But this is the real world, so this'll have to do for now.

## Updates

Since originally writing this article, I've also found several other interesting setups with their own spin:

- [Docusaurus](https://docusaurus.io/) - Documentation (in contrast to blog) focused markdown site generator.
- [Gitbook](https://www.gitbook.com/) - An inbrowser WYSIWYG editor based on markdown.
- [Gitalk](https://gitalk.github.io/) - Component design that allows using github issue API as a comment database.

## Comments

<iframe src="/comment-iframe.html" height="1024" width="100%" onLoad=""></iframe>
