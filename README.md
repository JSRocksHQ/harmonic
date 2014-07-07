![harmonic logo](harmonic-logo.png)  

# The next static site generator
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

## Blogging
Harmonic follow the pattern of others static site generators you may know.  
You must write your posts in [Markdown](http://daringfireball.net/projects/markdown/) format.  

## New post:  
```
harmonic new_post "Hello World"
```
![New Post](/wiki/es6rocks/harmonic/img/new_post.png)

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
You can check all possible header values in the [header page](markdown-header).  

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
