---
slug: 2021-12-03-managing-slides-with-mdx
title: 'Managing Slides With MDX'
draft: false
---

To go along with the Embedded Systems Analysis material I've been developing, I wanted to have slide decks for each section. I originally started writing the material in markdown as a way to enforce more accessibility. Using something like PPT would betray that notion and so I began to look at other options...

<!--truncate-->

There are two options for presentations that I was willing to entertain:

- A Godot based presenter - Godot is a game engine that is very simple to use. While capable of running games, it also has the potential to be an incredibly powerful cross platform presenter tool as well. The output can be built to run on iOS, Android, Windows, Linux, and HTML5. _I did go this route for a few days, but then ultimately came to the conclusion that a javascript solution was likely less effort._ That said, Godot remains a very useful tool for interactive elements that can be embedded into slides.

- A Javascript based presenter - With tools like Markdown, JSX, Webpack, and React there is bound to be some ready made slide presenter tools and libraries on the net. Sure enough there are quite a few. Scott Spence has a nice write up on some of the tools he took a look at in his [Making Presentations with MDX](https://scottspence.com/posts/making-mdx-presentations) article.

## MDX Background

Markdown (MD) is a markup language for plain text documents, parsed with Remark in our case. Javascript (JS) is a family of scripting languages built directly into browsers and server side runtime environments like NodeJS. JSX is a language that combines HTML and Javascript that is then compiled into javascript with React. MDX is a combination of JSX and MD, where Markdown is permitted to have HTML and Javascript embedded directly within it. These MDX source files are then compiled into CJS.

In summary, MDX is compiled with React and Remark into CJS and HTML that can be rendered by browsers.

## Investigation

From the demos that I browsed on the net, the following two libraries are the tools I decided to take a close look at:

- [mdx-deck](https://github.com/jxnblk/mdx-deck)
- [mdxp](https://0phoff.github.io/MDXP)

### mdx-deck

Based on the amazing work done by Sam Larsen-Disney ([sld.codes](https://sld.codes/)), I thought for sure whatever he did would be good enough for my needs. I hunted down the [code for his website](https://github.com/slarsendisney/personal-site) on github. Now, its Dec 2021 and the latest LTS node is v16. Turns out that a lot of the tools that are used these days just aren't ready for the _current_ generation of node.

After a bunch of build issues with Sam's personal site code, I stepped back to build a `mdx-deck` from scratch. There are several ways to accomplish this.

- You can create a `mdx-deck` presentation from scratch, as seen in [Create developer presentations with MDX Deck - Part 1](https://marioyepes.com/mdx-deck-developer-presentations-part-1/)
- You can grab an old version of gatsby (~2.x) and install the `gatsby-theme-mdx-deck`.
- You can grab an mdx-deck example from their [examples repo](https://github.com/jxnblk/mdx-deck/tree/master/examples) and build in-place.
- You can also grab a gatsby starter (e.g. [gatsby-stater-deck](https://github.com/fabe/gatsby-starter-deck))

I'm sure in 2019, all of these options were great and worked flawlessly. But as mentioned before they have all fell out of maintenance over the past ~18 months and therefore don't work with moderns tools. I was able to get them working to a degree, but I was really upset with how out of date the documentation was and didn't have as much patience to reverse engineer behaviors.

### MDXP

MDXP appears to be another great flavor of mdx-deck, but due to the authors experience with conference constraints, had made a design decision to develop single HTML presentations. This eliminates the need to have a server running on a conference laptop (something often required when using Javascript presentations with Chrome.)

I may have missed this feature from `mdx-deck`, but MDXP has a presenter mode that allows a presenter to open a slide with a preview of the next slide and notes for the current slide. The way this presenter mode works is that if you have say, a chrome window with presenter mode and a chrome window with _normal_ mode... when you switch slides on one, it automatically synchs the others. Therefore, you can full screen a Chrome window for audience viewing and keep a presenter tab available for your private presenter monitor.

MDXP also has seemed to falling out of maintenance, but this time only by ~14 months. I basically grabbed the [demo code](https://github.com/0phoff/MDXP/tree/master/examples/demo) and was able to build it, albeit with a gazillion warnings.

## Improving MDXP

OK, so I was able to successfully build both mdx-deck and MDXP and they both have their issues, but I decided to invest some time in MDXP because it seemed more recently maintained, documentation was more thorough and update to date. Also, the presentation mode really struck me as fancy.

Things that needed to be updated ASAP...

### Updating Packages

Unmaintained javascript packages and dependencies are going to be the bane of computer security for a long time to come. Not to mention the new wiz-bang features are harder to integrate the longer a project remains unmaintained.

At the time of this writing, these are the packages that I updated:

```text
@mdx-js/loader from          ^1.5.9  to ^1.6
react-dev-utils from         ^10.2.1 to ^11
webpack from                 ^4.44.2 to ^5
webpack-bundle-analyzer from ^3.9.0  to ^4
webpack-cli from             ^3.3.12 to ^4
webpack-dev-server from      ^3.11.0 to ^4
webpackbar from              ^4.0.0  to ^5
```

This in turn lead me to removing the `@svgr/webpack` and all references to SVGs in the presentations. I don't use SVGs often so this didn't phase me, but I would like to re-integrate SVG support eventually. _The issue had to do with the way webpack saw some of the SVGs as being exported as default multiple times._

I also had to patch the webpack.config.js so that at line ~175:

```javascript
node: {
  fs: 'empty';
}
```

was replaced with:

```javascript
resolve: {
  fallback: {
    fs: false;
  }
}
```

I also attempted to upgrade the remark packages, but there were way to many errors for me to deal with at this time. _That'll likely be a part 2 to this effort if revisited._

### Supporting Multiple Presentations

Unless you're using a gatsby integration, both the `mdx-deck` project and the MDXP projects both create a single presentation per `node_modules` folder (which we all know become ridiculous in size very quickly.)

In the multi-presentation design I used:

- I created a top-level `decks` folder (outside of the `src`) folder. Within, there are folders named for the deck files they hold, (e.g. `index.html`, `index.css`, `index.jsx`, and `mdx` files).

- Of course, _reusable_ react components and layouts are kept in the `src` folder.

- The `dist` or output folder now also has folder named after the `decks` folder name. Within this folder you'll find outputs for `onepage`, `web`, and `pdf`.

- The way I selected a deck is through a cross-env environment variable that was then loaded by `webpack.config.js` (similar to the way the original author passed their arguments).

Originally the way the builds were occurring in MDXP had a long string of commands being run as `package.json` scripts. To better parameterize the `deck` selection, I created a [`build.js`](https://github.com/crazychenz/vinnie.work/blob/4fc6282aa24b72201fd9215a7921c1c898ed4ef2/mdxp/build.js) script that ran the same commands, but now with my `deck` option and argument parsing with `yargs`. This script could be written without the need for `spawn`, but I'm really just trying to get a _thing_ done, not attempting to maintain a library at the moment. Note: `build.js` assumes you are using `yarn`.

Now when I build with, for example `yarn build:onepage --deck test-deck`, it'll source my presentation from `./decks/test-deck/` and output the results into `./dist/test-deck/onepage/`.

## Implementation

For more details on the implementation specifics, feel free to browse the `mdxp` multi-presentation [code on github](https://github.com/crazychenz/vinnie.work/tree/4fc6282aa24b72201fd9215a7921c1c898ed4ef2/mdxp).

## Wish List Items

- Pull requests for MDXP that include support for Node 16.
- Pull requests for MDXP that include multi-presentation support.
- Remote synchronization of presentation similar to [sld-clicker](https://github.com/slarsendisney/sld-clicker).
- SVG support re-integrated.

## Resources

- [Making Presentations with MDX](https://scottspence.com/posts/making-mdx-presentations)
- [Sam Larsen-Disney - Presentations](https://sld.codes/presentations)
- [MDX Deck Demo](https://mdx-deck.jxnblk.com/)
- [MDXP Demo](https://0phoff.github.io/MDXP/examples/demo/#/normal/0/1)

## Comments

<Comments />
