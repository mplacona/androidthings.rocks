---
layout: post
title: Get started with Android Things today!
image: /images/android-heart-pi-header.png
keywords: [android things, android, IoT, internet of things, brillo, get started with android things]
description: This article will take you through all the steps for getting started with Android Things and building your first IoT project using Android on a Raspberry Pi 3.
author: marcos
---

Android Things is a very frictionless Android OS that helps developers build IoT applications using the Android framework and tools. You can read more about it on [What really is Android Things]({% post_url 2017-01-01-what-really-is-android-things %}). Let's have a look at how to get started with Android Things today.

## Our tools
The instructions described here have been tested on a Mac, but should be easily interchangeable with any other operating system.

Android developers will already have most of the necessary tools to get started with Android Things, but here's what we will need. 

- [Android Studio](https://developer.android.com/studio/index.html)
- A Raspberry Pi 3 - You can [get one here](http://amzn.to/2isZ6uN) if you don't already have one lying around.
- A micro SD card with at least 8GB and an adapter so you can flash it. I have [this one](http://amzn.to/2i0a4H9), but anything will do.
- A copy of the [latest  Android things preview image](https://developer.android.com/things/preview/download.html) for Raspberry Pi.
- [SD Card Formatter](https://www.sdcard.org/downloads/formatter_4/)
- An ethernet cable connected to your router.

## Flashing the image
The Android Things website has instructions about [how to flash the image](https://developer.android.com/things/hardware/raspberrypi.html#flashing_the_image), but I found that buggy hard to follow so here's what I did.

Open up the zip file you downloaded with Android things preview and there should be a file called `iot_rpi3.img` inside of it. If you got the file, feel free to skip the next heading.

### But I hit a snag!
I hit a snag here where the extracted file was called `androidthings_rpi3_devpreview_2.zip.cpgz`, and extracting that would give me a file called `androidthings_rpi3_devpreview_2 1.zip` and this would go on pretty much forever. I found [this article](http://osxdaily.com/2013/02/13/open-zip-cpgz-file/) partially helpful.

The gist of it is that you need to unzip the file via terminal, but using the methodology described on the website returned something like this:

```bash
Archive:  androidthings_rpi3_devpreview_2.zip
warning [androidthings_rpi3_devpreview_2.zip]:  76 extra bytes at beginning or within zipfile
  (attempting to process anyway)
error [androidthings_rpi3_devpreview_2.zip]:  reported length of central directory is
  -76 bytes too long (Atari STZip zipfile?  J.H.Holm ZIPSPLIT 1.1
  zipfile?).  Compensating...
   skipping: iot_rpi3.img            need PK compat. v4.5 (can do v2.1)

note:  didn't find end-of-central-dir signature at end of central dir.
  (please check that you have transferred or created the zipfile in the
  appropriate BINARY mode and that you have compiled UnZip properly)
```

Our file is in there as you can see, but just using the `unzip` command does not extract it. 7zip was able to extract it though. You can install it by running:

```bash
$ brew install p7zip
$ 7za x androidthings_rpi3_devpreview_2.zip
```

### Formatting the memory card
Insert the memory card on your Computer and you may get a message saying:

> The disk you inserted was not readable by this computer.

This means this disk already had another image installed. Don't worry, just hit ignore. 

Open up SD Card Formatter, choose the SD Card and hit format.

![SD Card Formatter](/images/SDFormatter.png)

In your terminal run `diskutil` and identify the disk number for your memory card.

```bash
$ diskutil list
/dev/disk2 (external, physical):
#:                       TYPE NAME                    SIZE       IDENTIFIER
0:     FDisk_partition_scheme                        *8.1 GB     disk2
1:                 DOS_FAT_32 NO NAME                 8.1 GB     disk2s1
```

Unmount that disk:

```bash
$ diskutil unmountDisk /dev/disk2
Unmount of all volumes on disk2 was successful
```

We're ready to flash the Android Things image to the disk. From the directory where your `*.img` file is run:

```bash
$ sudo dd bs=1m if=iot_rpi3.img of=/dev/rdisk2
```

Make sure you change the value of `/dev/rdisk2` to the number you got from when you run `diskutil list`. So if you got `disk4` for example, you should run the command above with `/dev/rdisk4`.

This can take some time, so go get yourself some coffee. You are flashing over 4GB into that SD card, and depending on it's speed this can take anywhere from 5 to 15 minutes.

When the flashing is completed, your computer should give you the "The disk you inserted was not readable by this computer." message again. We're done with this bit.

### Booting up the image
Get the memory card off your computer and insert it into the Raspberry Pi 3. I prefer to have it connected to a screen at this point as it gives me the confidence everything went ok.

Connect the Pi's micro-usb to your computer and if you connected it to a screen you should see Android things booting up

![Android Things first boot](/images/android-things-boot.png)

Great! But as you can see in the screen, we have no connectivity, which means we won't be able to get adb to connect to it. Thus making it impossible for us to upload our first application to our device. And this part of the documentation is not amazingly clear.

> After flashing your board, it is strongly recommended to connect it to the internet. This allows your device to deliver crash reports and receive updates.

But then I guess this is what the "I" in IoT means right?

## Connecting to the Internet
Disconnect the Pi from your computer to power it down, and connect the ethernet cable on it. Now power it up again, and you should see that this time when it powers up it's assigned an IP Address.

![Android Things first boot](/images/android-things-ethernet.png)

Go back to your terminal an enter the following command:

```bash
$ adb connect Android.local
connected to Android.local:5555
```

`Android.local` is automatically broadcast by the Raspberry Pi, and should resolve to the IP address assigned to your Pi on port 5555, so in our example the command above is the same as running `adb connect 192.168.0.23:5555`.

Running `adb devices` on your terminal should now list your Pi in the devices list. But having a cable always connected is a pain, so let's configure it to connect to our home WiFi.

### Connecting to your WiFi
Back in your terminal enter the following:

```bash
$ adb shell am startservice \
    -n com.google.wifisetup/.WifiSetupService \
    -a WifiSetupService.Connect \
    -e ssid <Network_SSID> \
    -e passphrase <Network_Passcode>
```

Make sure you replace `<Network_SSID>` with your network name and `<Network_Passcode>` with your network's password. From [reading about the Raspberry Pi 3](http://raspberrypi.stackexchange.com/a/43311), it seems it's only able to connect to 2.4Ghz networks since it's only got one WiFi antenna.

Running the command above will get your Pi connected to the WiFi. If you still have it up on the screen you will see that it gets an IP address assigned to it soon after you run it. You can now remove the ethernet cable from it. I found that restarting it again is best though as it guarantees the device is not `offline`.

## Running your first Hello Things application
This wouldn't be a complete tutorial if we didn't run an application to make sure Android was actually running on our Raspberry Pi as expected. You can continue following this through or just clone this application's repository [here](https://github.com/mplacona/HelloThings).

In Android Studio, create a new project called `Hello Things`. Android Things runs on API 24 and above, so make sure you pick Nougat or above and start that with an empty activity.

Head to your application level Gradle file and add a dependency to Android Things.

```groovy
dependencies {
    ...
    provided 'com.google.android.things:androidthings:0.2-devpreview'
}
```

Now head to the application's manifest and add an entry to the shared library and modify the intent filters.

```xml
<application
    android:label="@string/app_name">
    <uses-library android:name="com.google.android.things"/>
    <activity android:name=".MainActivity">
        <!-- Launch activity as default from Android Studio -->
        <intent-filter>
            <action android:name="android.intent.action.MAIN"/>
            <category android:name="android.intent.category.LAUNCHER"/>
        </intent-filter>

        <!-- Launch activity automatically on boot -->
        <intent-filter>
            <action android:name="android.intent.action.MAIN"/>
            <category android:name="android.intent.category.IOT_LAUNCHER"/>
            <category android:name="android.intent.category.DEFAULT"/>
        </intent-filter>
    </activity>
</application>
```

Lastly, head to `hellothings/MainActivity.java` and change the `onCreate` method to list all the available peripherals on our Raspberry Pi.

```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    PeripheralManagerService service = new PeripheralManagerService();
    Log.d(TAG, "Available GPIO: " + service.getGpioList());
}
```

This will return us with a list of every available General-purpose input/output (GPIO) in our Raspberry Pi.

```
01-02 19:40:52.589 1636-1636/rocks.androidthings.hellothings D/MainActivity: Available GPIO: [BCM12, BCM13, BCM16, BCM17, BCM18, BCM19, BCM20, BCM21, BCM22, BCM23, BCM24, BCM25, BCM26, BCM27, BCM4, BCM5, BCM6]
```

Also, if you still have your Pi connected to a screen, you will see that the activity called `Hello Things` was started.

![Android Things application running](/images/hello-things.png)

Now go ahead and play with some of the other samples on the [Android Things website](https://developer.android.com/things/sdk/samples.html).