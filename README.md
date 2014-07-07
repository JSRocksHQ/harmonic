![harmonic logo](harmonic-logo.png)  

# The next static site generator
> Please note that this project is currently under development. Contributions are pretty welcome!

Harmonic is being developed with some goals:  
- Learn and play with ES6 (in node and the browser)
- Build a simple static site generator in node using ES6 features
- Create the ES6 Rocks website with Harmonic! (Actually, the website is already online [ES6Rocks](http://es6rocks.com))  

Check out the full documentation in Harmonic's Wiki: [https://github.com/es6rocks/harmonic/wiki/](https://github.com/es6rocks/harmonic/wiki/)

## Installing
Attention:
Harmonic uses some ES6 features. You'll need to install the latest node version.
NVM or n is a good approach to have multiple node versions and do not break any existent node software that you already have installed. 

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

## Config
The Harmonic config file is a simple JSON object.  
You can configure your static website with the CLI _config_ command:  
```shell
harmonic config
```
![Config](https://raw.githubusercontent.com/wiki/es6rocks/harmonic/img/config.png)
For more details, check out the full documentation: [Config](https://github.com/es6rocks/harmonic/wiki/Config/)

## Blogging
Harmonic follow the pattern of others static site generators you may know.  
You must write your posts in [Markdown](http://daringfireball.net/projects/markdown/) format.  

### New post:  
```
harmonic new_post "Hello World"
```
![New Post](https://raw.githubusercontent.com/wiki/es6rocks/harmonic/img/new_post.png)

After running **_new_post_**, the markdown file will be generated in _**/src/posts/**_ folder.  

### Markdown header
The markdown file have a header which defines the post meta-data.  
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

### Markdown content
Everything after the header is the post content.  
Exemple:  
```markdown
# Hello World  
This is my awesome post using [harmonic](https://github.com/es6rocks/harmonic).  

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
  <a href="https://github.com/es6rocks/harmonic">harmonic</a>.
</p>
<p>This is a list:  </p>
<ul>
<li>Item 1</li>
<li>Item 2</li>
<li>Item 3</li>
</ul>
```
For more details, you can check the full documentation: [Blogging](https://github.com/es6rocks/harmonic/wiki/Blogging).  

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
You can specify an port, by default Harmonic will use the 9356 port:
```shell
harmonic run 9090
```

## Help
```shell
harmonic --help
```
