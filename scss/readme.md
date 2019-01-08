# Developer guideline for Icons / Fonts / Styling

FontAwesome icons are used. Just use the `<i>` tag like `<i class="fa fas-heart"></i>`.

All fonts are embedded, no external fonts are referenced. Included are font-awesome, roboto and 'smart.icons'.
Please keep it that way. Paper UI should run locally without internet access.

Styles are defined in sass files in `scss/`.
Sass files are normal css but allow nesting, imports and variables.

Each file in `scss/` is compiled into a corresponding minified *css/.css* file. Subdirectories are ignored.
I have used a "partials" directory for all files that are just embedded somewhere else.

A file in `scss/` should be named like the html page that includes it (index.scss, tutorial.scss etc).

## Theme

The bootstrap 4 default theme is imported.
Bootstrap javascript is NOT embedded (as it uses jquery, and we don't want that).
So Bootstrap components like Accordion etc are not usable. Use Web components instead.

The primary and "-orange" colors are changed to the openHAB orange theme.
A new responsive breakpoint has been added ("xxl").
