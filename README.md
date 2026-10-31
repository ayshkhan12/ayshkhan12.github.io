# aysh.khan

Personal portfolio of **Muhammad Aysh Khan**, Software & AI developer in Hull, UK.

A static site with no build step and no framework: plain HTML, CSS and JavaScript.

## What's inside

- **Live hero simulation**: Adam, a small creature driven by four instincts (hunger, energy, fear, curiosity), walks around the letters of my name. Visitors can drop food, release predators and build shelters.
- **Process monitor** of what I'm working on right now.
- **Project lab notes** with live demos: real RSA-2048 + AES-GCM hybrid encryption (Web Crypto), interactive result charts, an architecture explorer and more.
- **Q-Lab**: tabular Q-learning running in the browser on an editable grid world.
- **Skills wiring diagram** connecting each skill to the projects that use it.
- **Journey as a changelog**, a hidden terminal (press `/`) and a Konami-code easter egg.

## Files

```
index.html          page structure
favicon.svg
assets/style.css    all styles (light + dark theme)
assets/data.js      ALL CONTENT: projects, timeline, skills, "now" list
assets/sim.js       hero simulation
assets/qlab.js      Q-learning lab
assets/main.js      page behaviour, notes pop-ups, terminal
```

To update the content, edit `assets/data.js`. Everything on the page is generated from it.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. The encryption demo needs `localhost` or `https`.

## Publish on GitHub Pages

1. Create a repository named `ayshkhan12.github.io`.
2. Upload these files to it (keep the folder structure).
3. In the repo settings, open **Pages** and choose **Deploy from a branch → main → / (root)**.
4. The site appears at https://ayshkhan12.github.io within a minute or two.

© Muhammad Aysh Khan
