![harmonic logo](harmonic-logo.png)  
[![Build Status](https://travis-ci.org/es6rocks/harmonic.svg?branch=master)](https://travis-ci.org/es6rocks/harmonic)  

# The next static site generator
[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/es6rocks/harmonic?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
> Please note that this project is currently under development. Contributions are very welcome!

Harmonic is being developed with some goals:  
- Learn and play with ES6 (in node and the browser)
- Build a simple static site generator in node using ES6 features
- Create the ES6 Rocks website with Harmonic! (Actually, the website is already online [ES6Rocks](http://es6rocks.com))  

Check out the full documentation in Harmonic's Wiki: [https://github.com/es6rocks/harmonic/wiki/](https://github.com/es6rocks/harmonic/wiki/)

## Installing
**Attention:**  
Harmonic uses some ES6 features. You will need to install Node.js >= 0.11.13.  
Using a Node.js version manager, such as [nvm](https://github.com/creationix/nvm) or [n](https://github.com/visionmedia/n), is a good approach to have multiple Node.js versions and not break any existing Node.js software that you already have installed.  

Harmonic is available on npm:  

```shell
npm install harmonic -g
```
For more details, check out the full documentation: [Installing](https://github.com/es6rocks/harmonic/wiki/Installing)

## Init
First thing you will need to do is to initialize a new Harmonic website.  
It is as simple as:  
```shell
harmonic init [PATH]
```
[PATH] is your website dir. The default path is the current dir.  
Harmonic will prompt you asking for some data about your website:   
![Config](https://raw.githubusercontent.com/wiki/es6rocks/harmonic/img/config.png)  

Harmonic will then generate a config file, which is a simple JSON object.  
Any time you want, you can configure your static website with the CLI `config` command:  
```shell
cd [PATH]
harmonic config
```
Now, enter in your website dir and you are ready to start [creating posts](#blogging)!  
For more details, check out the full documentation: [Config](https://github.com/es6rocks/harmonic/wiki/Config/)

## Blogging
Harmonic follows the same pattern as others static site generators that you may know.  
You must write your posts in [Markdown](http://daringfireball.net/projects/markdown/) format.  

### New post:  
```
cd your_awesome_website
harmonic new_post "Hello World"
```
![New Post](https://raw.githubusercontent.com/wiki/es6rocks/harmonic/img/new_post.png)

After running `new_post`, a markdown file will be generated in the `/src/posts/[lang]` folder, ready for editing.  

#### Markdown header
The markdown file have a header which defines the post metadata.  
Example:  
```markdown
<!--
layout: post
title: hello world
date: 2014-05-17T08:18:47.847Z
comments: true
published: true
keywords: JavaScript, ES6
description: Hello world post
categories: JavaScript, ES6
authorName: Jaydson
-->
```
You can check all possible header values in the [header page](https://github.com/es6rocks/harmonic/wiki/markdown-header).  

#### Markdown content
Everything after the header is the post content.  
Exemple:  
```markdown
# Hello World  
This is my awesome post using [Harmonic](https://github.com/es6rocks/harmonic).  

This is a list:  
- Item 1
- Item 2
- Item 3
```
The code above will be parsed to something like this:  
```html
<h1 id="hello-world">Hello World</h1>
<p>
  This is my awesome post using 
  <a href="https://github.com/es6rocks/harmonic">Harmonic</a>.
</p>
<p>This is a list:  </p>
<ul>
<li>Item 1</li>
<li>Item 2</li>
<li>Item 3</li>
</ul>
```
For more details, you can check the full documentation: [Blogging](https://github.com/es6rocks/harmonic/wiki/Blogging).  
## New Page
```
cd your_awesome_website
harmonic new_page "Hello World Page"
```
After running `new_page`, a markdown file will be generated in the `/src/pages/[lang]` folder, ready for editing.  

## Build
The build tool will generate the index page, posts, pages, categories, compile styles and ES6.
```shell
harmonic build
```

## Run
To run your static server:
```shell
harmonic run
```
You can specify a port, by default Harmonic will use the 9356 port:
```shell
harmonic run 9090
```

## Help
```shell
harmonic --help
```
