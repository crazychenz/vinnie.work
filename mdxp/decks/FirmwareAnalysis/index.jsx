/** @jsx jsx */
import {jsx} from 'theme-ui';
import ReactDOM from 'react-dom';
import Deck, {Zoom} from '@mdxp/core';
import * as components from '@mdxp/components';

import theme from 'theme/theme.js';
import themeComponents from 'theme/theme-components.js';
import MDXConcat from 'components/MDXConcat.jsx'

import './index.css';
import FirmwareAnalysis from './FirmwareAnalysis.mdx';
import MCUArchitectures from './MCUArchitectures.mdx';
import ARM926EJS from './ARM926EJS.mdx';
import ARMCortexA72 from './ARMCortexA72.mdx';
import BareMetalBinary from './BareMetalBinary.mdx';
import Analysis from './Analysis.mdx';
import Integration from './Integration.mdx';
import ARMv5TEJBoot from './ARMv5TEJBoot.mdx';


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
          <FirmwareAnalysis />
          <MCUArchitectures />
          <ARM926EJS />
          <ARMCortexA72 />
          <BareMetalBinary />
          <Analysis />
          <Integration />
          <ARMv5TEJBoot />
        </MDXConcat>
      </Deck>
    </Zoom>
  );
}


ReactDOM.render(<EntryPoint />, document.getElementById('app'));
