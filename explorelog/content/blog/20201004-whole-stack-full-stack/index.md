---
title: "The Full Stack isn't the Whole Stack."
date: "2020-10-04T12:00:00.000Z"
description: |
  My exploration into understanding the modern term "full stack"
  and my previous expectations of the whole stack.
---

Over the past decade I feel like I've fallen into the governmental hole where I became increasingly isolated with the tech world. Each time I would poke my head up I'd find everyone just scrambling to reinvent things that (I felt) had previously existed for years with new names and APIs. Since the pandemic of 2020, I've taken a significantly closer look into what I've been missing.

One of the topics that I am the most miffed about is the term "Full Stack Developer". Based on my personal exerience, what I discovered is by no means the "whole stack", but perhaps my semantics are not compatible with this world I find myself in. A quick Google search of what is a full stack developer is summarized in the list below:

- [w3schools](https://www.w3schools.com/whatis/whatis_fullstack.asp): web development, server scripts, database queries
- [skillcrush.com](https://skillcrush.com/blog/front-end-back-end-full-stack/): hybrid of front end and back end development
- [Alexander Katrompas](https://medium.com/@alexkatrompas/the-hard-truth-about-the-full-stack-developer-myths-and-lies-945ffadeeb8c): "just a business buzzword, not an engineering designation"
- [Eric An](https://careerfoundry.com/en/blog/web-development/what-is-a-full-stack-web-developer/): Full-stack developers are experts in both the front-end and back-end; so, the full stack of technology that makes up a website.
- [ANDRII RYZHENKO](https://ncube.com/blog/full-stack-developer-vs-mean-stack-developer): frontend and backend development with additional skills in design, management, and UX.
- [Forrest Stroud](https://www.webopedia.com/TERM/F/full-stack.html): "Full stack in technology development refers to an entire computer system or application from front end (customer or user-facing) to the back end (the 'behind-the-scenes' technology such as databases and internal architecture) and the software code that connects the two."
- [Chris Coyier](https://css-tricks.com/what-does-it-mean-to-be-full-stack/): "when it comes to building websites, I can do it all."
- [Hannah Westberg](https://codeup.com/what-is-a-full-stack-developer/#): "simply someone who is familiar with all layers in computer software development."
- [Tatiana Tylosky](https://www.thinkful.com/blog/what-is-a-full-stack-developer-2/): frontend, backend, project management, and devops
- [Ryland Goldstein](https://stackoverflow.blog/2019/10/17/imho-the-mythical-fullstack-engineer/): "Individual responsible for engineering the end-to-end features of a system. From initial user experience to backend code running on distributed servers."

There are several take aways that I gathered from what I've read from each of these blogs:

- Many who write about full stack development acknowledge this is a buzz term.
- Many who write about full stack development are assuming the frontend is web development.
- Full stack development is "frontend, backend, and database".

My personal opinion is that a full stack developer is one that understands the system and has the skills required to troubleshoot any part of the system and coordiate maintenance. That doesn't mean a single person can single handidly develop all parts of a system. It means they know how all the parts of the system integrate with each other and why. Traditionally I would like to think of this role as a (senior technical managment) Systems Engineering or Senior Software Engineering role.

## Semantics

In reference to my out-of-date semantics, lets define a few concepts and then go into why the full stack isn't the whole stack. The following definitions have been cherry picked from Google's dictionary.

### Engineering

Definition: design and build (a machine or structure).

I've been formally trained to think that an engineer as someone who designs and builds solutions for problems with repeatable (albiet evolving) processes. This is to say that engineering is the
role one may serve to creating something from nothing to solve a problem.

### Stack

Definition: a pile of objects, typically one that is neatly arranged

In the technical industry, we anthropomorphize stacks into all the tangible and virtual objects required for a complete solution. In networking, this could be the OSI model. In web development, this could be front-end web development, backend API handlers, and database CRUD commands. In hardware, this could be the integrated circuits, the board layout, and the firmware required to run the integrated circuits for a particular application. In project management, this includes not only the code, documentation, and budget, but also developers are part of the stack!

### Developer

Definition: a person or thing that grows or causes a thing to grow and become more mature, advanced, or elaborate.

Arguably, a developer is not someone who originates an idea and manifests it, but instead takes an existing technology or solution and tailors or evolves it for a new problem. If you subscribe to the idea that a "full stack developer" is a web developer, this definition makes a great deal of sense because many web developers are primarily taking existing widgets and gadgets and evolving them for their customers and users.

## The Whole Stack

Based on the previous definition of stack, here is an example of my idea of a whole stack. Let's suppose you needed to create a simple static website. What are (in a general sense) the layers and components that make up the complete solution?

The whole stack would, _at a minimum_, include:

- **Networking** - A general understanding of all the mechanisms that are used to pass and block passage of data on a network. (e.g. OSI, Ethernet, IP, TCP/UDP, DNS, HTTP, TLS, routes, firewalls, NAT, gateways, switches).

- **Hardware** - A general understanding of the resources available on the system (e.g. memory, disk space, peripherals), the interfaces required to access those resources (e.g. memory maps, instruction sets, kernel exposed syscalls, standard system libraries).

- **Operating System/Environment** - A general understanding of the operating system and software required to host or serve the backend or database of the target application. (e.g. knowing how to use systemctl or init.d, knowing relevant files in /etc, knowing how to use docker/k8s)

- **Service Hosting (traditional backend)** - A general understanding of how to configure and publish a website, its required API callbacks, and the database schemes or maintenance. This is in contrast to the maintenance of the software actually serving the service. (i.e. Not NGINX setup, but the things NGINX are hosting.)

- **Client Side (traditional frontend)** - A general understanding of the UI/UX of an application. Ironically, the frontend will typically have its own backend that is comprised of things like a cache or store and a libraries of utilities for things like parsing, serialization, local API calls, and remote procedure calling.

- **Documentation** - A general understanding of how to convey the various parts of the stack to the diverse set of individuals involved. A set of user documentation is going to look wildly different than documentation intended for developers and engineers. In the case of developers and engineers, the documentation is likely going to be wildly different between software and hardware.

- **The Developers** - A general understanding of how to work with the developers that are stakeholders of the system. A knowledge of team dynamics and maximizing on the value gained from the productivity of each developer.

- **The Users** - A general understanding of how one distributes the application to users and obtains feedback from the user base. This includes gathering new requirements, providing technical support, and learning from user biases.

- **Budget** - Everything is made possible with a finite number of resources, whether that is time, energy, space, or money. Understanding how the money flows is extremely important in understanding how to mitigate risk and prioritize tasking. (i.e. Know how to maximize the value add with the resources provided.)

That is a 10000 foot view of what I think of as the whole stack _just for a static website_. What we think of as the whole stack can get increasingly complicated once the system gets increasingly larger in size or complexity. Suffice to say, a full stack isn't the whole stack but the parts of the stack that often need tailoring for a solution (and often only involving web applications.)

It is my view that a Senior Software Engineer is someone who is capable of working with teams of engineers, developers, and users with a diverse set of skills covering the whole stack, but no stead fast requirement to have a significant depth of knowledge within any of the parts of the whole stack.
