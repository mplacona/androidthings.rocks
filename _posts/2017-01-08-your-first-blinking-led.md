---
title: Your first blinking LED with Android Things
image: /images/android-things-rocks-panel.gif
keywords: [android things, android, IoT, internet of things, brillo, get started with android things, first android things project, resistor, LED]
description: In this article you will learn how to blink your first LED using Android Things and just a couple of other components.
author: Marcos Placona
---

Now that we know [how to get started with Android Things]({% post_url 2017-01-03-get-started-with-android-things-today %}), it's time for us to blink our first [LED](https://en.wikipedia.org/wiki/Light-emitting_diode).

An LED is just like a tiny light-bulb with two legs (leads). When those leads are powered correctly the LED emits lights depending on its colour. Let's look at how to control an LED from an Android application.

## Our tools
 - [Android Studio](https://developer.android.com/studio/index.html)
 - A [Raspberry Pi 3](http://amzn.to/2isZ6uN) with [Android Things](https://developer.android.com/things/hardware/index.html) - You can see how to flash it [here]({% post_url 2017-01-03-get-started-with-android-things-today %})
 - LEDs - You can get a bunch of them [here](http://amzn.to/2juyL2V)
 - Male to Female and Male to Male jumper wires - Get them [here](http://amzn.to/2jkUbLM)
 - A 400 point breadboard - Get one [here](http://amzn.to/2i6aboD)
 - A 220Ω Ohm resistor (Red, Red, Brown, Gold) - Get yourself a [bunch of them in different values](http://amzn.to/2i6b0xG) as they will always come in handy

> The list of materials above along with links is just my suggestion to get you going quickly (all links are Amazon Prime & have my affiliate ID). Feel free to order anywhere you prefer.

There's a very comprehensive explanation for all the components we've used above on the [Android Things website](https://developer.android.com/things/hardware/hardware-101.html) in case you want to know more.

## Connections
It is important to keep in mind that LEDs are polarised, which means you need to make sure you power it correctly or you will damage it. In a regular LED you will have a `cathode` and an `anode` terminal which represent the negative and positive sides respectively.

![LED cathode and anode](/images/led-cathode-anode.png){: .center-image }

Lets start off by connecting the LED and resistor to the breadboard. As a rule of thumb, remember that the long leg on the LED is always the `anode` (positive).

The resistor can go either side and either way of the LED, though I always like to connect it to the positive side as it's easier to remember.

![LED and resistor on breadboard](/images/blink-things-01.png){: .center-image }

Connect the `BCM6` pin on the Raspberry Pi to the other and of the resistor, and one of the 0v (Ground) ports on the Raspberry Pi to the other end of the LED. Information on the Raspberry Pi 3 I/O ports can be found [here](https://developer.android.com/things/hardware/raspberrypi-io.html).

![LED and resistor on breadboard hooked to Raspberry Pi](/images/blink-things-02.png){: .center-image }

## Programming it
Now that we're all hooked up, let's go ahead and open up the `HelloThings` project we created before or clone it in a different folder.

```
git clone git@github.com:mplacona/HelloThings.git
```
You can also download the finished code in [this repository](https://github.com/mplacona/BlinkThings) or carry on with the instructions.

Open up `hellothings/MainActivity.java` and add the following static and member variables at the top of the class and resolve the dependencies to `Handler` and `Gpio`:

```java
private static final int INTERVAL_BETWEEN_BLINKS_MS = 1000;
private static final String LED = "BCM6";

private Handler mHandler = new Handler();
private Gpio mLedGpio;
```

Change the `onCreate` method so it opens up a new connection to our `LED` pin and continuously posts a runnable to change the state of that pin.

```java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    setContentView(R.layout.activity_main);

    PeripheralManagerService service = new PeripheralManagerService();

    try {
        mLedGpio = service.openGpio(LED);
        mLedGpio.setDirection(Gpio.DIRECTION_OUT_INITIALLY_LOW);
        Log.i(TAG, "Start blinking LED GPIO pin");
        mHandler.post(mBlinkRunnable);
    } catch (IOException e) {
        Log.e(TAG, "Error on PeripheralIO API", e);
    }
}
```

Create the runnable inside the class. This will toggle the state of our `LED` pin.

```java
private Runnable mBlinkRunnable = new Runnable() {
    @Override
    public void run() {
        if (mLedGpio == null) {
            return;
        }
        try {
            // Toggle the GPIO state
            mLedGpio.setValue(!mLedGpio.getValue());
            Log.d(TAG, "State set to " + mLedGpio.getValue());
            mHandler.postDelayed(mBlinkRunnable, INTERVAL_BETWEEN_BLINKS_MS);
        } catch (IOException e) {
            Log.e(TAG, "Error on PeripheralIO API", e);
        }
    }
};
```

The `setValue` method on `mLedGpio` takes a boolean, so by passing its current value with the exclamation mark in front of, we always switch it to the opposite. 

We then use `INTERVAL_BETWEEN_BLINKS_MS` to control the frequency in which we blink our LED. You can change that value to have an LED that blinks faster or slower.

Lastly, let's make sure we clean after ourselves by closing the GPIO port we opened in `onCreate` by overriding the `onDestroy` method.

```java
@Override
protected void onDestroy() {
    super.onDestroy();
    mHandler.removeCallbacks(mBlinkRunnable);
    Log.i(TAG, "Closing LED GPIO pin");
    try {
        mLedGpio.close();
    } catch (IOException e) {
        Log.e(TAG, "Error on PeripheralIO API", e);
    } finally {
        mLedGpio = null;
    }
}
```

## Party time
Run the app on your Raspberry Pi and you should see that as soon as it's installed the LED will start flashing.

But this is only the tip of the iceberg. The Pi has 15 GPIO pins which means you can add at least 15 more LEDs and even more if you [multiplex](https://en.wikipedia.org/wiki/Charlieplexing) it. Have a play with multiple colours and different logic.