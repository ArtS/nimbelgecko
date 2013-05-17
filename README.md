Nimbelgecko Twitter Reader
===========

Did you ever open your Twitter and wondered **"what the hell is happening here?"**, when looking 
at all those self-absorbed, solipsistic status updates like *"om nom nom I jsut had an awesomest burrito!"* 
that were mixed together with really usefull awesome stuff such as tech news or any other things of your liking?

Well, I did too. That's why I set out to make a simple, noise-reducing, signal-increasing Twitter client.


How it works
------------
The reader consists of two parts: 

- *server.js*, a web server that supplies all the static and dynamic content to clients
- *receiver.js*, an API client that connects to Twitter and fetches the updates in realtime, using Streaming 
APIs (https://dev.twitter.com/docs/streaming-apis)

To reduce the noise, I separete the incoming stream of consciousnes (that is tweets) into three broad categories:
- solipsism - text-only tweets
- potential goodies - these are tweets with links
- EGO STUFF - well, that's all your tweets, replies to you, RTs, mentionings and alike.

So end user experience is rather simple and looks something like this:

![Reader UI screenshot](https://raw.github.com/ArtS/nimbelgecko/master/mockups/screenshot.png)
