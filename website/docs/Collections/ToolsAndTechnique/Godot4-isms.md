---
sidebar_position: 4
title: Godot_4-isms
---

## Get Godot 4

At the time of this right, Godot 4 isn't released. [See download index here](https://downloads.tuxfamily.org/godotengine/).

## Import FBX Mesh (via Blender Export)

**Why**: It is a common practice and has the advantage of exposing the texture in the filesystem.

**How**:
- [Download FBX2glTF](https://github.com/godotengine/FBX2glTF/releases)
- Goto `Editor` Menu -> `Editor Settings` -> `Import` in Sidebar -> `FBX` Entry
- Select the install/extract location of FBX2glTF _binary_.
- Drag and drop `.fbx` folder into project and then add FBX mesh to scene.

## Import native `.blend` (Blender) files

**Why**: Work on mesh directly in Blender without export and see changes in Godot.

**How**:
- Download [Blender 3+](https://www.blender.org/download/).
- Goto `Editor` Menu -> `Editor Settings` -> `Import` in Sidebar -> `Blender` Entry
- Select the install/extract location of Blender 3 _folder_.
- Drag and drop `.blend` file into project folder and then add to scene.


