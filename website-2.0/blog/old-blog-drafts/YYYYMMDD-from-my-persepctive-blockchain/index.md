---
title: "From My Perspective: Blockchain Sustainability"
date: "2021-03-19T12:00:00.000Z"
description: |
  Just started doing some research into blockchain technologies and their applications. While I can see the merits of using blockchain, so far I fail to see the sustainability of such a system absent of growth.
---

## Introduction

A business partner of mine has recently been doing a ton of research into crypto-currency, block chain networks, and the block chain. He has a more business and application perspective that he comes from, whereas I come from a more systems engineering and implementation specific approach.

Because of his excitement, I thought I'd make a post about my findings of the blockchain so far. Needless to say, the applications of blockchain are extremely immature and its difficult to see where our geopolitical ecosystem and technology will drive blockchain applications in the future, but perhaps I'm getting ahead of myself. Suffice to say, I know I know close to nothing, but what I do know is something ...

## What Is Blockchain, technically?

Blockchain is a category of data structures that all relate in that they are a list of blocks where each subsequent block in the list is cryptographically bound (via hashes and digests) to the block before it. Within each block exists metadata including a tree of transactions that are associated with the given block. As a developer, I think of these trees as something similar to git trees where each hash is a digest of the change set as well as the previous change set commit id.

The net effect of having a list or chain of blocks that are cryptographically bound is that it becomes statistically impossible to forge or change history.

Thats it, its a linked list of cryptographically bound blocks representing transactions.

## Trustless Blockchain Theory

The primary driver of the blockchain culture seems to be centered around the distrust of governing bodies or organizations. Examples of distrusted organizations may include a state government, a corporation, and so forth.

The natural response has been that a purely democratic philosophy applied in a digital manner could be a solutions. But what is the threat model here and how does _blockchain_ mitigate these threat? The 3 primary security issues with any information system is going to be associated with integrity, confidentiality, and availability.

Blockchain without a doubt contributes to the integrity of the information system. Replication of the blockchain contributes to the availability of the information system. When it comes to confidentiality, I've seen _very little_ in regards to how this will be solved across the community. At the moment, nuCypher seems to be leading the charge with its enhanced proxy re-authentication conventions and research into full homomorphic encryption.

The theory with all of this is that through un-forge-able history and replication of data across state boundaries you can establish a system where no single party is trusted, but instead the greater composition of the system is the root of trust.

## Is It Really Trustless?

Notice that the blockchain data structure (or technology) itself only really enforces less than 1/3 of what is needed to truly mitigate the threats to a pure digital democracy.

The availability of a blockchain is dependent on the replication, reliability, and resilience of the blockchain's node network. This is basically a network of participants that are responsible for providing the digital computational energy to validate and verify transaction claims. These nodes exists through the use of incentives in the form of crypto-currency. A blockchain is only as strong as the incentives it provides to participants.

And this leads us to our first real blockchain threats:

If there is little to no incentive to contribute to a blockchain network, you may find a blockchain network that will default on itself. You obviously won't see this pattern as much in the early 21st century because blockchain is in a growth pattern. The question you need to ask yourself is: Would this system be sustainable without growth?

## What About Privacy?

Blockchains has thus far been successful through the decentralization of primarily public data (i.e. financial transactions). But what about the information that we need to keep private to prevent others from exploiting us?

One partial solution is to use _proxy re-encryption_. This works by using a special variant of asymmetric encryption. The asymmetric encryption can occur in such a way to allow a third party to re-encrypt (asymmetrically) an already encrypted message for another recipient using a user provided re-encryption key. The re-encryption key is mathematical result from the sender's private key the receiver's public key.

This _proxy re-encryption_ can be employed to allow blockchains to contain confidential information that is sharable to other parties given that the originator provides a re-encryption key for the receiver.

The one major downside with using any encryption in the block chain is that its available for vulnerability and exploitation research. In other words, once the encrypted data is available, it can be bruce force attacked or be mathematically exploited due to poor key entropy or other cryptographical weaknesses. For example, look at how SSL and TLS have evolved over time to fix issues in their algorithms (e.g. implementation weaknesses, key sizes, and constraints).

## What About The Infrastructure?

In the geopolitical landscape, there is this perception that blockchain and cryptocurrencies lives outside of the governments of the world. It is my belief that it only exists this way because its either not a top-list issue of governments yet or its not worth interfering with yet.

While no one is suppose to control a given blockchain network, consider that all digital regions of the world have governed electrical grids, governed data lines, and governed income taxes. Sure, the governing organizations won't be able to dispute a blockchain history or erase a given state of a sufficiently replicated blockchain, **but...**

- There is nothing preventing a sufficiently powerful enough government from conducting lawful or unlawful intercept of keys, confidential information or correlation of publicly available information.

- There is nothing preventing a sufficiently powerful government from controlling the bandwidth and latency of data lines or controlling the wattage provided to blockchain participants.

- There is nothing to prevent a sufficiently powerful government from investigating and compelling its people to provide sufficient information to run its own transactions with wallets or credentials no intended for them. (i.e. taxes, reparations, and so forth). What is crypto-currency compared to immediate or prolonged incarceration?

Sure, "they can't get us all" will be a catchy phrase, but do you remember the "war on drugs"? While it may not be an undisputable win, there may be significant havoc that can be caused when attempting to subvert a government that is in control over the physical aspects that the digital world have always relied on.

## Conclusion

Blockchain is a fantastic method for validation of transaction integrity, but only with sufficient replication, reliability, and resilience of the blockchain data itself.

Blockchain as a new world order democracy is definitely a philosophy that many subscribe to, but I personally don't see it and I think like everything else, you have to prescriptively apply technology to solve a real problem.

There is so much on this subject that I'd like to discuss in future articles (e.g. smart contracts, storage tries, wallets, proxy re-encryption use case examples, and much much more), but this is probably enough rambling for one weekend.
