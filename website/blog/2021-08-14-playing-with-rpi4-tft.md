---
slug: 2021-08-14-playing-with-rpi4-tft
title: 'Playing With RPi 4 TFT Display and Buttons'
draft: false
---

## The Equipment

Interested in building something that doesn't require a laptop or TV for Raspberry Pi input/output, I recently purchased a TFT Display with some input buttons. It additionally included a very profession looking aluminum case with real metal button and some other goodies.

<!--truncate-->

I purchased the case and display from Geekworm: [2.4 inch Touch High PPI TFT LCD with Cooling Fan + Aluminum CNC Case](https://geekworm.com/collections/raspberry-pi/products/for-raspberry-pi-4-2-4-inch-touch-high-ppi-tft-lcd-screen-with-cooling-fan-aluminum-cnc-case) for ~$60.

While this setup includes touch support, I'm currently only interested in 4 things:

- Getting control of the display out.
- Getting control of the 5 buttons.
- Getting control of the I2C lines.
- Finding a good location for a photo resistor (for intrusion detection).

## Assembly

When I got the case in the mail, I of course immediately attempted to assemble it without reading any instructions. I think I built it backwards on my first go. Here are some quick instructions (since the geekworm docs were quite lacking.):

1. There are stand offs that you must screw the Raspberry Pi 4 base board into the case with.
2. You should then pop the display board onto the Raspberry Pi 4 base board so that he Pi's header matches the daughter board's headers. You should be able to make all of that flush with the stand offs.
3. Once you have that there you can just screw it down into the stand offs and leave everything exposed or you can add that nice cover top (w/ gold buttons) and screw that into the stand offs. (I usually keep the case top off unless I'm travelling.)

During assembly I've noted two locations that might be good for the photo resistor placement. The first is the top where the display is. A thin device could possible be surface mounted flush with the screen. An alternate, more janky location would be the side of the device opposite of the primary pin-out header. Either, I don't have the photo resistor yet, so that will have to wait.

## The Display

There actually were some instructions for the display. They mainly involved clonging a github repository: [22LCD-script](https://github.com/geekworm-com/22LCD-script), and then running a script as `sudo` from the Raspberry Pi 4. It appears that this script was originally written for the Raspberry Pi 3 2.2" TFT Display but they reused it for the 2.4" display unit.

The script did a lot of installing on my Raspberry Pi. I generally hate when there is a lot of churn for something that ultimately should have just been a 1 or 2 liner in a configuration file. At this point I haven't gone back to determine the minimal number of changes that are required to get a command line only kernel to output to the display, but I do know of 1 key change. The `/boot/config.txt` was updated with a SPI enabled, a new device tree overlay file, and some HDMI settings.

Here is a summary of the changes. I've personally annotated the HDMI settings for my personal understanding of the options.

```
dtparam=i2c_arm=on
dtparam=spi=on

# Load device tre overlay for TFT device.
# 90 degrees is buttons at bottom
# 270 degrees is buttons at top
dtoverlay=pitft28-resistive,speed=80000000,rotate=270,fps=60

# 0 - Auto from EDID, 1 - CEA, 2 - DMT
hdmi_group=2

# mode 87 (DMT): undocumented! (from no blanking setting?)
hdmi_mode=87

#hdmi_cvt=<width> <height> <framerate> <aspect> <margins> <interlace> <rb>
hdmi_cvt=320 240 60 1 0 0 0

# Use HDMI even if its disconnected.
hdmi_force_hotplug=1
```

My assumption is that if you aren't using XWindow, you can simply ensure that any kernel objects referenced by pitft28-resistive and the above settings in the `/boot/config.txt` will suffice for getting the display up and running.

### Display Observations

- 320x240, easy on the eyes and quite usable from the 2.4" device. While this looks great on the 2.4" screen, the 1080HD display from the TV became laughably unusable. My four year old said it looked like Minecraft.
- 640x480, while legible, required more effort to see the individual characters. This is probably a nice medium if you needed to use the TV and the 2.4" display at the same time.
- 1920x1080, it actually works!, but is completely not legible on the 2.4" screen. The output on the tiney screen resembled the output of the code map on the side of VS Code.

## The Buttons

This is where geekworm really fell flat. There was little to no documentation except for some documentation referencing the 2.2" screen. Naturally I was skeptical about this because version to version the IO can change. If you look at the actual board you'll see that next to each button is a `#` number:

```
#5 - X
#22 - Triangle
#23 - Square
#17 - Diamond
#4 - Button next to SDCard.
```

These number are the GPIO numbers from the linux kernel. When I tested them, `#4`, `#5`, and `#22` worked fine, but `#23` and `#17` wouldn't do anything. I tested this by using the `/sys/class/gpio` interface.

Here is a `test.sh` script to read the state of the GPIO:

```
#!/bin/bash

pushd /sys/class/gpio>/dev/null
echo $1 >export 2>/dev/null
cd gpio$1 && cat value && cd ..
popd>/dev/null
```

Then all I needed to do was run the commands:

```
# Hold Down X Button
pi@raspberrypi:~ $ ./test.sh 5
0
# Release X Button
pi@raspberrypi:~ $ ./test.sh 5
1
# Hold Down Triangle Button
pi@raspberrypi:~ $ ./test.sh 22
0
# Release Triangle Button
pi@raspberrypi:~ $ ./test.sh 22
1
```

When I originally did this with the Square and Diamond buttons I didn't get any change between holding the button and releasing the buttons. Ultimately this was due to some misconfigured GPIO registers. GPIO 23 and GPIO 17 were booting up with their state set to have a pull down resistor while the workin pins were using pull up resistors. To quickly test this out I cloned a github repository for a GPIO register tool: [raspi-gpio](https://github.com/RPi-Distro/raspi-gpio).

Once that was built, running `./raspi-gpio get` will dump all the registers:

Here is the output of the relevant registers:

```
...
GPIO 4: level=1 func=INPUT pull=UP
GPIO 5: level=1 func=INPUT pull=UP
...
GPIO 17: level=0 func=INPUT pull=DOWN
...
GPIO 22: level=1 func=INPUT pull=UP
GPIO 23: level=0 func=INPUT pull=DOWN
...
```

Notice that the `level` and the `pull` of `#23` and `#17` don't match the rest? The level is `0` because the pin is being pulled low (i.e. down). If we flip the resistance so that it's pulled up the level will be `1`. (Note: No buttons should be pressed when using `raspi-gpio` to see its _default_ state.)

Now we'll fix `#17` and `#23` with the following.:

```
./raspi-gpio set 17 pu
./raspi-gpio set 23 pu
./raspi-gpio get
```

The result should resemble:

Here is the output of the relevant registers:

```
...
GPIO 4: level=1 func=INPUT pull=UP
GPIO 5: level=1 func=INPUT pull=UP
...
GPIO 17: level=1 func=INPUT pull=UP
...
GPIO 22: level=1 func=INPUT pull=UP
GPIO 23: level=1 func=INPUT pull=UP
...
```

Now when you run `test.sh`, it should return the correct result:

```
# Hold Down Square Button
pi@raspberrypi:~ $ ./test.sh 23
0
# Release Square Button
pi@raspberrypi:~ $ ./test.sh 23
1
# Hold Down Diamond Button
pi@raspberrypi:~ $ ./test.sh 17
0
# Release Diamond Button
pi@raspberrypi:~ $ ./test.sh 17
1
```

In summary, I need to find out what part of the device tree is setting (or not setting) pins `#17` and `#23` and see how to have them setup correctly from `/boot/config.txt`.

## The I2C

I don't currently have access to an I2C logical analyzer so this'll have to wait. My plan here is to purchase a couple I2C I/O expanders and a logic analyzer. From this I should be able to configure a mock dongle/key for unlocking the device for a maintenance mode. Using the logic analyzer you should be able to visualize the I/O expander values as they are passed over the I2C.

## Conclusion

I've now get a TFT diplay and button input working for the Raspberry Pi. Now I just need to code up an applicance looking application.
