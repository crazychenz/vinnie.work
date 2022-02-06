---
slug: 2020-10-08-git-master-main-trunk
title: "Git master, main, or trunk?"
#date: "2020-10-09T12:00:00.000Z"
description: |
  What is the context of Git's master semantics? What would be better?
---

Due to a growing awareness of unconcience bias, replacing terms that have historically (or directly) been associated with slavery or racially incensitive terminology has become a trend. To be mindful about this entire process I decided to do some "re-google" to learn what Git's context of its famously used "master" branch.

<!--truncate-->

## Origins of 'master' in Git

Some would argue that the word master by itself it not indicative of slavery, racial profiling, or other deragatory terms. After all, master is used in relationships between master and apprientice. Its also used to refer to a master piece of work, or an authoritative copy of some media "the master". So why has [Git changed their policy](https://sfconservancy.org/news/2020/jun/23/gitbranchname/) and [GitHub changed their policy](https://github.com/github/renaming) to default from "master" to "main"?

An [interesting set of references](https://mail.gnome.org/archives/desktop-devel-list/2019-May/msg00066.html) by Bastien Nocera traces the roots of the term master in git back to BitKeeper's revision control system. (Linus used to use BitKeeper RCS until there was a falling out at some point in the past, sparking Linus to write the first version of Git.) A [nice summary](https://english.stackexchange.com/questions/474419/does-the-term-master-in-git-the-vc-system-refer-to-slavery) of these references as written by [kaikuchn](https://english.stackexchange.com/users/388453/kaikuchn):

> That the master branch in git refers to the slavery concept is not obvious,
> because there is no slave concept in git itself. However, if we look at the
> origins of git, we know that it was developed to replace BitKeeper. BitKeeper
> uses master as the name for its main branch, which is probably the reason why
> git does as well.
>
> Now the question becomes, does the master branch in BitKeeper refer to the
> slavery concept? BitKeeper does have master/slave repositories, and
> repositories and branches are conceptually the same thing in BitKeeper.
> Therefore, yes it does refer to the slavery concept and given that git took
> the name from BitKeeper, so does git."

## Why 'main'? Let's consider other options...

The most common reason I've seen for going to `main` is that its popular, short, to the point, and doesn't "interrupt muscle memory" (which sounds like a C coder's comment). My personal experience with revision control is deeply seeded in using subversion. In subversion you have trunk, branches, and tags. Trunk in this context refers to the fact that revision control commonly creates tree structures from graph theory. In my opinion, other than [Linus' hatred of SVN](https://www.youtube.com/watch?v=4XpnKHJAok8), there is no reason to not use `trunk` as the default branch name.

There is an oppurtunity here to actually communicate further intentions in the name of the default branch. There have been a number of common workflows developed and published over the past decade. Fernando Villalba
has written post [Branching Models in a nutshell](https://medium.com/factualopinions/branching-models-in-a-nutshell-bf24ea1d888a) on a few of these flows. The one that both of us prefer is trunk based development. This is where you bascially perform all your work locally (branch or checkout) and then only merge into trunk. If you are going to use a "trunk based development", why not name the default branch **trunk**.

If you have other flows, like a develop, preprod, production ... Why use a main? Just have the default branch be the `production` branch and document all developer manuals to point to the `develop` branch. The bottom line here is that the name of the branches within a git repository should reflect the workflow it implements.

In addition to naming the master or trunk branches of a repository, it should go without saying that development branches should probably have an organizationally defined convention. For example, all feature branches should be prefixed with `feature/` or side experiements be prefixed with `dev/` and so forth.

## Moving from master to branch development.

In an exercise to build my git muscle, I am attempting to over branch and merge. The intention here is to quickly as possible become more familiar with how git branching and merging actually effects how I work and manage the state of my projects. With subversion, you often do everything you can to keep subversion away from your mind while coding (until a merge is required.) A common git philosophy, when doing branch based development, is almost such that you really need to keep the life of a branch to the length of a story, feature, or less.

For this site, I'm attempting a new workflow that has me writing each blog post as a new branch prefixed with `post/`. (Intending to streamline this with scripts soon.) I then plan to squash merge each post into trunk. Perform some quick integration testing and then merge into my `netlify` branch that triggers the netlify deployment process.

The key here is that all _work_ is performed in `post` or `feature` branches. Then all changes to `trunk` should be merges. And finally, all triggered CI/CD branches (like `netlify`) should be fast-foward merges.

## Moving From Master To Anything Else

The following instructions are for moving `master` to `trunk`.

### Initial environment move and upstream.

1. Commit all local changes on `master`.

2. Its recommended that you limit commit/push access to origin repository at this point.

3. Rename local `master` with a branch move command and push local `master` branch to origin to synchronize any commits.

```
git branch -m master trunk
pit push -u origin trunk
```

4. If using a GitHub, GitLab, or BitBucker like service, ensure that you've updated your default branch to `trunk` and unprotected master branch.

5. Remove old remote master

```
git push origin --delete master
```

### Follow up on other environments (team mates and secondary systems)

1. Switch to local master

```
git checkout master
```

2. Rename the branch to trunk

```
git branch -m master trunk
```

3. Update local tree with remote tree

```
git fetch
```

4. Synchronize the rename from `origin/master` to `origin/trunk` from tree.

```
git branch --unset-upstream
git branch -u origin/trunk
```
