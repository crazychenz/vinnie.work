import React from 'react';
import Layout from '@theme-original/DocItem/Layout';
import { useDoc } from '@docusaurus/theme-common/internal';

/*
  Created with `npm run swizzle @docusaurus/theme-classic DocItem/Layout -- --wrap`
*/

export default function LayoutWrapper(props) {
  const doc = useDoc();
  return (
    <div class={doc.frontMatter.full_width ? '' : 'container'}>
      <Layout {...props} />
    </div>
  );
}
