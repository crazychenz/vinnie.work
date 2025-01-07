---
title: Self-Publishing via Markdown
---

[Original Gist](https://gist.github.com/caseywatts/3d8150fe04e0d8462cfc4d51b9856d39)

`--- Content Below ---`

short url: [`caseywatts.com/selfpublish`](http://caseywatts.com/selfpublish)

my book is out! an applied psychology / self-help book targeted at developers: [Debugging Your Brain](https://www.debuggingyourbrain.com)


`Markdown` --> `PDF` (as a booklet!)

`Markdown` --> `EPUB` and `MOBI`

I'm working on a book, "Debugging Your Brain" which I plan to self-publish. I'm writing the chapters in Markdown, and I want to have it both printed on paperback and available as an eBook on Kindle etc. Here are the tools I used to get my markdown files (from my Jekyll based blog) into the PDF, EPUB, and MOBI formats.

## Overview
- `pandoc` is a command line tool used to convert from certain file types to other file types
- `latex` is a typesetting language / software used to make pdfs. I've seen this used most often in academia that uses equations, like math, physics, and computer science classes in undergraduate.
- `epub` is the standard eBook format. As far as I've seen, this is used by everything except Kindle.
- `mobi` is Kindle's eBook format. We'll use kindle's command line tool to convert an epub to mobi.

## Pandoc Setup
pandoc is the main tool to convert markdown to other things.

[Here is their official page](https://pandoc.org/installing.html#linux) with installation instructions.

### My Linux Setup
To install an older version just to get you running:
```
sudo apt-get update 
sudo apt-get install pandoc
```

To install a more recent version instead, copy the url to the latest `.deb` package from [THIS PAGE](https://github.com/jgm/pandoc/releases/latest) and download and install it using something like this:
```
curl -L https://github.com/jgm/pandoc/releases/download/2.10/pandoc-2.10-1-amd64.deb > pandocinstaller.deb 
sudo dpkg -i pandocinstaller.deb
```


## Amazon Self-Publishing

Amazon Royalties: https://blog.reedsy.com/amazon-self-publishing-royalties/  
https://kdp.amazon.com/en_US/help/topic/G201834330  

https://www.amazon.com/gp/seller-account/mm-summary-page.html/ref=footer_publishing?ld=AZFooterSelfPublish&topic=200260520&ie=UTF8   https://kdp.amazon.com/en_US/help/topic/G200735480 





first set up `pandoc` (above)

## Markdown to eBook
To get your markdown into an eBook format, you'll first convert it to `epub` which `pandoc` can do on its own. Many eBook readers can use `epub` directly. To make a file compatible with Kindle, you'll then need to convert the `epub` file to `mobi` using the `kindlegen` command line command.

### Markdown to EPUB

```
pandoc -o BOOKTITLE.epub -f markdown_github -t epub SOURCE1.md SOURCE2.md
```

### Markdown to MOBI
Update: The command line method below is not working for me lately, so I am using the [Kindle Previewer](http://www.amazon.com/kindleformat/kindlepreviewer) app for conversion instead.


Kindle needs `mobi` files. You can use the `kindlegen` command line command to convert `epub` to `mobi`. I got this download trick from [this article](https://www.howtogeek.com/howto/uncategorized/linux-quicktip-downloading-and-un-tarring-in-one-step/), and the single-file-extract trick from [this article](https://www.cyberciti.biz/faq/linux-unix-extracting-specific-files/).

1. Get the most recent download url for the kindlegen "Linux Download" from the [kindlegen webpage](https://www.amazon.com/gp/feature.html?ie=UTF8&docId=1000765211).
2. Download, un-tar (unzip), and move the executable to `/usr/bin` so it will available as a command.

```
curl KINDLEGEN_DOWNLOAD_URL | tar xvz kindlegen
sudo mv kindlegen /usr/bin/kindlegen
```

Confirm you have it by restarting your terminal and running:

```
kindlegen -v
```

## Managing Custom Kindle Content
* You can add these `.mobi` files to your kindle device by emailing them to an email address Kindle gives you on the settings page.
* You can remove old drafts via Amazon in the browser under "Content and Devices." Emailed files are not under "books" which is the default view, but under "docs."





first set up `pandoc` (above)

## Markdown to Printed Booklet

### Getting the pdflatex command

To use pandoc to generate pdf you must have the `pdflatex` command line command installed. The easiest way to get that is through these texlive packages. I got this trick from [this github gist](https://gist.github.com/rain1024/98dd5e2c6c8c28f9ea9d).

```
sudo apt-get install texlive-latex-base
sudo apt-get install texlive-fonts-recommended
sudo apt-get install texlive-fonts-extra
sudo apt-get install texlive-latex-extra
```

If these succeeded you should see a version number when you run this command:

```
pdflatex -v
```

### Example PDF Command

```
pandoc --output OUTPUT_FILE_NAME.pdf  --from markdown_github+yaml_metadata_block --to latex SOURCE_FILE_1.md SOURCE_FILE_2.md
```

- `--from`: If you are using markdown pages from a Jekyll blog site, these files will be a combination of `markdown_github` and `yaml_metadata_block`, and we can combine these with the `+`.
- `--to`: to make a pdf we're using `latex` as our intermediary
- `--output`: put your destination file name here. If you want it to be a pdf, make sure the extension is `.pdf`. For troubleshooting, you can change the file extension to `.tex` to see the intermediary LaTeX file that's used to make the pdf.

### LaTeX Configuration  
The main reference for this is Pandoc's [PDF creation documentation](https://pandoc.org/MANUAL.html#creating-a-pdf).

You can put LaTeX configuration in the yaml frontmatter block in the first file, and this will apply to all following pages as well. The frontmatter needs a `---` at the top of your file, your context after that, and then another `---` after, just like Jekyll blog posts. I opted to have a separate file for just this configuration versus having it at the top of my first chapter, but that's up to you.

Gotcha: make sure your `pandoc` command's `--from` contains BOTH markdown and yaml frontmatter (see above).

#### LaTeX Booklet Settings
To get latex to export to half-sheets, here are my yaml frontmatter with the booklet settings. I got some tips from [this post](https://latex.org/forum/viewtopic.php?t=6329 https://tex.stackexchange.com/questions/393753/how-does-one-lay-out-a-book-w-2-pages-per-8-5x11). You can see the `documentclass` options visually on [this blog post](https://texblog.org/2013/02/13/latex-documentclass-options-illustrated/), and you can format them in yaml according to pandoc's [Variables for LaTeX](https://pandoc.org/MANUAL.html#variables-for-latex) section. Passing options to the `geometry` package is interesting, because you have to pass "paperheight=8.5in" as a string with quotes, not as a nested key:value pair like other things.

```
---
title: Debugging Your Brain
author: Casey Watts
documentclass: book
classoption:
- openany
geometry:
- "paperheight=8.5in"
- "paperwidth=5.5in"
---
```

* `title` and `author` go into the file's metadata as well as cover page
* `documentclass: book` sets a lot of settings to reasonable ones for us (like asymmetrical margins to account for the book binding taking up space)
* `openany` says that chapters can start on the left side pages as well as right
* `geometry` settings here specify half of a "letter" sized piece of paper (folding the 11" side to be 5.5")


#### LaTeX Double Spacing

You may want to double-space the document for reviewers to write comments in. Add this to the bottom of your yaml frontmatter.

```
---
linestretch: 2
---
```


### Adobe Booklet Printing
UPDATE: Adobe broke the ability to "print to PDF" from itself... If I had to do booklets today, I'd investigate the [pdfjam](https://github.com/rrthomas/pdfjam#documentation) tool for doing booklet formatting.

OLD ADVICE: Adobe PDF Reader has booklet printing built in! There is a "Booklet" setting under "Page Sizing & Handling". See more detailed instructions in [this Adobe help article](https://helpx.adobe.com/acrobat/using/ways-print-pdfs.html#print_a_booklet)

