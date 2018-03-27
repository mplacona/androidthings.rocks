---
title: Controlling 64 LEDs with Android Things
image: /images/max-7219/header.png
keywords: [android things, android, IoT, internet of things, max7219]
author: Marcos Placona
description: How to use a MAX7219 to control up to 64 LEDs using Android Things
---
With a Raspberry Pi 3 you get access to 26 general purpose input/output pins (GPIO). That is to say you could potentially attach 26 different things to your Raspberry Pi and be able to control them individually.

That is more than enough for most tasks, but sometimes it just won't be enough. A good example of that is if you try to control one of these.

![Heartbeat animation](/images/max-7219/heartbeat2.gif){: .center-image }

A matrix display like the above has 64 individual LEDs that can be controlled. Let's look at how we can go around that by only using 3 GPIOs in the Raspberry Pi.

## Multiplexing
If we had 64 GPIOs in the Raspberry Pi we would be able to control each of those LEDs individually, but would also end up in a mess of wiring because each one of the LEDs needs to be connected individually to each pin and ground. To avoid that, we will have our LEDs positioned as a matrix as follows.

![LED Matrix Schematics](/images/max-7219/matrix-schematics.png){: .center-image }

Through multiplexing we switch between the rows of the matrix very fast (about 800 times a second). That gives the impression all the Leds are constantly on, while in reality they just flicker very, very fast. The big advantage of this trick is that at every single point of time no more than 8 Leds (one row) are lit.

We will use a driver called [MAX7219](https://www.maximintegrated.com/en/products/power/display-power-control/MAX7219.html) to do the heavy lifting for us and all we need to do is have it hooked up to our Raspberry Pi and tell it what to do and which LEDs to light.

## Our tools
 - [Android Studio](https://developer.android.com/studio/index.html)
 - A [Raspberry Pi 3](http://amzn.to/2isZ6uN) with [Android Things](https://developer.android.com/things/hardware/index.html) - You can see how to flash it [here]({% post_url 2017-01-03-get-started-with-android-things-today %})
 - Male to Female and Male to Male jumper wires - Get them [here](http://amzn.to/2jkUbLM)
 - An LED Matrix display with a MAX7219 hooked up to it. Get it [here](http://amzn.to/2v5UkfI)
 - A 400 point breadboard - Get one [here](http://amzn.to/2i6aboD)

 > The list of materials above along with links is just my suggestion to get you going quickly (all links are Amazon Prime & have my affiliate ID). Feel free to order anywhere you prefer.

## The process
We are using an LED matrix here as it will make it much easier for us to control the LEDs neatly without having to do too much wiring. We could however build our own matrix as shown above and wire it up if we wanted to and end up with the same result.

The matrix comes with five headers where two are VCC and Ground, and the remaining three connect to the Raspberry Pi via [SPI](https://developer.android.com/things/sdk/pio/spi.html). We will connect the matrix as follows:

![LED Matrix Connected](/images/max-7219/pi-max7219.png){: .center-image }

So that is:
 - VCC -> 5v
 - GND -> Ground
 - DIN -> SPI0 (MOSI)
 - CS -> SPI0 (SS0)
 - CLK -> SPI0 (SCLK)

With those all connected, we're ready to start a new project in Android Studio.

## Building the APP
In Android Studio start a new project and give it a jazzy name. I called mine `The Matrix`.

![Project Setup 1 - Project Details](/images/max-7219/project-1.png){: .center-image }

Because I'm using Android Studio 3.0, it comes with the option to create an Android Things project. If you are using an earlier version of Android Studio you will need to add the libraries manually. You can see how to do that in [this blog post]({% post_url 2017-01-03-get-started-with-android-things-today %}).

![Project Setup 2 - Form Factor](/images/max-7219/project-1.png){: .center-image }

On the next screen you just need to make sure you choose the option for your project to have an empty activity, click `next` and then `finish`.

When the project is created, open you application level `build.gradle` file and add a dependency to the [MAX7219 library](https://github.com/mplacona/androidthings-MAX72XX-driver) for Android Things.

```groovy
dependencies {
    // ...
    compile 'rocks.androidthings:max72xx-driver:0.2'
}
```

Let Gradle do it's thing and synchronize. Once it's done, we will head over to the MainActivity and initialise the library as follows.

```java
class MainActivity : Activity() {
    lateinit var ledControl: MAX72XX
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialise our matrix
        for (i in 0..ledControl.getDeviceCount() - 1) {
            ledControl.setIntensity(i, 15)
            ledControl.shutdown(i, false)
            ledControl.clearDisplay(i)
        }

        ledControl = MAX72XX("SPI0.0", 1)
    }
}
```
Where we create a new instance of MAX72XX, we're telling the driver we're using "SPI0" and only one matrix. These matrix modules can be chained together if you want to scroll text on them. We then initialise it with the maximum LED intensity and clear the display in case anything was being displayed before.

Let's look at how we light a single pixel in this matrix. With it being a matrix, we can control it by columns and rows and it's index starts at 0, just like an array. So id we wanted to light the first LED on the left-upper-corner we would write code like this.

```java
ledControl.setLed(0, 0, 0, true)
```
So that's us saying: "Light up module 0, row 0 and column 0". The last argument determines whether the LED state is on or off. Go ahead and try lighting up a few of the LEDs in the matrix to see if you got the hang of it. Here's a good one:

```java
ledControl.setLed(0, 0, 0, true)
ledControl.setLed(0, 0, 7, true)
ledControl.setLed(0, 7, 7, true)
ledControl.setLed(0, 7, 0, true)
```

![Matrix sample](/images/max-7219/matrix-sample-1.png){: .center-image }

What if we wanted to light entire rows or columns in one go? We can use the `setRow` and `setColumn` methods the same way where we pass a `Byte` value as the argument to define which LEDs on that row or column we want to light up or shut down.

So the following example would light up every other LED in row 0.

```java
ledControl.setRow(0, 0, 0b10101010.toByte())
```
And we could do the same for columns as following:

```java
ledControl.setColumn(0, 0, 0b10101010.toByte())
```

![Matrix sample 2](/images/max-7219/matrix-sample-2.png){: .center-image }

With that knowledge we can now start drawing other things on the screen in sequences such as this delightful smiley face.

![Matrix sample 3](/images/max-7219/matrix-sample-3.png){: .center-image }

```java
val smiley = byteArrayOf(
    0b00111100.toByte(),
    0b01000010.toByte(),
    0b10100101.toByte(),
    0b10000001.toByte(),
    0b10100101.toByte(),
    0b10011001.toByte(),
    0b01000010.toByte(),
    0b00111100.toByte()
)

for (row in 0..7) {
    ledControl.setRow(0, row, smiley[row])
}
```        

## Bonus
You can even do animations like the beating heart below with this very small code snippet.

![Matrix sample 4](/images/max-7219/beating-heart.gif){: .center-image }

```java
val HEART_0 = byteArrayOf(0.toByte(), 102.toByte(), 255.toByte(), 255.toByte(), 255.toByte(), 126.toByte(), 60.toByte(), 24.toByte())
val HEART_1 = byteArrayOf(0.toByte(), 36.toByte(), 126.toByte(), 126.toByte(), 60.toByte(), 24.toByte(), 0.toByte(), 0.toByte())

var heartMode = true
val heartHandler = Handler(mainLooper)
heartHandler.postDelayed(object : Runnable {
    override fun run() {
        val image = if(heartMode){
            HEART_0
        }else{
            HEART_1
        }
        heartMode = !heartMode
        for (row in 0..7) {
            ledControl.setRow(0, row, image[row])
        }
        heartHandler.postDelayed(this, 2000)
    }
}, 10)
```

## Closing

I would love to hear what you do with it. Ping me on Twitter [@marcos_placona](https://twitter.com/marcos_placona) to tell me more!

> You can download the entire code for this post [here](https://github.com/mplacona/AndroidThings-HueController).