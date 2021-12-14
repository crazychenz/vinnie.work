import React from 'react';
import Empty from 'components/empty.mdx';

export default function MDXConcat({children}) {
    console.log(children);
    const allMDXChildren = [];
    React.Children.toArray(children).forEach(component => {
      const mdxContent = component.type({});
      const mdxContentChildren = React.Children.toArray(mdxContent.props.children);
      var hr = React.Children.toArray(Empty({}).props.children)[0];
      mdxContentChildren.map((child, idx) => {
        //if (hr === null && child.props.originalType === 'hr') hr = child;
        if ((idx == 0 || idx == mdxContentChildren.length - 1) && child.props.originalType === 'hr') return;
        allMDXChildren.push(child);
      })
      allMDXChildren.push(hr);
  
      // TODO: Inject 'hr' between sets of children if not already there.
      //allMDXChildren.push(...mdxContentChildren);
    });
    console.log(allMDXChildren);
    const retElem = React.cloneElement(Empty({}), null, allMDXChildren);
    console.log(retElem);
    return retElem;
  }