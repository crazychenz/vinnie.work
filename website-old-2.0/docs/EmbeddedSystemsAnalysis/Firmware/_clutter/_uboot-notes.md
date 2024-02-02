```
q87 
wt54gv40

ssh -oKexAlgorithms=+diffie-hellman-group1-sha1 123.123.123.123


## Building U-Boot

https://andrei.gherzan.ro/linux/uboot-on-rpi/

https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-a/downloads

apt-get install bison flex u-boot-tools

wget https://developer.arm.com/-/media/Files/downloads/gnu-a/10.3-2021.07/binrel/gcc-arm-10.3-2021.07-x86_64-aarch64-none-elf.tar.xz
tar -xf gcc-arm-10.3-2021.07-x86_64-aarch64-none-elf.tar.xz
export TOOLCHAIN=$(pwd)/gcc-arm-10.3-2021.07-x86_64-aarch64-none-elf/bin

git clone https://github.com/agherzan/u-boot.git u-boot
cd u-boot/
git checkout ag/v2019.07-rpi4-wip
CROSS_COMPILE=$TOOLCHAIN/aarch64-none-elf- make rpi_4_defconfig
CROSS_COMPILE=$TOOLCHAIN/aarch64-none-elf- make -j8

cat << EOF > boot.cmd
fdt addr \${fdt_addr} && fdt get value bootargs /chosen bootargs
fatload mmc 0:1 \${kernel_addr_r} uImage
bootm \${kernel_addr_r} - \${fdt_addr}
EOF

mkimage -A arm64 -T script -C none -n "Boot script" -d "boot.cmd" boot.scr

### Inside boot partition

export KERNEL=kernel8
export SDCARD=/bootpart
mkimage -A arm64 -O linux -T kernel -C none \
  -a 0x00008000 -e 0x00008000 -n "Linux kernel" \
  -d $SDCARD/$KERNEL $SDCARD/uImage

cp $UBOOT_BUILD_DIR/u-boot.bin $SDCARD/$KERNEL
cp $UBOOT_BUILD_DIR/boot.scr $SDCARD
echo "enable_uart=1" >> $SDCARD/config.txt
sync
umount $SDCARD
```