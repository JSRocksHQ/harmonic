# Themes

_**Introduced in Harmonic@0.1.0**_

Harmonic themes are based on the awesome [Nunjucks](https://mozilla.github.io/nunjucks/).  
Basically, if you want to create a Harmonic theme, you can use all the Nunjucks features.  
Harmonic themes are [npm packages](https://www.npmjs.com/), meaning you can easily share and use community themes.

## How to create a Harmonic theme

### npm package

First, you'll need to create a `npm` package:

```bash
mkdir harmonic-theme-awesome
cd harmonic-theme-awesome
npm init
```

Configure your npm package the way you want.  
In the end, you'll have a `package.json`.

### Building your theme

Harmonic themes must implement 3 template files:

- index.html (theme main page)
- post.html (post page for a blog)
- page.html (for an page)

Also, you can create your own structure, like a `partials` directory with your html partials.  

index example:

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>{{ config.title }}</title>
</head>
<body>

    {% include "partials/navigation.html" %}
    <header>
        <section>
            <h1>
                {{ config.title }}
            </h1>
        </section>
    </header>

{% include "partials/footer.html" %}

</body>
</html>
```

___Static files___ must be placed in a folder called `resources`.  
Everything inside this folder will be copied.  
You can also provide a `config.json` file that will be merged with the current Harmonic config.  
Example:

```json
{
    "mycustomdata": "wow",
    "foo": "bar",
    "baz": ["a", "b"]
}
```

Here's a sample theme structure (actually, the harmonic-theme-default uses this structure):

```
.
├── config.json
├── index.html
├── package.json
├── page.html
├── partials
│   ├── footer.html
│   ├── header.html
│   └── navigation.html
├── post.html
├── README.md
├── resources
│   ├── css
│   │   └── main.css
│   ├── images
│   │   ├── flag-en.jpg
│   │   └── flag-pt-br.jpg
│   └── js
│       └── main.js
└── tag_archives.html
```

## Using your theme

If you're developing a new theme, you will most likely want to test it locally before publishing it.  
To test your theme locally, you can just install it like any other npm package, but pointing to its path:

```bash
npm install ../harmonic-theme-awesome
```

Then edit your `harmonic.json` and set `"theme": "harmonic-theme-awesome"`.

Note: To install the theme you must first init a new Harmonic project, or use an existing one:

```bash
harmonic init "my_blog"
cd my_blog
npm install ../harmonic-theme-awesome
```

## Faster development

To avoid having to `npm install` your theme every time you make changes, you may instead [`npm link`](https://docs.npmjs.com/cli/link) your theme to a Harmonic project:

```bash
# suppose you have a Harmonic theme named `harmonic-theme-awesome` in this dir:
cd harmonic-theme-awesome
npm link
# and a Harmonic project here:
cd ../my_blog
npm link harmonic-theme-awesome
```

Now, your theme is symlinked to that Harmonic project, meaning any change you make to the theme will be automatically reflected in the Harmonic project's theme dependency (`node_modules/harmonic-theme-awesome`). Note that you still need to run `harmonic build` or `harmonic run` to generate a new site build using the newly modified theme to see it in action.

The next step in the theme development workflow would be to setup a watch task to run `harmonic build` and auto-reload the browser (e.g. using [BrowserSync](http://www.browsersync.io/)), but that is outside of the scope of this wiki page. `;)`

## Publish

If you'd like, add the `"harmonictheme"` [keyword](https://docs.npmjs.com/files/package.json#keywords) to your `package.json`, so that users may easily [find your theme](https://www.npmjs.com/search?q=harmonictheme).

As Harmonic themes are just npm packages, you can publish it like any other package.  
Assuming you already have npm configured (registered user, etc.):

```bash
npm publish ./
```

Now, everybody can use your theme!

```bash
harmonic init "my_blog"
cd my_blog
npm install harmonic-theme-awesome
```

[<<< Markdown Header](markdown-header.md) | [Index >>>](README.md)
