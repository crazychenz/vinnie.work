import React from 'react';
// Import the original mapper
import MDXComponents from '@theme-original/MDXComponents';
import Giscus from '@giscus/react';

export default function Comments() {
  return (
    <Giscus
      id="comments"
      repo="crazychenz/vinnie.work"
      repoId="MDEwOlJlcG9zaXRvcnkyODA4NjUxNzg="
      category="vinnie.work Comments"
      categoryId="DIC_kwDOEL2pms4CRl9t"
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