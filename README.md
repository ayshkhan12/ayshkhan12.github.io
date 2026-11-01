# Aysh Khan · portfolio

Personal portfolio of **Muhammad Aysh Khan**, software and AI developer in Hull.

A static site with no build step and no framework: plain HTML, CSS and JavaScript.

## Pages

| Page | What it shows |
| --- | --- |
| `index.html` | Short introduction, key facts, four selected projects, current work |
| `projects.html` | Every project as a card, with filters |
| `project.html?p=<id>` | One page per project: problem, what I built, results, what I learned, and a live demo where there is one |
| `lab.html` | Adam, the instinct driven creature, and the Q learning lab |
| `about.html` | Story, experience, education, skills, awards and languages |
| `contact.html` | Email, LinkedIn and GitHub |

## Files

```
assets/data.js      ALL CONTENT: projects, experience, education, skills
assets/site.js      shared behaviour and the renderer for each page
assets/site.css     all styles (light and dark theme)
assets/widgets.js   live demos on project pages (charts, encryption, etc.)
assets/sim.js       Adam simulation (Lab page)
assets/qlab.js      Q learning lab (Lab page)
```

To update the content, edit `assets/data.js`. Every page is generated from it.

## Run locally

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. The encryption demo needs `localhost` or `https`.

&copy; Muhammad Aysh Khan
