![harmonic logo](harmonic-logo.png)  

# Harmonic - The next static site generator
> Please note that this project is currently under development. Contributions are pretty welcome!

Harmonic is being developed with some goals:  
- Learn and play with ES6 (in node and the browser)
- Build a simple static site generator in node using ES6 features
- Create the ES6 Rocks website with Harmonic! (Actually, the website is already online [ES6Rocks](http://es6rocks.com))  

## Installing
Clone the harmonic repository:  
```shell
git clone git@github.com:es6rocks/harmonic.git
```

Install:  
```shell
cd harmonic
npm install
npm link
```
For more details, check out the full documentation: [Installing](/wiki/Installing)

##Init
Harmonic init command helps you to create your harmonic configuration file.  
```shell
harmonic init
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
