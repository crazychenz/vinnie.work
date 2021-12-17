/** @jsx jsx */
import {jsx} from 'theme-ui';
import ReactDOM from 'react-dom';
import Deck, {Zoom} from '@mdxp/core';
import * as components from '@mdxp/components';

import theme from 'theme/theme.js';
import themeComponents from 'theme/theme-components.js';
import MDXConcat from 'components/MDXConcat.jsx'

import './index.css';
import HardwareAnalysis from './HardwareAnalysis.mdx';
import Power from './Power.mdx';
import DigitalSignals from './DigitalSignals.mdx';
import SerialAccess from './SerialAccess.mdx';
import PracticalEE from './PracticalEE.mdx';
import DigitalLogic from './DigitalLogic.mdx';
import I2C from './I2C.mdx';
import Memories from './Memories.mdx';
import PinConfiguration from './PinConfiguration.mdx';
import SPI from './SPI.mdx';
import JTAG from './JTAG.mdx';
import OpenOCD from './OpenOCD.mdx';


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
          <HardwareAnalysis />
          <Power />
          <DigitalSignals />
          <SerialAccess />
          <PracticalEE />
          <DigitalLogic />
          <I2C />
          <Memories />
          <PinConfiguration />
          <SPI />
          <JTAG />
          <OpenOCD />
        </MDXConcat>
      </Deck>
    </Zoom>
  );
}


ReactDOM.render(<EntryPoint />, document.getElementById('app'));
