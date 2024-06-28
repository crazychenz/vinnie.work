---
title: Git Configurations
---

## ~/.gitconfig

I use vanilla git CLI for all my git repo interactions. That said, there are some short cuts I've defined from my years of Subversion habits.

```ini
[user]
        email = userid@domain.com
        name = Vinnie Was Here
[init]
        defaultBranch = main
[alias]
        st = status
        co = checkout
        br = branch
        acp = "!f() { \
          PARSED_OPTS=$(getopt -o ham: --long help,all,dry-run,message: -- \"$@\"); \
          if [ $? -ne 0 ]; then \
            echo \"Failed to parse options.\"; \
            exit 1; \
          fi; \
          eval set -- \"$PARSED_OPTS\"; \
          ALL=\"\"; \
          DRYRUN=\"\"; \
          MESSAGE=\"--allow-empty-message\"; \
          while true; do case \"$1\" in \
                -h|--help) echo \"Usage: git acp [-h] [-a] [--dry-run] [-m message] [<pathspec>...]\"; shift; exit 0;; \
            -a|--all) ALL=\"-a\"; shift;; \
            --dry-run) DRYRUN=\"yes\"; shift;; \
            -m|--message) MESSAGE=\"-m '$2'\"; shift 2;; \
            --) shift; break;; \
            *) echo \"Invalid option: $1\"; exit 1;; \
          esac; done; \
          NARG=$#; \
          SUFFIX=\"git commit $ALL $MESSAGE && git push\"; \
          if [ \"$#\" -gt \"0\" ]; then \
            COMMAND=\"git add $@ && $SUFFIX\"; \
          else \
            COMMAND=\"$SUFFIX\"; fi; \
          if [ \"$DRYRUN\" = \"yes\" ]; then \
            echo $COMMAND; \
          else \
            sh -c \"$COMMAND\"; \
          fi; \
        }; f"
        deploy = "!f() { \
          git status 2>/dev/null | grep \"nothing to commit\" || exit 1; \
          git checkout deploy || git checkout -b deploy; \
          git merge main || git merge main --rebase; \
          git push origin deploy; \
          git checkout main; \
        }; f"
        up = "!f() { \
          git checkout deploy; git pull; \
          git checkout main; git pull; \
          git merge deploy; \
        }; f"
[http]
        postBuffer = 157286400
```

- `git st` - Git status with 4 less keystrokes.
- `git br` - Git branch with 4 less keystrokes.
- `git co` - Git checkout with 6 less keystrokes.
- `git acp -m "commit message" <pathspec>...` - Git add/commit/push in a single command. This lazy action is great for quick typo fixes or attribute testing in CI environments.
- `git deploy` - Merge `main` into `deploy` branch and push to trigger CI/CD.
- `git up` - Update `main` from upstream and `deploy`. (Note: Deploy may be updated by CD system.)

## Conventions

One Git convention I think is worth mentioning is my `main` vs `deploy` branches. In larger team settings, its always best to develop new features or fixes in branches of their own with regular merging. Once its time to integrate, never integrate into a branch that will be deployed. Instead, integrate into a "stage" branch that can then be merged into the deployment branch.

This all makes sense, but the primary use of this convention for _me_ is because I want to be able to merge, commit, and push into `main` without fear that I'm going to take down any systems. If you've structured your system such that developers fear pushing, you've set yourself up for lost effort!