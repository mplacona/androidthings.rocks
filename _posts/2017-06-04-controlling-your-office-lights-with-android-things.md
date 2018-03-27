---
title: Controlling your office lights with Android Things
image: /images/philips-hue/header.jpg
keywords: [android things, android, IoT, internet of things, philips hue]
author: Marcos Placona
description: How to control your Philips Hue office lights with Android Things
---
I love the [Philips Hue light bulbs](http://www2.meethue.com/en-gb/) and have them in a few places around my house. Being able to turn the lights on or off using my mobile phone or even voice commands is great! 

I'm also a big fan of changing the colours based on my mood or what I'm actually working on but opening the app to change the presets can really kill my concentration. I wish there were buttons I could quickly press to get the colours to change...

Let's build an Android Things app that changes the light bulb colours by the press of a button using the [Philips Hue API](https://www.developers.meethue.com/).

## Our tools
 - [Android Studio](https://developer.android.com/studio/index.html)
 - A [Raspberry Pi 3](http://amzn.to/2isZ6uN) with [Android Things](https://developer.android.com/things/hardware/index.html) - You can see how to flash it [here]({% post_url 2017-01-03-get-started-with-android-things-today %})
 - A 400 point breadboard - Get one [here](http://amzn.to/2i6aboD)
 - Male to Female and Male to Male jumper wires - Get them [here](http://amzn.to/2jkUbLM)
 - 4 1KΩ resistors (Brown, Black, Red, Gold) - Get yourself [a bunch of them in different values](http://amzn.to/2i6b0xG) as they will always come in handy
 - 4 tactile buttons to serve as a triggers. Get them in [many colours](http://amzn.to/2jNKHco) for added fun
 - A Philips Hue light bulb with a bridge. you can get them [here](http://amzn.to/2rH5PYS)

 > The list of materials above along with links is just my suggestion to get you going quickly (all links are Amazon Prime & have my affiliate ID). Feel free to order anywhere you prefer.

## <a name="credentials"></a>Credentials
To talk to Hue's API, we first need to get our credentials. This [Getting Started](https://www.developers.meethue.com/documentation/getting-started) guide will take you through all the necessary steps. 

Once you've completed it use the `Clip API debugger` shown on the link above, make a `GET` request to list all your light bulbs. We want to control our office light bulb remember?

`http://<bridge ip address>/api/<authorised user code>/lights`

![JSON Light Bulb information](/images/philips-hue/02-lightbulb-info.png){: .center-image }

The ID of the light bulb you want to control is the root node of that item as highlighted in pink above. So if i wanted to turn of my light I would make a `PUT` request to `http://<bridge ip address>/api/<authorised user code>/lights/<ID>/state` passing this JSON payload: `{"on":false}`

Give that a go and if you've got it all working we can now move to our circuit.

![Light bulb animation](/images/philips-hue/03-lightbulb-on-off.gif){: .center-image }

## Controls

Our circuit is very simple as it only consists of a few buttons that are directly connected to the PI's GPIO and a few resistors.

![Breadboard representation](/images/philips-hue/04-sketch-philips-hue.png){: .center-image }

Every resistor is connected to V+ and the other leg of the button is connected to GND. On the other side, we connect the leg directly opposite to the resistor to `BCM26`, `BCM19`, `BCM13` and `BCM6` respectively. 

In the diagram I'm using wires of different colours to represent the colours each one of my buttons will change the light bulb to.

We should write some code to control these buttons though.

## Building the APP
In android studio create a new Android project with an empty activity called "Hue Controller" with Kotlin support and make sure you set the SDK to 24 or above.

![New Android Things project](/images/philips-hue/01-project.png){: .center-image }

Open the application level `build.gradle` and add the following dependencies to the project.

```groovy
dependencies {
    ...
    compile 'com.squareup.retrofit2:retrofit:2.3.0'
    compile 'com.squareup.okhttp3:logging-interceptor:3.8.0'

    provided 'com.google.android.things:androidthings:0.4-devpreview'
    compile 'com.google.android.things.contrib:driver-button:0.3'
}
```

We will be using [Retrofit](http://square.github.io/retrofit/) to make HTTP requests to the Hue API along with Android Things and the [button driver](https://github.com/androidthings/contrib-drivers/tree/master/button). Gradle will then ask to sync the project, so let it do its thing.

In `AndroidManifest.xml` add the Internet permission and a new `Intent-Filter` to make sure our application is launched at boot.

```xml
   <uses-permission android:name="android.permission.INTERNET" />

    <application
        ...
            <!-- Launch activity automatically on boot -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.IOT_LAUNCHER"/>
                <category android:name="android.intent.category.DEFAULT"/>
            </intent-filter>
        </activity>
    </application>
```

We can start really coding our application by opening `MainActivity.kt` and adding references to our buttons at the top of the class.

```java
class MainActivity : Activity() {
    lateinit var redButton: Button
    lateinit var greenButton: Button
    lateinit var blueButton: Button
    lateinit var greyButton: Button
```

You should resolve the `Button` dependency using `com.google.android.things.contrib.driver.button.Button` as we're dealing with hardware buttons here.

In the `onCreate` initialise the four buttons as follows:

```java
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    redButton = Button("BCM26", Button.LogicState.PRESSED_WHEN_LOW)
    greenButton = Button("BCM19", Button.LogicState.PRESSED_WHEN_LOW)
    blueButton = Button("BCM13", Button.LogicState.PRESSED_WHEN_LOW)
    greyButton = Button("BCM6", Button.LogicState.PRESSED_WHEN_LOW)
```

For each of the buttons create an event listener that will be called every time one of the buttons is pressed.

```java
    redButton.setOnButtonEventListener( { _, _ -> Log.d("BUTTON", "Red pressed!") })
    greenButton.setOnButtonEventListener( { _, _ -> Log.d("BUTTON", "Green pressed!") })
    blueButton.setOnButtonEventListener( { _, _ -> Log.d("BUTTON", "Blue pressed!") })
    greyButton.setOnButtonEventListener( { _, _ -> Log.d("BUTTON", "Grey pressed!") })
```

Let's make sure we connected everything up correctly by running the application and pushing each one of the buttons. You should end up with logs that looks similar to this:

```
06-04 16:51:49.987 3932-3932/rocks.androidthings.huecontroller D/BUTTON: Red pressed!
06-04 16:51:55.987 3932-3932/rocks.androidthings.huecontroller D/BUTTON: Green pressed!
06-04 16:52:03.987 3932-3932/rocks.androidthings.huecontroller D/BUTTON: Blue pressed!
06-04 16:52:07.987 3932-3932/rocks.androidthings.huecontroller D/BUTTON: Grey pressed!
```

If all your buttons worked, we should now be able to code the second part of this app, which is where we start interacting with the Hue API.

Create a new Kotlin interface called `Hue.kt` alongside `MainActivity.kt` and add the following code to it.

```java
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.PUT
import okhttp3.RequestBody
import okhttp3.ResponseBody

interface Hue {
    @PUT("/api/<authorised user code>/lights/<ID>/state")
    fun ControlLight(@Body params: RequestBody): Call<ResponseBody>
}
```

Make sure you replace the contents of `<authorised user code>` and `<ID>` with the details you got earlier in the [Credentials](#credentials) section.

Now create a new Kotlin class called `RestApi.kt` and initialise Retrofit

```java
import okhttp3.MediaType
import okhttp3.OkHttpClient
import okhttp3.RequestBody
import okhttp3.ResponseBody
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Call
import retrofit2.Retrofit

class RestApi {
    private val hueApi: Hue
    init {
        val logging = HttpLoggingInterceptor()
        logging.level = HttpLoggingInterceptor.Level.BODY
        val httpClient = OkHttpClient.Builder().addInterceptor(logging).build()

        val retrofit = Retrofit.Builder()
                .baseUrl("<bridge ip address>")
                .client(httpClient)
                .build()

        hueApi = retrofit.create(Hue::class.java)
    }
}
```

Make sure you replace `<bridge ip address>` with the IP address for your Hue bridge. We're also adding some logging so we can see that the requests are made correctly. This will be helpful later on in case something goes wrong.

Still inside the `RestApi.kt` class, add methods to be invoked by each one of the buttons and one method to convert a string into a valid [`RequestBody`](https://square.github.io/okhttp/3.x/okhttp/okhttp3/RequestBody.html).

```java
fun makeRed(): Call<ResponseBody> = hueApi.ControlLight(convertRequestBody("""{"on":true, "hue":0}"""))

fun  makeGreen(): Call<ResponseBody> = hueApi.ControlLight(convertRequestBody("""{"on":true, "hue":25500}"""))

fun  makeBlue(): Call<ResponseBody> = hueApi.ControlLight(convertRequestBody("""{"on":true, "hue":46920}"""))

fun turnOff(): Call<ResponseBody> = hueApi.ControlLight(convertRequestBody("""{"on":false}"""))

private fun convertRequestBody(body: String): RequestBody = RequestBody.create(MediaType.parse("text/plain"), body)
```

The first three methods set a different colour to our lights, while `turnOff` just turns the lights off. You can see some of the other colours in [this page](https://www.developers.meethue.com/documentation/core-concepts).

Let's go back to our `MainActivity.kt` and change it so pressing the buttons call the methods we just defined above.

In each one of the event listeners, we're now going to make a request to our API for each one of the colours we're using.

```java
// Event Listener
redButton.setOnButtonEventListener( { _, _ -> val call = hueApi.makeRed(); call.enqueue(callbackHue) })
greenButton.setOnButtonEventListener( { _, _ -> val call = hueApi.makeGreen(); call.enqueue(callbackHue) })
blueButton.setOnButtonEventListener( { _, _ -> val call = hueApi.makeBlue(); call.enqueue(callbackHue) })
greyButton.setOnButtonEventListener( { _, _ -> val call = hueApi.turnOff(); call.enqueue(callbackHue) })
```

They now return a callback which will tell us whether the request was successful or not. We've defined that in a variable called `callbackHue` which we define as follows.

```java
private val callbackHue: Callback<ResponseBody> = object : Callback<ResponseBody> {
    override fun onResponse(call: Call<ResponseBody>, response: retrofit2.Response<ResponseBody>) {
        Log.d(TAG, response?.body().toString())
    }

    override fun onFailure(call: Call<ResponseBody>, t: Throwable) {
        Log.d("ERROR", "Failure " + t.message)
    }
}
```

You can choose to do anything you want with the response, but for brevity we're only logging the response or the error.

Run the app again and and press one of the coloured buttons and you should see that your lights change to that colour. When you want to turn the lights off, just press the grey button and the lights will go off.

## Let there be lights...
Being able to control your lights using buttons connected directly to the Pi is great, but now that you know how to use the Hue API with it, you could build an application that will change the light colours depending on other things.

Have a look a the [high five machine]({% post_url 2017-05-20-how-to-build-a-high-five-machine-with-android-things-and-firebase %}) for example. Wouldn't it be nice to also change the colours when you get a new follower? Or turn it red when you lose one?

I would love to hear what you do with it. Ping me on Twitter [@marcos_placona](https://twitter.com/marcos_placona) to tell me more!

> You can download the entire code for this post [here](https://github.com/mplacona/AndroidThings-HueController).