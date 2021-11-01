# Logic Analyzer Notes

[GUI: PulseView & sigrok-cli](https://sigrok.org/wiki/Downloads)

To get anything that resembles the correct baud you need high frequency. Higher frequency means more samples to increase capture window. Helps to set a trigger (level high) for Rx signal.



## Pico

Need to update certificates before running pico-setup.sh

```text
fatal: unable to access 'https://git.savannah.nongnu.org/git/lwip.git/': server certificate verification failed. CAfile: none CRLfile: none
```

apt-get install ca-certificates

... Expects to run from armhf.


## BlueTag

https://github.com/Aodrulez/blueTag/blob/main/README.md

Hold boot sel, copy uf2 file. Reboot. Connect to serial with 115200 8N1.

