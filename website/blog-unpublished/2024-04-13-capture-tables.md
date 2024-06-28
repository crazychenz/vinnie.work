---
slug: 2024-03-31-full-packet-capture
title: 'Full Packet Capture'
draft: false
---

https://www.slideshare.net/slideshow/models-for-hierarchical-data/4179181
https://www.slideshare.net/billkarwin/recursive-query-throwdown
https://stackoverflow.com/questions/192220/what-is-the-most-efficient-elegant-way-to-parse-a-flat-table-into-a-tree/192462#192462
https://github.com/reddit-archive/reddit
https://solr.apache.org/

<!-- truncate -->

```sql
CREATE TABLE types (id BIGSERIAL, name VARCHAR(8), desc TEXT)
CREATE TABLE attrs (id BIGSERIAL, name VARCHAR(8), desc TEXT, type_id INT);

; kinds include ("comment", "post", "user")
; may include things like upvotes, downvotes, owner, creationdate
CREATE TABLE things (id BIGSERIAL, kind VARCHAR(8));
CREATE TABLE txt_datas (id BIGSERIAL, thing_id BIGINT, attr VARCHAR(64), val TEXT);
CREATE TABLE paths (id BIGSERIAL, ancestor BIGINT, descendant BIGINT, depth INT);
```

User _creates_ a _post_.

```sql
INSERT INTO things (kind) VALUES ('post') RETURNING id;
;_returns id:1_
INSERT INTO txt_datas (thing_id, attr, val) VALUES (1, 'text', 'This is a test post');
; depth is implicitly 0
INSERT INTO paths (ancestor, descendant, depth) SELECT ancestor, 1, 0 FROM paths WHERE descendant = 1 UNION ALL SELECT 1, 1, 0;
```

User _replies_ to a _post_.

```sql
INSERT INTO things (kind) VALUES ('comment') RETURNING id;
;_returns id:2_
INSERT INTO txt_datas (thing_id, attr, val) VALUES (2, 'text', 'Why did you make that post?');
; depth is descendants depth + 1
INSERT INTO paths (ancestor, descendant, depth) SELECT ancestor, 2, depth+1 FROM paths WHERE descendant = 1 UNION ALL SELECT 2, 2, 0;
```

User _replies to a _comment_.

```sql
INSERT INTO things (kind) VALUES ('comment') RETURNING id;
;_returns id:3_
INSERT INTO txt_datas (thing_id, attr, val) VALUES (3, 'text', 'Because I felt like it.');
INSERT INTO paths (ancestor, descendant, depth) SELECT ancestor, 3, depth+1 FROM paths WHERE descendant = 2 UNION ALL SELECT 3, 3, 0;
```

User _replies to the _post_.

```sql
INSERT INTO things (kind) VALUES ('comment') RETURNING id;
;_returns id:4_
INSERT INTO txt_datas (thing_id, attr, val) VALUES (4, 'text', 'Cool post, love it!');
; depth is implicitly 0
INSERT INTO paths (ancestor, descendant, depth) SELECT ancestor, 4, depth+1 FROM paths WHERE descendant = 1 UNION ALL SELECT 4, 4, 0;
```

User _replies to a _comment_.

```sql
INSERT INTO things (kind) VALUES ('comment') RETURNING id;
;_returns id:5_
INSERT INTO txt_datas (thing_id, attr, val) VALUES (3, 'text', 'Oh ok, fine then.');
INSERT INTO paths (ancestor, descendant, depth) SELECT ancestor, 5, depth+1 FROM paths WHERE descendant = 3 UNION ALL SELECT 5, 5, 0;
```

Get all post(id:1) _comments_.

```sql
select t.* from things t JOIN paths p ON (t.id = p.descendant) WHERE p.ancestor=1 AND t.kind='comment';
```

Get all post(id:1) comments from first(id:2) and second(id:4) comment branch.

```sql
select t.* from things t JOIN paths p ON (t.id = p.descendant) WHERE p.ancestor=1 AND t.kind='comment';
select t.* from things t JOIN paths p ON (t.id = p.descendant) WHERE p.ancestor=4 AND t.kind='comment';
```

Get the first 1 levels/depth of comments from post(id:1).

```sql
select t.* from things t JOIN paths p ON (t.id = p.descendant) WHERE p.ancestor=1 AND p.depth=1 AND t.kind='comment';
```

Get the first 1 levels/depth of comments 1 level down.

```sql
select t.* from things t JOIN paths p ON (t.id = p.descendant) WHERE p.ancestor=2 AND p.depth=1 AND t.kind='comment';
```


Insert as child of 0.

```sql
INSERT INTO comments VALUES (0, 0, 0, "First post!") RETURNING id;

INSERT INTO comment_paths (ancestor, descendant)
  SELECT ancestor, **ID** FROM comment_paths
  WHERE descendant = 0
  UNION ALL SELECT **ID**, **ID**;
```


## Comments

<Comments />