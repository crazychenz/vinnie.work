---
slug: 2022-09-23-adfree-blog-comments-giscus
title: 'Ad-free Blog Comments? Giscus!'
draft: false
---

## Background

I've been running this blog since the beginning of 2020 in one manner or another. The largest gap and travesty that I've left unattended is the fact that there is no chat capability built in. About 6 months ago I did try to implement my own thing with a DigitalOcean droplet and a postgres database. It didn't work well and involved nasty iframes in my React app. I just didn't have the time to invest.

With the now fully released Docusaurus 2.x (the engine this blog is currently using), I decided to see if there were any new options for comment integration. With minimal forum reading I came across a GitHub app called [Giscus](https://giscus.app/), and it was exactly what I wanted!

<!-- truncate -->

## Overview

Github has a feature of repositories called Discussions. Discussions are basically the same thing as a forum thread, but they are organized the same as a GitHub issue. Giscus uses the Github API to create and update discussions from a webpage comment.

## Initial Integration

In regards to Docusaurus, to get Giscus working I needed to:

- Enabled the discussions feature in the repository settings.
- Install the app into the blog repository.
- Optionally added a discussion category specifically for the blog comments.
- Installed the giscus react component into my blog node environment.

  ```sh
  yarn add @giscus/react
  ```

- Created an `2022-09-23-test-comments.mdx` (note the MDX) entry to give it a whirl.

  ```mdx
  ---
  slug: 2022-09-23-test-comments
  title: 'Test Comments'
  draft: false
  ---

  import Giscus from '@giscus/react';

  ... content here ...

  ## Comments

  <Giscus
    id="comments"
    repo="crazychenz/vinnie.work"
    repoId="[repo id]"
    category="vinnie.work Comments"
    categoryId="[category id]"
    mapping="pathname"
    term="Comments"
    reactionsEnabled="1"
    emitMetadata="0"
    inputPosition="top"
    theme="preferred_color_scheme"
    lang="en"
    loading="lazy"
  />
  ```

Woot! It worked.

## Cleaner Integration

Now, there are 2 issues with the above implementation I'd like to correct. The first is that I don't want to use MDX everytime I want to allow users to leave comments. The second is that I don't want to have such an extensive array of options in every article. If I were to ever change one, I'd need to go back and update it in every article, uck!

Luckily, both of these issues are resolved with a single swizzle of the MDXComponents in Docusaurus. Now, there appears to be some conflict of how and when to swizzle MDXComponents in the documentation. If you use the CLI to swizzle, Docusaurus will just tell you that MDXComponents is not only unsafe to swizzle, its outright forbidden. It is my belief this is because the developers believed that you shouldn't introduce new unpredictable behaviors in the component due to possible future changes. That said, its likely safe enough to add components to a MDXComponents wrapper (presuming there is no future namespace collision). You can see the [documentation for swizzling MDXComponents manually here](https://docusaurus.io/docs/markdown-features/react).

In regards to Giscus, I created a `src/theme/MDXComponents/index.js` with the following:

```js
import React from 'react';
// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents';
import Comments from '@site/src/components/Comments';

export default {
  // Re-use the default mapping
  ...MDXComponents,
  Comments,
};
```

Notice that I've added a `Comments` components to the `MDXComponents`. This'll allow me to add a `<Comments />` tag to any Markdown rendered by Docusaurus and it'll include whatever is returned by that component.

The `Comments` component is defined in `src/components/Comments/index.js` as:

```js
import React from 'react';
import Giscus from '@giscus/react';

export default function Comments() {
  return (
    <Giscus
      id="comments"
      repo="crazychenz/vinnie.work"
      repoId="[repo id]"
      category="vinnie.work Comments"
      categoryId="[category id]"
      mapping="pathname"
      term="Comments"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="top"
      theme="preferred_color_scheme"
      lang="en"
      loading="lazy"
    />
  );
}
```

This gives us a single location to manage all of our comments from. In theory, I could completely replace this with another chat mechanism in the future if I decided to move away from giscus.

To show the difference in Markdown from the original MDX example shown above, suppose I had `2022-09-23-test-comments.md` (note the MD and not MDX):

```md
---
slug: 2022-09-23-test-comments
title: 'Test Comments'
draft: false
---

... content here ...

## Comments

<Comments />
```

## Remaining Issues

Even though Giscus has been a great option for a comment solution, it does lack a few things. For one it doesn't have a CAPTCHA to prevent advertizers or other annoying automated messaging. I can only hope that the required GitHub login makes that a non-issue.

The other issue I've noticed that I'll have to troubleshoot another time is the fact that the colors of the comments dont seem to match the dark/light settings of the page they are within. Docusaurus has a dark/light switch and It'd be swell if the `@giscus/react` component could react to this setting.

## Resources

- [Giscus App](https://giscus.app/)
- [Giscus App Source](https://github.com/giscus/giscus)
- [Giscus Component Source](https://github.com/giscus/giscus-component)
- [Forum discussion about comment options in Docusaurus](https://docusaurus.io/feature-requests/p/comments-in-documents-or-blogs)

Some examples in the wild that I took from to make all this work:

- [Comp-Labs post MDX source with Giscus component](https://raw.githubusercontent.com/Comp-Labs/comp-labs-website/896afc72cb39ef5f5cf1f8d2a119e0d14be3dd65/blog/posts/implement-active-directory-in-windows-server-2022-4.mdx)
- [Comp-Labs MDXComponents Source](https://github.com/Comp-Labs/comp-labs-website/blob/main/src/theme/MDXComponents.js)
- [Comp-Labs Blog](https://complabs.in/blog/posts/install-macos-ventura-on-windows-using-virtualbox#comments)
- [Comp-Labs Docusaurus Config](https://github.com/Comp-Labs/comp-labs-website/blob/main/docusaurus.config.js)

## Comments

<Comments />
