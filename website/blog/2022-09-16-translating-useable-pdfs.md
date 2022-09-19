---
slug: 2022-09-16-translating-useable-pdfs
title: 'Translating useable PDFs'
draft: false
---

## Background

Ever find yourself attempting to look up some esoteric part datasheet or source code library that only has documentation in a foreign language that you don't know? I do!

Often you can just drop the PDF into Google Translate and all will be well enough. But if you want more control, more fine grained translating, or just less tracking of your behavor in google, you can do it via Python.

## Dependencies

Although there are a ton a projects that sort of already do PDF translating well enough, I wanted to understand the structure of the PDF a bit more and develop my own lower level script to translate the PDF for me. A self written script both separates me from licensing issues, connectively dependencies, and as mentioned before, allows me much greater control over the translation process for any given customer or client.

The dependencies are all rather straight forward:

- `apt-get install pdftk` - used to decompress/compress the PDF
- [`pip3 install pymupdf`](https://pymupdf.readthedocs.io/en/latest/page.html) - used to parse and modify the PDF structure
- [`pip3 install googletrans==3.1.0a0`](https://py-googletrans.readthedocs.io/en/latest/) - used to initially fetch a machine translation

### PyMuPDF

PyMuPDF is the primary library I'm using to parse the PDF. I originally started looking at the raw (uncompressed) PDF structure. It made some sense but there appeared to be hundreds of key terms that I would have to interpret to effectively pull the relevant text out. Library it is!

PyMuPDF (like many PDF parsers) allow one to iterate through the document a page at a time. It then has an extractDICT() call that allows you to pull out a structure that is organized into blocks and spans. Each block is, typically, a related section of content (similar to `<div>`) and each span is a single entry of text to display (similar to `<span>`). There are other types of objects that can exist, like videos, images, and other displayable resources. For now I'm just skipping all of these, but using something like pytesseract should make this a very doable process. (PyMuPDF even has a method for calling pytesseract itself to perform OCR text extraction.)

The dictionary structure as I saw it could be simplified and expressed as:

```text
d['blocks'][n]['bbox']
d['blocks'][n]['number']
d['blocks'][n]['type']
d['blocks'][n]['lines'][x]['bbox']
d['blocks'][n]['lines'][x]['dir']
d['blocks'][n]['lines'][x]['wmode']
d['blocks'][n]['lines'][x]['spans']
d['blocks'][n]['lines'][x]['spans'][y]['bbox']
d['blocks'][n]['lines'][x]['spans'][y]['color']
d['blocks'][n]['lines'][x]['spans'][y]['flags']
d['blocks'][n]['lines'][x]['spans'][y]['font']
d['blocks'][n]['lines'][x]['spans'][y]['origin']
d['blocks'][n]['lines'][x]['spans'][y]['size']
d['blocks'][n]['lines'][x]['spans'][y]['text']
```

In plain english, its an array of blocks each of which has an array of lines which each have an array of spans. The spans each have their own text, size, and color. It would have been nice if the text size was block specific, but when I made this assumption, things went quite awry.

## Process

Without going into too much detail, each span is a string of text that I'm treating as _translatable_. There are many edge cases that can cause issues here:

- Context lost that is required for high confidence translations - This may be handled with entire block translations and then splitting block across know associated spans. This was attempted quickly and didn't have good results so leaving it out for now.
- Line continuations - this could be more intelligently handled, but would require more time investment that I have to spare at the moment.
- and so forth.

But when you ignore these edge cases the process is rather simple. I basically whiteout the old text via its bounding box, translate the original text and then add a new text box on top of the whiteout.

Due to the translated text possibly being a different size (because of characters and/or font differences) I do a reduction of font size until the text is known to fit in its original bounding box. The default is to decrease the size by 10% each iteration until it fits. This fractional reduction prevents the value from reaching zero (within a reasonable bounding box).

In the prototype implementation, I capture each translation from google translate (semi-anonymously) and store it in a dictionary that is subsequently persisted in a YAML file on disk. When ever we reload the script, it automatically loads the cached translations from the YAML, preventing re-translating, over the internet, things that have already been done. This model has the additional benefit of allowing one to tweak translations by manually updating the YAML in-between invocations of the script.

## Script

<details>
<summary>Expand to view the script source.</summary>

```python
#!/usr/bin/env python3

import pdb
import pprint

import sys
# pip3 install pymupdf
# https://pymupdf.readthedocs.io/en/latest/page.html
import fitz
# pip3 install googletrans==3.1.0a0
# https://py-googletrans.readthedocs.io/en/latest/
from googletrans import Translator

# pip3 install pyyaml
import yaml
try:
    from yaml import CLoader as Loader, CDumper as Dumper
except ImportError:
    from yaml import Loader, Dumper

SHRINK_RATE = 0.9

yellow=(1, 1, 0)
red=(1, 0, 0)
black=(0, 0, 0)
green=(0, 1, 0)
blue=(0, 0, 1)
cyan=(0, 1, 1)
purple=(1, 0, 1)
white=(1, 1, 1)

def translate(state, text):
  #return "smurf"
  if text in state['xltn']:
    return state['xltn'][text]['text']
  else:
    return text

def init_page_state(state, page):
  state['page'] = page
  tp = page.get_textpage()
  page_dict = tp.extractDICT()
  state['blocks'] = page_dict['blocks']
  return state

def init_state():
  state = {
    'xltn': {},
    'xltr': None,
    'page': None,
    'blocks': None,
  }

  # Load translation cache
  xltn_db = {}
  with open("xltn_db.yaml") as yaml_fobj:
    xltn_db = yaml.load(yaml_fobj.read(), Loader=Loader)

  # Fetch translations
  state['xltr'] = Translator()

  # Save the translation cache
  with open("xltn_db.yaml", "w") as yaml_fobj:
    yaml_fobj.write(yaml.dump(xltn_db, Dumper=Dumper))

  state['xltn'] = xltn_db

  return state

def update_xtln_db(state):
  updated = False
  for block in state['blocks']:
    for line in block['lines']:
      for span in line['spans']:
        span_text = span['text'].strip()
        if len(span_text) == 0:
          continue

        if span_text not in state['xltn']:
          updated = True
          print("Translating:")
          print(span_text)
          state['xltn'][span_text] = {
            'text': None,
            'src': None,
            'dst': None
          }
          xltn = state['xltr'].translate(span_text)
          state['xltn'][span_text]['text'] = xltn.text
          state['xltn'][span_text]['src'] = xltn.src
          state['xltn'][span_text]['dst'] = xltn.dest

  # Save the translation cache
  if updated:
    with open("xltn_db.yaml", "w") as yaml_fobj:
      yaml_fobj.write(yaml.dump(state['xltn'], Dumper=Dumper))

def whiteout_blocks(state):
  blocks = state['blocks']
  for block in blocks:
    # Create whiteout shape
    wo = state['page'].new_shape()

    # Draw rectangle "whiteout" shape.
    wo.draw_rect(fitz.Rect(block['bbox']))
    # Apply common parameters to shape.
    wo.finish(
      color=yellow,
      stroke_opacity=0,
      fill=white,
      fill_opacity=1)

    # Apply the drawing procedures to page.
    wo.commit()

def whiteout_spans(state):
  for block in state['blocks']:
    for line in block['lines']:
      for span in line['spans']:
        # Create whiteout shape
        wo = state['page'].new_shape()

        # Draw rectangle "whiteout" shape.
        wo.draw_rect(fitz.Rect(span['bbox']))
        # Apply common parameters to shape.
        wo.finish(
          color=yellow,
          stroke_opacity=0,
          fill=white,
          fill_opacity=1)

        # Apply the drawing procedures to page.
        wo.commit()

def textprint_spans(state):
  for block in state['blocks']:
    for line in block['lines']:
      for span in line['spans']:
        # No text means no work.
        if len(span['text'].strip()) == 0:
          continue

        tw = fitz.TextWriter(state['page'].rect)
        # TODO: Consider a replace() here to main whitespace.
        # Note: Translations are normalized without whitespace.
        span_text = translate(state, span['text'].strip())
        span_rect = fitz.Rect(span['bbox'])
        span_size = span['size']
        span_font = fitz.Font("helv")

        # Ensure the size fits
        max_length = span_rect.x1 - span_rect.x0
        span_width = fitz.get_text_length(span_text, fontsize=span_size)
        while span_width >= max_length:
          span_size *= SHRINK_RATE
          span_width = fitz.get_text_length(span_text, fontsize=span_size)

        # Write text to span bbox
        ##print(state['page'].rect)
        ##print(span_rect)
        tw.fill_textbox(span_rect, span_text, pos=(span_rect.x0, span_rect.y0), fontsize=span_size, font=span_font)
        tw.write_text(state['page'], color=span['color'])

def dump_debug(state):
  debug = False
  if debug:
    print("---")


# t = trans.translate("Hola Mundo", src='es', dest='en')

doc = fitz.open(sys.argv[1])

state = init_state()

for page in doc:

  print(".", end='', flush=True)

  init_page_state(state, page)

  update_xtln_db(state)

  whiteout_spans(state)

  textprint_spans(state)

  dump_debug(state)

doc.save("new.pdf")
```

</details>
<br />

To run the script, I advise something similar to the following:

```sh
mkdir pdf_name
cp /path/to/pdf_name.pdf pdf_name/
cd pdf_name
pdftk pdf_name.pdf output pdf_name-big.pdf uncompress
echo "{}" > xtln_db.yaml
/path/to/script.py pdf_name-big.pdf
pdftk new.pdf output pdf_name-translated.pdf uncompress
```

## Wish List of Improvements

- Fit the text assuming its starting at `span['origin']` and not `(0,0)` of its bounding box.
- Associating entire blocks of text for translation to retain as much context as possible.
- Reusable dictionary for caching translations. (Verbs congigations and context sensitive spellings make this complex.)
- OCR of text in images and other non-text/non-span resources.
- User friendly interface ... maybe a webserver with drag/drop?

## Conclusion

Rudamentary PDF translations are really simple! No excuse for BS PDF->text only services. :)

## Resources

- [SO: Search and replace for text within a pdf, in Python](https://stackoverflow.com/questions/41769120/search-and-replace-for-text-within-a-pdf-in-python)
- [pypdftk](https://pypi.org/project/pypdftk/)
- [PyMuPDF Github](https://github.com/pymupdf/PyMuPDF)
- [googletrans pypi](https://pypi.org/project/googletrans/)
