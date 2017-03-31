---
layout: post
title: How to use Arduino libraries with Android Things
image: /images/arduwrap-header.png
keywords: [android things, android, IoT, internet of things, Arduino]
author: marcos
---

There's a plethora of peripheral [drivers](https://github.com/androidthings/contrib-drivers) that can be installed in your Android Things application. The list just keeps on growing and it's amazing how some of those drivers were developed by community members. With Android Things if you happen to have a sensor that is not supported by the platform you can just write a driver for it. There's even a couple of [good](https://www.novoda.com/blog/writing-your-first-android-things-driver-p1/) [write-ups](http://blog.blundellapps.co.uk/tut-android-things-writing-a-pir-motion-sensor-driver/) about the subject.

A really common task when it comes to building IoT devices is to take environmental measurements such as humidity and room temperature. The one sensor that comes to mind straight away because it offers both those things is the DHT22 for it's low price and [widespread availability](http://amzn.to/2nI7hYO). I've got one of those lying around and thought I'd find a driver for it.

## The problem

I pretty quickly realised there was no driver and decided to build one. It soon became clear that this wasn't something that could be achievable at this point. While most of the drivers in the contrib library use a known protocol such as [UART](https://developer.android.com/things/sdk/pio/uart.html), [I2C](https://developer.android.com/things/sdk/pio/i2c.html) or [SPI](https://developer.android.com/things/sdk/pio/spi.html), the DHT22 uses a custom communication protocol at very high speeds. Here's some of the necessary speeds on the [datasheet](https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf) (some information in Chinese):

![DHT 22 required speeds](/images/DHT22-datasheet.png)

Notice that some of the highlighted values are talking about μs (microseconds), which is 0.001 of a millisecond. [This thread](https://code.google.com/p/android/issues/detail?id=234016&sort=-id&colspec=ID%20Type%20Status%20Owner%20Summary%20Stars) describes how in the Native SDK the GPIO speed was increased from 0.23ms to 0.15ms, which is still 150μs and nowhere near the 20-40μs required by the sensor.

That same thread describes that the delay comes from the security model in Android Things and the fact it uses Linux, which is not a real-time operating system. A conversation with a member of the Android Things team suggested the following:

> Your not likely to get consistent sub-1ms timing at the application layer. If the data on the wire is timed the same as a UART, you might be able to write/read using a custom baud rate (thats ~25K baud). Otherwise you’ll probably have to implement it on an MCU.

That MCU can be an Arduino and I know the DHT22 works well with it. So I put together [a little library](https://github.com/mplacona/arduwrap) that makes it easier to interface Android Things with an Arduino and communicate via UART.

## The Arduino
I used an [Arduino Nano](http://amzn.to/2mMzNsV) to connect my sensor but you could use any Arduino you have lying around. I have a theory that there are other MCUs that could be used for this such as an [ATTiny85](http://www.microchip.com/wwwproducts/en/ATtiny85) but haven't tested that yet.

I programed my Arduino Nano with the following code:

```cpp
#include <DHT.h>;
#define DHTPIN 2 // Arduino Pin
#define DHTTYPE DHT22   // DHT 22  (AM2302)
DHT dht(DHTPIN, DHTTYPE);

//Variables
float hum;  //Stores humidity value
float temp; //Stores temperature value

void setup() {                
  // Turn the Serial Protocol ON
  Serial.begin(115200);
  
  // Initialize device.
  dht.begin();
}

void loop() {
    int inByte = Serial.read();
    switch (inByte) {
    case 'T':
      // Return the current (T)emperature
      getTemperature();
      break;
    case 'H':
      // Return the current (H)umidity
      getHumidity();
      break;
  }
}

void getTemperature(){
  temp = dht.readTemperature();
  String value = "$";
  value += temp;
  value += "#";
  
  char charBuf[value.length()+1];
  value.toCharArray(charBuf, value.length()+1);
  
  Serial.write(charBuf);
}

void getHumidity(){
  hum = dht.readHumidity();
  String value = "$";
  value += hum;
  value += "#";
  
  char charBuf[value.length()+1];
  value.toCharArray(charBuf, value.length()+1);
  
  Serial.write(charBuf);
}
```

You can also flash this directly to your Arduino by opening up [this link](https://create.arduino.cc/editor/mplacona/db600d03-e19c-444e-891b-88f3569ba7e4/preview).

Once you have that flashed into your Arduino it's time to wire it up and connect it with the Raspberry Pi. Here's a diagram that shows how to connect, but the basic idea is that when you communicate via UART, you need to connect TX (transmitter) to RX (receiver), and vice-versa.

![Arduino and Raspberry Pi Connected](/images/arduwrap.png)

We also connected the GND pin on the Raspberry Pi to the GND on the Arduino as they need common ground if the power source is different.

## The Android Things Project
Now that we have connected the Arduino to the Raspberry Pi, let's add the library to our project. If you don't have a project yet you can get one going by following the [Get started with Android Things today!](/2017/01/03/get-started-with-android-things-today/) post or cloning [this repository](https://github.com/mplacona/HelloThings).

Open the project level `build.gradle` and add Jitpack as one of the repositories. Your `allprojects` section should end up looking like this:

```groovy
allprojects {
    repositories {
        jcenter()
        maven { url "https://jitpack.io" }
    }
}
```

Go to the application level `buid.gradle` and add a dependency to the library and sync.

```groovy
dependencies {
    ...
    compile 'com.github.mplacona:arduwrap:v0.21'
}
```

Open up `MainActivity.java` and at the bottom of the `onCreate` method create a new instance of `Arduino`. This tells our library information about our MCU. You can specify the speed, which device we're using, the start and stop bits. You can read more about these [here](https://developer.android.com/things/sdk/pio/uart.html#configuring_port_parameters) or just use the defaults if you have the exact same rig as I showed above.

```java
Arduino mArduino = new Arduino.ArduinoBuilder()
        //.uartDeviceName(UART_DEVICE_NAME)
        //.baudRate(BAUD_RATE)
        //.dataBits(DATA_BITS)
        //.stopBits(STOP_BITS)
        .build();
```

We will be using the DHT22 driver for this example so create a new instance of it passing the `Arduino` object

```java
dht22Driver = new Dht22Driver(mArduino);
        dht22Driver.startup();
```

Now you can make requests to the methods of this class which at the time of writing are `getTemperature` and `getHumidity`.

```java
Log.d(TAG, "Temperature:" + dht22Driver.getTemperature());
Log.d(TAG, "Humidity:" + dht22Driver.getHumidity());
```

And if you run the application you should see the following in the logs:

![Arduwrap temperature adn humidity logs](/images/arduwrap-logs.png)

## Limits?
There aren't many limits to this since unless your sensor is sending a lot of information back in very fast speeds, UART will just be able to handle it with no problems.

You can go ahead an add extra sensors to this and use the libraries that have been already built for the Arduino. If you do so, please make sure you contribute to the [Arduwrap repository](https://github.com/mplacona/arduwrap) with your wrapper and Arduino code. Happy hacking!