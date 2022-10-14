import React from 'react';
import Giscus from '@giscus/react';
import { useColorMode } from '@docusaurus/theme-common';

const { colorMode } = useColorMode();

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
      theme={colorMode}
      lang="en"
      loading="lazy"
    />
  );
}
