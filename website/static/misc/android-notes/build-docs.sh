#!/usr/bin/env bash

# sudo apt-get update
# sudo apt-get install pandoc
# sudo apt install texlive-xetex texlive-latex-extra librsvg2-bin
# sudo apt install texlive-fonts-extra

# adjustbox babel-german background bidi collectbox csquotes everypage filehook
# footmisc footnotebackref framed fvextra letltxmacro ly1 mdframed mweights
# needspace pagecolor sourcecodepro sourcesanspro titling ucharcat
# unicode-math upquote xecjk xurl zref draftwatermark

# tlmgr install soul adjustbox babel-german background bidi collectbox csquotes everypage filehook footmisc footnotebackref framed fvextra letltxmacro ly1 mdframed mweights needspace pagecolor sourcecodepro sourcesanspro titling ucharcat unicode-math upquote xecjk xurl zref draftwatermark

# Optionally Install From Upstream
# wget https://github.com/jgm/pandoc/releases/download/<version>/pandoc-<version>-1-amd64.deb
# sudo dpkg -i pandoc-<version>-1-amd64.deb
# sudo apt -f install   # to fix any missing dependencies

# pandoc *.md --toc --number-sections --pdf-engine=xelatex -o book.pdf

CHAPTERS="1-initial-app-inspect.md
2-initial-platform-inspect.md
3-setup-adb-environment.md
4-setup-emulator.md
5-sniffing-app-net-traffic.md
6-building-an-apk.md
7-static-apk-analysis.md
8-dynamic-with-frida.md
9-change-release-apk.md
10-dynamic-with-jdwp.md
11-aosp.md
12-jvmdebugger.md
13-additional-topics.md
14-realistic-use-case.md"

# --number-sections
# --listings

echo "Building PDF."
pandoc metadata.yaml $CHAPTERS --toc --pdf-engine=xelatex --template=template/eisvogel.tex -o book.pdf

echo "Building EPUB."
pandoc metadata.yaml $CHAPTERS --toc -o book.epub

