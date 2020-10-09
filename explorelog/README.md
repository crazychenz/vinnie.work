# vinnie.work source code

# Workflows

## Creating a post

1. Checkout new branch

```
git checkout -b post/git-better
```

2. Create post entry in `content/blog` (e.g. folder, index.md, frontmatter)

3. Write blog entry and screen test (and do local update, commit, test loop).

4. Commit changes

```
# Optional up stream setup
git push -u origin post/git-better

# CRUD with favorite editor

# Explicitly add files to git (folder example for simplicity)
git add explorelog/content/blog

# Commit
git commit

# Optionally push upstream
git push
```

5. When ready to merge into trunk, checkout trunk and _squash_ merge.

```
git checkout trunk
git merge --squash post/git-better
```

## Updating a post

1. Checkout existing branch and merge in trunk (could rebase if not pushed upstream)

```
git checkout post/git-better
git merge trunk
```

2. Make updates

3. Continue from step 4 of "Create a post"

## Create / Update / Remove Feature

1. Checkout new branch

```
git checkout -b feature/add-license
```

2. Create, Update, or Remove Feature

3. Continue from step 4 of "Create a post"

## Deployment

```
git checkout netlify
git merge trunk
git push
```
