---
layout: post
title: What really is Android Things?
image: /images/android-things-header.png
keywords: [android things, android, IoT, internet of things, brillo]
author: marcos
---

Google announced Android Things (then codenamed Brillo) at Google I/O 2015 with the intent for it to be used with low-power and memory constrained IoT devices. But what really is Android Things?

In December 2016 the OS was released in Developer Preview and re-branded as [Android Things](https://developer.android.com/things/hardware/index.html). At the time of writing, the developer preview offers support for [Intel Edison](https://developer.android.com/things/hardware/edison.html), [NXP Pico](https://developer.android.com/things/hardware/pico.html), and the [Raspberry Pi 3](https://developer.android.com/things/hardware/raspberrypi.html).

## What's different?
The beauty of having Android running on a device like the ones above is that the level of friction a developer would normally encounter when getting started with a technology like this is minimal if they already have some experience with the Android tooling like [Android Studio](https://developer.android.com/studio/intro/index.html) along with the [Android SDK](https://developer.android.com/guide/index.html) and [Google Play Services](https://developers.google.com/android/guides/overview).

> Now any Android developer can quickly build a smart device using Android APIs and Google services, while staying highly secure with updates direct from Google. 

Android Things also integrates with [Google Weave](https://developers.google.com/weave/), which enables communication between devices using Google Cloud Services. That is the same technology currently used by Philips Hue and Samsung SmartThings.

## How about security?
Over the past few months there's been an influx of IoT devices hacked or exposed. Hilariously most of them didn't really have any kind of security features at all.

- [Hacked home devices caused massive Internet outage](http://www.usatoday.com/story/tech/2016/10/21/cyber-attack-takes-down-east-coast-netflix-spotify-twitter/92507806/)
- [IoT security is hilariously broken and getting worse](http://arstechnica.com/security/2016/01/how-to-search-the-internet-of-things-for-photos-of-sleeping-babies/)

Android Things gets its updates directly from Google, which means the OS can only be patched through Google's own servers along with any security fixes and your own over-the-air updates to the software you run on your devices.

## Where do I start?
You can download the Developer Preview software from the [Android Things website](https://developer.android.com/things/preview/index.html) and flash it to a Raspberry Pi 3 you have lying around or [just get one](http://amzn.to/2isZ6uN) to get started.