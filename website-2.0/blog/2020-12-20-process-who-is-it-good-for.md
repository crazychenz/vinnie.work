---
slug: 2020-12-20-process-who-is-it-good-for
title: "Process: Who is it good for?"
#date: "2020-12-20T12:00:00.000Z"
description: |
  For years now I've always found _process_ to be a facinating area of software engineering. But please don't misunderstand my meaning ... most processes in my experience not only feel painful to the individual contributors but also seem wastful to the overall organization.
---

For years now I've always found _process_ to be a facinating area of software engineering. But please don't misunderstand my meaning ... most processes in my experience not only feel painful to the individual contributors but also seem wastful to the overall organization.

<!--truncate-->

## Definition

I've mentioned this in a previous post, [_Workspace Problems_](https://www.vinnie.work/20201020-workspace-problems):

> All mature organizations should have well defined processes. I find that most folks equate "well defined" with "quantity" and this simply isn't true. Well defined process is simply a process that isn't ill defined (or undefined). For example, you may have a certain way you like to make a sandwich. Simply making the sandwich is an ill-defined process. But once you write down the recipe for making the sandwich, it is now a well defined process.
>
> Having a well defined process doesn't mean having to fit within a one size fits all set of constraints, it simply means writing down how you _already_ accomplish or _plan to_ accomplish your work and how folks should _expect_ interact with you.

**Process should be a capture of existing cultural norms and expectations between peers.**

## Purpose

Personally, I've always found process to simply be an attempt to document how entities of an organization work together. Nothing more and nothing less. IMHO, management all to often decides how they want their workforce to work together and this often leads to nothing but miscommunication and a break down in productivity. Instead, process is the documentation of existing cultural norms developed by engineers. Examples:

- How do code reviews happen?
- How is code upstreamed?
- How are meetings scheduled?
- How are current events disiminated?

These are events that result in things that are required for the workforce to accomplish their job. Don't ever confuse what needs to be done with how it should be done. (And don't try to exploit this rule by developing interim deliverables.)

Examples of things that should **not** go into a process:

- Strict templates for deliverables.
- How _all_ employees should uniformally conduct their day to day routines.
- How _all_ deliverables should uniformally fit a standard format.
- Strictly enumerated categorization of requirements, tests, and components.

The point here is that effective _one size fits all_ processes are a myth. Process that are one size fits all are usually attempting to fulfill the needs of an under staffed and under resourced organization OR they are used as a mechanism for management and leadership to dictate how they would like the workforce to behave as if everyone was a programmable machine.

## Additive vs Preventative

The podcast called [Soft Skills Engineering](https://softskills.audio/) (Episode 122) had a discussion about process that I found quite interesting. They brought up that all actions of a process can mostly be categorized into two categories: additive and preventative. The general idea is that an additive process action is one where the organization aims to add value and a preventative action is one where the organization aims to prevent the potential loss of value (i.e. prevent mistakes).

Preventative process is kind of silly because process is performed by humans and inevitibly humans will make mistakes, therefore someone making a mistake should never be enough of a reason to change process. Digging a little deeper into the prevention of lost value could naively be considered _value_. But looking closer may reveal that all actions have cost, and the cost should always be less than the value add for the action to be value _added_. When you start out, you'll likely want a "light weight" or "simple" process ... but over time these processes grow as mistakes and events occur. I've always been told that construction building codes have been written in blood. That is to say that local building codes (in the US) can be very long and arduous but this is usually due to someone or a number of someones becoming complacent and getting seriously injured or killed while performing some routine task. As a result, the government simply appends language to the building code to show that they've solved the problem so _it'll never happen again._ ... Or more realistically, _it'll never be their responsibility again._ Bah! Preventative process are typically what makes a process "annoying", "painful", and "wasteful". Sometimes they may actually stop someone from doing something less than ideal, but at what overall cost? ... and thats only if folks aren't already cutting corners or ignoring the process all together.

In contrast, there are additive process actions that do add real value to an organization. For example, perhaps there is a process where all code in an organization should be automatically regression tested. With automatic testing, developers can refactor and add features at ease knowing that they have a framework to check their work for them. This does several things for cost/value ... first it allows developers to focus more on new code and less on existing code, second it allows unseasoned product developers to jump into a code base and learn through experimentation with confidence. Another additive process action is to list not how to accomplish something but simply list the required deliverables. For example, a product usually should have a set of _requirements_, _source_, _test documentation_, _end-user product_, and _user documentation_. Knowing that these items are required, you'll know that the developers can write the software via requirements, testers can test software via requirements, technical writers can document usage via source code, and the user can use the product with what ever end-product thing is delivered instead of just delivering source code. The culture of a team should dicatate how all of these things are handled, so long as they are handled.

In summary, when an organization grows their process in complexity simply in reaction to events, its worth taking a look at the admendments to determine if these are actions that wash management's hands of responsibility or are they truely adding value to the organization.

## The Other Guy

A way that I like to look at process is that its written and performed not for you, but for the _other guy_. As individual contributors we often feel that we can accomplish everything ourselves. And perhaps with enough time and money we can accomplish everything ourselves. But this is simply not the world we live in. Instead we're often forced to work in dynamic environments of unique personalities that need to intercommunicate effectively to get anything done efficiently or within budget.

By having a process for how these unique personalities interact will provide individual contributors guidance for how to hand off their peice of the pie to the _other guy_. These hand off can be direct or indirect. An indirect hand off might occur when someone leaves an organization. The new hire will need to pick up where the previous member left off and having a process for how they handled their peice will be invaluable. Note: Incoming new hires are probably a good signal that its time for a retrospective to harness their fresh perspective or view on existing processes.

An example of a more direct hand off would be a developer handing off code to a tester. While the developer may be able to accomplish some level of testing themselves, due to delgation of responsibilites, they must provide not just the code but the expectations of what the code is suppose to do for the tester to verify and validate. These are requirements. Do they have to be formal requirements with words like SHALL or MUST? No! They simply must convey the meaning of what the code is intended to do sufficient for the tester to understand. And if there are questions about the requirements, the tester should have a process to callback to the developer. Meaning should **not be** _derived_ from requirements, but sourced directly from the ... well ... source.

## Cargo Culting

Wikipedia.org describes [Cargo Cult](https://en.wikipedia.org/wiki/Cargo_cult) as:

> A cargo cult is a millenarian belief system in which adherents perform rituals which they believe will cause a more technologically advanced society to deliver goods.

Put another way, some one "Cargo culting" is someone who is performing rituals without knowing why they exist in the first place. IMO, This happens so often in organizations that its likely the key reason for process bloat. I once asked an individual responsible for drafting the organization's test plan template, why some of the sections existed. They visibly showed that they were irritated and ended up justifying the sections by indicating that its something that other organizations had done in their experience. The take away is that this individual was cargo culting "how to perform testing".What makes this worse is that this cargo culting was being dictated to the rest of the organization. Ugh!

**Don't be a cargo cultist!** Either be confident in the process you are adhereing to or do your due diligence to understand why an action or step of the process exist. If you can't find the reason and value added, then that action or step is a perfect candidate for removal or admendment in the process documentation.

A more light hearted cargo cult story I've been told before involves ritual cooking at Thanksgiving. There once was a lady that learned how to cook a turkey from her grandmother when she was young. One of the steps that her grandmother taught her granddaughter to do was to cut off one end of the turkey. For the next 30 years, the granddaughter would cut off the end of the turkey until one day her own daughter asked "Why do you cut off the end of the turkey?". Only then did the lady become more curious. When the lady phoned her grandmother at the nursing home to ask why she cut off the end of the turkey every Thanksgiving, the grandmother responded, "So that it would fit in my small oven!".

## Unresourced

One last point I'd like to make that gives process a bad name is the idea (or myth) that process will solve an under resourcing issue. I've seen process dictated before, on several occasions, with the goal to allow a single release authority or gate to more easily review release artifacts. For example, having a requirements template that everyone must follow will, in theory, make it easier to pick out the things that matter to the authority. The issue here is that you've now created a round one size fits all template that engineers are forced to shove their square pegged capabilities into.

Perhaps allowing engineers to provide their own requirements documentation (or whatever other release artifacts) format, everything in the document will be what matters. This is to say that in a lot of situations (especially in the government) extra language is shoved into documents just because someone was told that it matters when in fact it does not. And even worse, that language may go on through out time without ever being read again. When I write anything, I want to know that someone is going to want read it (even if the only one who reads it is myself).

What I would recommend is that organizations provide guidance on what could be covered in a requirements document and the benefits to why those topics could be covered. Then allow engineers (or teams) to develop their own sense of style, formatting, and coverage to meets the needs of the real organizational culture as well as the needs of the product to fulfil the desires of the customer.

## Conclusion

In conclusion, process can be a great way to capture the culture of an organization to efficiently brings new folks on board and help existing folks communicate with their peers more effectively. In contrast, you are more likely to find parasitic processes in the wild that have unjustified or outdated ritualistic parts that increase cost and decrease the value of the organization as a whole.

If the organizations leadership and management doesn't see parasitic process as a problem, it won't be worth an engineers time to contibute to solving the issue. Instead you must either assimilate to the process or find the door.

## Comments

<Comments />

