---
title: Creating a Panic Button with Android Things
image: /images/panicbutton/button.jpg
keywords: [android things, android, IoT, internet of things, raspberrypi]
author: Roberto Estivill
description: How to build a panic button using Android Things and Twilio
---

[Panic Button][link2] is an Android application targeting [Android Things]({% post_url 2017-01-03-get-started-with-android-things-today %}) that integrates with [Twilio](https://www.twilio.com/try-twilio) to deliver SMS's or phone calls to a configured phone number when a physical button is pressed.

Wow, that's a lot of buzzwords. Let's break it down and build one.

## The Idea

I have been an Android Developer for the last few years and I recently got a Raspberry Pi 3 as a gift. 
I was interested in getting one since Android Things was announced but for some reason never did. Now the excuses are over, and it's time to play with it.

I have also been very interested in services that link the physical world to the internet, and vice versa. 

Considering that Android Things connects hardware to the internet, why not come back to the disconnected world and receive a plain old SMS or a Phone call to close the circle?

## The Hardware

This was the part of the project that I was most intimidated about. 

I do not have any sort of electronic or electrical experience whatsoever, but I have to say that this circuit is really simple to put together.

Here's the list of hardware components you will need for this project:

- A Raspberry Pi 3 - You can [get one here](http://amzn.to/2isZ6uN) if you don't already have one lying around.
- A 400 point breadboard for easy prototyping - Get one [here](http://amzn.to/2i6aboD)
- A tactile button - Get a lot of them [here](http://amzn.to/2snS26s) and be covered forever
- A 12Ω Ohm resistor (Brown, Red, Black, Gold) - Get yourself a [bunch of them in different values](http://amzn.to/2i6b0xG) as they will always come in handy
- Male to Female and Male to Male jumper wires - Get them [here](http://amzn.to/2jkUbLM)

Here is the diagram with the layout of the components:

![Hardware circuit][img1]

If you tried the [SimplePIO sample][link1] button project in the past, you might have realised that it is exactly the same circuit.

## Twilio account setup

You will need to [create a Twilio account][link6] to configure the application with the correct credentials.

The free trial account provides enough resources to experiment and play around with this project.

Once signed up, head over to the [console][link7] to get the first piece of information we need: the `ACCOUNT_SID`

![Twilio - Console][img3]


### API Key

You will also need to generate an `API Key` to access the [REST API][link5]. 

Browse to [`Developer Center / API Keys`][link8] and create a new key by pressing the [`+`][link9] red button.

Enter a friendly name, and click `Create API Key`. After this you will see a very important screen where the `API_KEY` and `API_SECRET` will be displayed. Make sure your write this two strings somewhere (especially the secret), as you will not be able to see it again after leaving that screen.

![Twilio - API Key][img2]

### Phone Numbers

Next step is to choose a Twilio phone number. This will be the origin number calling or sending the SMS.

Browse to [All Products & Services / Phone Numbers / Manage Numbers][link10] and create a new phone number by pressing the [`+`][link12] red button.

Make sure to select `SMS` and `Voice` in the capabilities section when selecting the phone number.

![Twilio - Caller phone number][img4]

Finally, due to a restriction on Twilio's trial account, we need to verify the phone number that will receive the phone call and/or SMS. 

Browse to [All Products & Services / Phone Numbers / Verified Caller IDs][link11] and validate your phone number by receiving a phone call or an SMS with the usual verification code.

![Twilio - Receiver phone number][img5]

## Twilio API

In order to authenticate our application against the API, we need to use the `API_KEY` and the `API_SECRET` to create a [Basic Http Authentication][link13] header. 

In other words, we need to send a header with the name `Authorization` with the value of `Basic base64( API_KEY : API_SECRET )`

If we want to receive a phone call from Twilio to our verified phone number, we need to perform a request to the `/Calls` API endpoint:

```properties
POST https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}/Calls
Authorization: Basic {API_KEY}:{API_SECRET}

From=TWILIO_PHONE_NUMBER&
To=VERIFIED_PHONE_NUMBER&
Url=TWIML_URL
```

Alternately, if we want to receive an SMS, we will have to send the following API request to `/Messages`:

```properties
POST https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}/Messages
Authorization: Basic {API_KEY}:{API_SECRET}

From={TWILIO_PHONE_NUMBER}&
To={VERIFIED_PHONE_NUMBER}&
Body={TEXT_MESSAGE}
```

> _Note: the url's and parameters are case sensitive!_

## Show me the code!

First of all, we need to add your Twilio configuration to the project. 
Open the `gradle.properties` file at the root of the project and enter your  configuration:


```properties
PANIC_BUTTON_PHONE_NUMBER_FROM="{ORIGIN PHONE NUMBER}"
PANIC_BUTTON_PHONE_NUMBER_TO="{TARGET PHONE NUMBER}"
PANIC_BUTTON_TWILIO_ACCOUNT="{TWILIO ACCOUNT SID}"
PANIC_BUTTON_TWILIO_API_KEY="{TWILIO API KEY}"
PANIC_BUTTON_TWILIO_API_SECRET="{YOUR TWILIO API SECRET}"
```

Gradle will pickup this properties at build time, and with a little bit of configuration on the [build.gradle][code1], add them to the `BuildConfig` class so the application code can access them as final static variables.

With all the config out of the way, let's take a high level look at the main classes in the project.

[`TwilioClient`][code3] is a very simple http wrapper built on top of [`OkHttp`][link14].

This class is responsible for implementing the Twilio API's details mentioned in the previous section. 
Also, it exposes two public methods that invokes the correspondent API: `sms()` and `call()`.


```java
public void sms() { 
  Log.d(TAG, "Sending SMS request...");

  RequestBody formBody = new FormBody.Builder()
      .add("From", BuildConfig.PHONE_NUMBER_FROM)
      .add("To", BuildConfig.PHONE_NUMBER_TO)
      .add("Body", "SMS text body")
      .build();

  Request.Builder builder = new Request.Builder()
      .url(BASE_URL + "/Messages")
      .post(formBody);

  execute(builder);
}
```	

In order to decide if we should send an SMS or request a phone call, we first need to detect what kind of event was generated by the hardware button.

The wanted the application to trigger an SMS request if the event is a `simple press` and to perform a phone call request if the event happens to be a `long press`. 

[`GpioEventCallback`][code4] takes care of handling the events from the `Gpio` and deciding the type of event based on the duration of the button being pressed.

You can think of this class as a listener for the `click down` and `click up` events, that also counts the amount of time between them and compares it to `LONG_PRESS_DELAY_MS` to decide wether the event was a `single press` or a `long press`.

Once it knows what kind of event was generated, it takes care of invoking the correct method on `TwilioClient`.

```java
private static final long LONG_PRESS_DELAY_MS = 600;

private TwilioClient twilio;
private long pressStartedAt;

@Override public boolean onGpioEdge(Gpio gpio) {
  boolean gpioValue;
  try {
    gpioValue = gpio.getValue();
  } catch (IOException e) {
    Log.e(TAG, "Error reading PIO value.", e);
    return true;
  }

  // gpioValue == false, button pressed
  // gpioValue == true, button released

  if (!gpioValue) {
    pressStartedAt = System.currentTimeMillis();
  } else {
    long duration = System.currentTimeMillis() - pressStartedAt;
    if ( duration < LONG_PRESS_DELAY_MS) {
      twilio.sms();
    } else {
      twilio.call();
    }
  }
}
```

Lastly, we need to create an [`Activity`][code5] to connect all this pieces together, and for the system to be able to launch our application.


```java
@Override protected void onCreate(Bundle savedInstanceState) {
  super.onCreate(savedInstanceState);

  OkHttpClient httpClient = new OkHttpClient();
  TwilioClient twilio = new TwilioClient(httpClient);
  GpioEventCallback callback = new GpioEventCallback(twilio);

  try {
    String pinName = BoardDefaults.getGPIOForButton();
    mButtonGpio = new PeripheralManagerService().openGpio(pinName);
    mButtonGpio.setDirection(Gpio.DIRECTION_IN);
    mButtonGpio.setEdgeTriggerType(Gpio.EDGE_BOTH);
    mButtonGpio.registerGpioCallback(callback);
  } catch (IOException e) {
    Log.e(TAG, "Error on PeripheralIO API", e);
  }
}

```

Now let's connect to our Raspberry Pi 3, build the application and install it on the device

```terminal
$ adb connect {YOUR DEVICE IP}
* daemon not running. starting it now on port 5037 *
* daemon started successfully *
connected to {YOUR DEVICE IP}:5555

$ ./gradlew installDebug

$ adb shell am start com.robertoestivill.panicbutton/.PanicButtonActivity
```

And this is the project in action

<div align="center">
  <iframe width="640" height="480" src="https://www.youtube.com/embed/t-7_qHqTxUA"> </iframe>
</div>

## Next steps

It was super fun to work on a project that involves physical things and I can not wait to play more. I hope you find this project as interesting and educational as I did.

There are a lot of improvements and fixes that can be incorporated to make a more robust and sophisticated application. This was just a proof of concept. 

Checkout the full source code and more details about the project on the [Github repository][link2].

If you have any comments or feedback feel free to contact me [@robertoestivill][link4]


[link1]: https://github.com/androidthings/sample-simplepio#button
[link2]: https://github.com/robertoestivill/panic-button
[link3]: https://www.youtube.com/watch?v=t-7_qHqTxUA
[link4]: https://twitter.com/robertoestivill
[link5]: https://www.twilio.com/docs/api/rest
[link6]: https://www.twilio.com/try-twilio
[link7]: https://www.twilio.com/console
[link8]: https://www.twilio.com/console/dev-tools/api-keys
[link9]: https://www.twilio.com/console/dev-tools/api-keys/create
[link10]: https://www.twilio.com/console/phone-numbers/incoming
[link11]: https://www.twilio.com/console/phone-numbers/verified
[link12]: https://www.twilio.com/console/phone-numbers/search
[link13]: https://en.wikipedia.org/wiki/Basic_access_authentication
[link14]: https://github.com/square/okhttp

[img1]: /images/panicbutton/circuit.png
[img2]: /images/panicbutton/twilio-apikeys.png
[img3]: /images/panicbutton/twilio-dashboard.png
[img4]: /images/panicbutton/twilio-numbers.png
[img5]: /images/panicbutton/twilio-numbers2.png

[code1]: https://github.com/robertoestivill/panic-button/blob/master/application/build.gradle
[code2]: https://github.com/robertoestivill/panic-button/blob/master/application/src/main/java/com/robertoestivill/panicbutton/PanicButtonActivity.java
[code3]: https://github.com/robertoestivill/panic-button/blob/master/application/src/main/java/com/robertoestivill/panicbutton/TwilioClient.java
[code4]: https://github.com/robertoestivill/panic-button/blob/master/application/src/main/java/com/robertoestivill/panicbutton/GpioEventCallback.java
[code5]: https://github.com/robertoestivill/panic-button/blob/master/application/src/main/java/com/robertoestivill/panicbutton/PanicButtonActivity.java
