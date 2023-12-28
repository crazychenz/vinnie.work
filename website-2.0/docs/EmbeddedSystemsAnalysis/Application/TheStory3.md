---
sidebar_position: 2
title: Story 3 - The Cyber Criminal
---

## The Story

Image you are covertly a cyber criminal that has just been hired to work for a popular cryptocurrency company. As the new administrator, you've just discovered that the entire customer wallet database hosted by the company is only accessible by a single Raspberry Pi.

As the devious cyber criminal that you are, you decide that the plan is to harvest wallet credentials over time.

## The Plan

Because the device is behind specialized data filtering firewalls, the only way to exfiltrate the information is through a USB thumb drive.

You also can't leave a thumb drive in the device to be discovered. Instead you've decided to enable an external trigger of some sort so that you can quickly insert the USB thumb drive, hit the button sequence and have all of the goods dumped to the drive.

You swipe a cold spare of the system to analyze and reverse engineer from home. Once you've integrated the required malware into the cold spare, you'll swap out the two devices with a minimal expectable downtime.

You will be expected to:

- Perform analysis of all relevant aspects of the system (i.e. reverse engineer the system).
- Integrate the required updates into the system so that no existing functionality is lost _and new functionality isn't apparent_.
- Load all changes into non-volatile memory so that they persist any reboots.
- The next window of opportunity is in 1 week.

Some Ground Rules / Assumptions / Constraints:

- The SDCard is soldered into place and you don't have the equipment or skill to de-solder and extract its contents.
- There are no HDMI ports, only the screen build into the device.
- ??There is a web interface that can be accessed via the network.??
