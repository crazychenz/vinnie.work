---
slug: 2021-03-19-virtualmachine-to-docker
title: "Virtual Machine To Docker"
#date: "2021-03-19T12:00:00.000Z"
description: |
  I was recently tasked at work with making some routine enhancements to an internal project that was built with toolchains that had been organized into Virtual Machines that I had to fire up. With my recent adoption of Docker as a mainline tool in my everyday work flow, I asked myself: *Why the heck am I using a hypervisor for a straight forward toolchain VM?*
---

## Background

I was recently tasked at work with making some routine enhancements to an internal project. This project was a cross platform application that needed to be built for many different architectures. Some of the toolchains were so vendor specific that the toolchains were specially installed into Virtual Machines that I had to fire up to build the code for the target platform. 

<!--truncate-->

Upon starting up the first Virtual Machine, I noticed that is was an older version of Ubuntu (Precise/12.04). With my recent adoption of Docker as a mainline tool in my everyday work flow, I asked myself: Why the heck am I using a hypervisor for a straight forward toolchain VM?

## The Problem

I'd always seen documentation and discussion on the net about converting VMs to Dockerfiles, but I'd never actually run into a use case for this. It just seemed fraught with issues related to missing dependencies, services, or devices. But in this particular case, I decided to give it a shot. What I was starting with was an OVA and I needed to somehow convert that to a docker image that I could at least get shell with.

I obviously searched the internet for "ova to docker image" and clicked through those pages. It appears this is largely an ad-hoc process with everyone having their own scripts and tools to get it done. This was understandable as any reasonable use case for this kind of conversion should be care for on a case by case basis. Meh .. lets see what we can get done in the next 30 minutes?

## The Next 30 Minutes

### Converting OVA to Raw Data

The OVA is an Open Virtual Appliance (i.e. a virtual machine with all the disks and settings in one convenient package). I'd never had a need to tear one down before, but it turns out that its nothing but a tar file. Assuming you had a MyVirtualMachine.ova, to extract its as simple as:

```
tar -xvf MyVirtualMachine.ova
```

At a minimum you should end up with an Open Virtualization Format (OVF) file and a Virtual Machine Dist (VMDK) file. At this point you *could* use any number of hypervisors to mount the vmdk and possibly extract the data that way. I don't like this because booting a kernel will populate a number of paths, devices, and special files that I don't want to clutter my docker image.

Instead of using a hypervisor, I used a tool called, `qemu-img`. This tool has the capability to convert between disk types like qcow2, vbox, and vmdk. The conversion that I really wanted though was a `raw` format. This converts the virtual disk image into a format that looks like it was extracted directly from `/dev/sda` with `dd` (i.e. a raw dump of the hard disk). Note: This can be disk space intensive because the modern virtualized disk images are compressed while the raw dumps are not. For example, a 5 GiB vmdk could easily expand into a 64 GiB file! To convert from a vmdk (MyDisk.vmdk) to a raw dump file (MyDisk.raw), run the following:

```
qemu-img -f vmdk MyDisk.vmdk -O raw MyDisk.raw
```

Depending on the disk size and your actual IO speed, this operation can take awhile. If you are a clock watcher like me, I advise opening a second terminal and running something like `watch ls -lh` to monitor the progress of the conversion. Also might be worth verifying that you can even perform the operation by checking out disk space with `df -h`.

Once you get everything converted you'll need to take a look at the partition table. This will give you a good idea of how to access the data that we need to get to create the docker image. To see the partition table of a raw disk dump, run:

```
parted -s MyDisk.raw unit b print
```

This will give you several pieces of information, including partition offsets, partition sizes, and partition types. If the partition is simple (e.g. ext, fat) you may be able to just mount it. You can do this with something like:

```
mkdir mnt
sudo mount -o loop,ro,offset=<offset> MyDisk.raw ./mnt
```

### But What If Is Using LVM?

If everything went according to plan, you should be able to see the content of the disk in the `./mnt` path. On the other hand, if the partition that contains your data is a Logical Volume Managed (lvm) disk, you've got a couple more steps before you can mount the image.

To mount a disk dump with lvm partitions, you need to setup the loop device manually:

```
losetup /dev/loop0 MyDisk.raw
```

Once you have the disk associated with the loopback device, you need to have the kernel scan its content to generate the partition devices. (This is like having `/dev/sda` as the disk device and `/dev/sda1`, `/dev/sda2` as the inner partition devices). To manually tell the system to scan your `/dev/loop0`, run:

```
partx -u /dev/loop0
```

Assuming you have LVM support installed in your system (which is very common these days) the kernel should have automatically generated the appropriate LVM mappings. You can view these mappings with:

```
sudo lvmdiskscan
```

In my particular case, because the virtual machine was a vagrant generated VM the root partition came up as `/dev/mapper/vagrant-root`. Finally! Now its just a matter of mounting the partition to a mount point:

```
mkdir mnt
sudo mount /dev/mapper/vagrant-root ./mnt
```

### The Docker Image

Ok, so now we just need to capture the entire partition as a tarball and then import that into docker with our desired docker image name:

```
tar -C mnt -czf MyDisk.tar.gz .
```

You'll notice that the tar will match the VMDK in size. This is because the tar is a compressed version of only the content of the root filesystem that you've just mounted. This is fantastic because once we get all of this done you can throw away the OVA, VMDK, and raw dump files and just keep the tar.gz as a backup.

To import the complete tar.gz into docker:

```
docker import MyDisk.tar.gz myimage:1.0
```

Now if everything went to plan, it should be a matter of running the docker with a shell, or in my case a make command with the current directory volume mounted:

```
docker run -ti --rm -v $(pwd)/work myimage:1.0 make -C /work
```

## Conclusion

In summary, I now know that toolchain VMs can be a valid use case for shedding the hypervisor. Although this is dependent on the application being compatible with the running linux kernel, working with binaries from Ubuntu 12 seem to be well within the range of compatibility with the current generation of Linux kernels.

Take aways:

- OVA are just tarballs with virtual disks and metadata.
- Virtual disks can be converted to raw disk dumps without a hypervisor.
- `losetup` and `partx` can be used to automatically setup loopback LVM.
- docker/containerization is still one of my favorite tools

## Comments

<iframe src="/comment-iframe.html" height="1024" width="100%" onLoad=""></iframe>
