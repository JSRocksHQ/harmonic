# Harmonic - The next static site generator
> Please note that this project is currently under development. Contributions are pretty welcome!

Harmonic is being developed with some goals:  
- Learn and play with ES6 (in node and the browser)
- Build a simple static site generator in node with ES6 features
- Create the ES6 Rocks website with Harmonic!

## How to start
You'll need the last version of [node](http://nodejs.org/)(Current stable is v0.10.28 and latest is 0.11.13).  
In my tests i'm using node version v0.11.12.  
Check your node version:  
```shell
node --version
```

## Installing on linux
```shell
git clone https://github.com/es6rocks/harmonic.git
cd harmonic
./install.sh
```
## installing manually
1 - Create a file "nodeHarmony" in your path /usr/local/bin with the following code:
```shell
#!/bin/sh
node --harmony "$@"
```
2 - Give the right permission:
```shell
sudo chmod a+x nodeHarmony
```

Now, if your run in your console:  
```shell
nodeHarmony myfile.js
```
You will be running node with harmony flag.  
Harmonic depends on this configuration.

3 - Install the dependencies:  
```
[sudo] npm install
```
4 - Harmonic is not available on npm (yet), so you need to run the following code to get harmonic on your global path:  
```
npm link
```

## Build
Harmonic is currently in alpha, but you already can generate posts, and the index page.  
Just as usual, create your posts in the "/src/posts" folder using markdown syntax.  
You'll need to especify a header for each post.  
Example:
```
<!--
layout: post
title: post test
date: 2014-01-17 00:33
comments: true
published: true
keywords: JavaScript, ES6
description: my post description
categories: my-category
-->
```

Now, just build your awesome website!  
```shell
harmonic build
```

## New Post
To create a new post, just run:
```shell
harmonic new_post "my awesome post"
```

## Run
To run your static server:
```shell
harmonic run
```
You can specify an port, by default Harmonic will use the 9356 port:
```shell
harmonic run 9090
```

## Help
```shell
harmonic --help
```
