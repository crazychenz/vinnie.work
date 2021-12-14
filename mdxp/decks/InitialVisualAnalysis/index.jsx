/** @jsx jsx */
import React from 'react';
import {jsx} from 'theme-ui';
import ReactDOM from 'react-dom';
//import Deck, {Zoom} from 'mdxp/core/index.jsx';
import Deck, {Zoom} from '@mdxp/core';
import * as components from '@mdxp/components';

import theme from 'theme/theme.js';
import themeComponents from 'theme/theme-components.js';
import MDXConcat from 'components/MDXConcat.jsx'

import './index.css';
import InitialVisualAnalysis from './InitialVisualAnalysis.mdx';
import ExternalAnalysis from './ExternalAnalysis.mdx';
import HandlingHardware from './HandlingHardware.mdx';
import Disassembly from './Disassembly.mdx';
import InternalVisualInspection from './InternalVisualInspection.mdx';


//console.log(One({}));
//console.log([...One({}).props.children, ...MDXPresentation({}).props.children]);

function EntryPoint(props) {
  return (
    <Zoom
      maxWidth={1000}
      width={1000}
      aspectRatio={16 / 9}
      sx={{maxWidth: '100vw', maxHeight: '100vh'}}
    >
      <Deck
        components={{...components, ...themeComponents}}
        Layout={themeComponents.MDXPHeaderLayout}
        layoutOptions={{showSlideNum: false}}
        theme={theme}
        keyboardTarget={window}
      >
        <MDXConcat>
          <InitialVisualAnalysis />
          <ExternalAnalysis />
          <HandlingHardware />
          <Disassembly />
          <InternalVisualInspection />
        </MDXConcat>
      </Deck>
    </Zoom>
  );
}

ReactDOM.render(<EntryPoint />, document.getElementById('app'));
