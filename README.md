fidemo
======

FIWARE Demo / Integration project

How things work
---------------

This repository is for a runtime of the demo: a way to run the code and ability to work on the assets.

Attempts to use a typical sane dir structure -- current is:

data/ -- for models and all related such as materials, textures etc

js/ -- for javascript code / modules, examples ported from the Santander demo are coming here (light vis, heatmap, ..)

index.html is here at root for running locally and for hosting the app on the web at: http://130.206.81.111/fidemo/

it runs main.js which is also at root for now.

Local development and peview
----------------------------

1. Install [node.js](http://nodejs.org/)
2. Run `npm install` on the repo root folder to fetch dependencies.
3. Run `npm install -g grunt-cli` to install the grunt executable as a global tool (only have to do this once per computer)
4. Run `grunt dev`. This will open the index.html in the default OS web browser.
