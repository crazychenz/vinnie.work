---
sidebar_position: 1
title: Embedded Systems Analysis
---

Greetings,

I don't know what to call this ... a course? a book? a document? In any case, this material is something I've wanted to capture for a long time for anyone to freely digest at their own pace.

The material has been organized in an order that I would consider when performing any embedded systems analysis. The high level break down is:

1. **Meta** - This subject is a bit abstract, but aims to encompass the process that I use to approach problems and strategize how to approach towards a solution.

2. **Initial Visual Analysis** - The initial physical inspection of a device includes gathering as much detail as possible about the device. All information is gathered without providing any power to the device.

3. **Initial Software Analysis** - After a full profile of the physical aspects of the device have been performed, the next I like to do is check the runtime behavior of the device. Many times we can accomplish our goals without actually having to pop a cover or do deeper hardware analysis (i.e. "Just because you have a hammer, not everything is a nail.").

4. **Hardware Analysis** - If you've exhausted your resources up until now, perhaps a deeper look at the hardware is in order. Memory extraction, IO analysis, and low level system control via JTAG are the name of the game here.

5. **Firmware** - This is essential where the advanced software analysis comes in (in contrast to our initial software analysis). With the firmware extracted, we often have full access to the boot software, the kernel, and all of the application code.

6. **Application** - This is a place holder for an actual full exercise that takes you through the complete process described above.
