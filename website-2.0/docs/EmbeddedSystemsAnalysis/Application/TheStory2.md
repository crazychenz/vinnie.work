---
sidebar_position: 2
title: Story 2 - The HTTP Status Provider
---

## The Story

Image you work for a niche content provider company that has evolved its customer base for over 2 decades. The content that the company provides are HTTP status pages. For example, when an invalid URL is provided the customers web server requests from our CDN a status page update.

Long gone are the days of customers willing to expect a simple plain text based status update. The company is now required to provide more [appealing status updates](https://http.cat) for all HTTP errors. Additionally, the board of the company has strategically decided that they want a way for administrators to switch the HTTP status content from a normal theme to a seasonal theme. In their infinite brilliance, they want this theme switching feature to be switchable from the physical device so that only administrators with physical access can perform the change.

The catch is that the source code and internal documentation for the content delivery system has been lost due to a lack of version control at the time of development. You and your team have already decided that re-writing everything from scratch simply wont do based on the existing time and budget. Regardless, everything you need to keep this legacy system alive has been made available to you through its cold spare.

You will be expected to:

- Perform analysis of all relevant aspects of the system (i.e. reverse engineer the system).
- Integrate the required updates into the system so that no existing functionality is lost.
- Load all changes into non-volatile memory so that they persist any reboots.
- Everything is due in 1 week.

Some Ground Rules / Assumptions / Constraints:

- The SDCard is soldered into place and you don't have the equipment or time to de-solder and extract its contents.
- There are no HDMI ports, only the screen build into the device.
- ??There is a web interface that can be accessed via the network??
