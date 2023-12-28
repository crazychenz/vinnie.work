---
sidebar_position: 2
title: Story 1 - The Backup Appliance
---

## The Story

Image you work for a mature company that has evolved their IT, organically, for over 2 decades. There are many complex legacy components of the larger system that are required to keep the business running. Included as a critical component is a backup appliance that has been running autonomously for over a decade. The details of this little black box are unknown to everyone at the company. All that exists is a user manual to assist system administrators with end user maintenance actions like reset and network config. They also have the ability to monitor the utilization of the system.

Upon regular inspection, system administrators have monitored an occasional spike in usage of the backup appliance from time to time. They've requested that you, a local embedded systems analyst, add a feature to the appliance to allow them to locally initiate a flush of the system to ensure its continued operation. The company has a cold backup of the appliance for you to perform tests on. Once an upgrade package has been developed, the company will approve a _single_ window of downtime off hours to upgrade the system to meet the needs of the system administrators.

The original vendor of the appliance has been acquired and merged several times over so there is no chance of getting support for the appliance. Since this is an appliance, the source code is proprietary and is likely lost to time and a number of other IP divisions during the vendors breakup over the years. While you ponder if the system should be replaced, its been determined that you must add the requested functionality to the existing system ASAP (~2 weeks) and then leadership will consider revisiting a modern replacement.

Your only hope is to perform your own embedded systems analysis to discover and unlock the appliance's secrets. After developing an understanding of the internal, you must engineer the new functionality and integrate it into the device without breaking any of the existing functionality.

Some Ground Rules / Assumptions / Constraints:

- The SDCard is soldered into place and you don't have the equipment or time to de-solder and extract its contents.
- There are no HDMI ports, only the screen build into the device.

- ??There is a web interface that can be accessed via the network??

Hints:

- JTAG is handy
- I2C is used
