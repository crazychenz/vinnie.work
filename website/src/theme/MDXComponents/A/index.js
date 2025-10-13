import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {useThemeConfig} from '@docusaurus/theme-common';
import styles from './styles.module.css';
function isFootnoteRef(props) {
  return props['data-footnote-ref'] === true;
}
function FootnoteRefLink(props) {
  const {
    navbar: {hideOnScroll},
  } = useThemeConfig();
  return (
    <Link
      {...props}
      className={clsx(
        hideOnScroll
          ? styles.footnoteRefHideOnScrollNavbar
          : styles.footnoteRefStickyNavbar,
        props.className,
      )}
    />
  );
}
export default function MDXA(props) {
  if (isFootnoteRef(props)) {
    return <FootnoteRefLink {...props} />;
  }
  return <Link {...props} />;
}
