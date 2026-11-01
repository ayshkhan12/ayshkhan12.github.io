/* ==========================================================
   Site content. Edit this file to update projects, experience
   and skills. Every page is rendered from here.
   ========================================================== */

window.SITE = {
  "profile": {
    "name": "Muhammad Aysh Khan",
    "short": "Aysh Khan",
    "location": "Hull",
    "emailUser": "ayshkhan12122",
    "emailDomain": "gmail.com",
    "github": "https://github.com/ayshkhan12",
    "linkedin": "https://www.linkedin.com/in/ayshkhan12",
    "headline": "Computer Science Graduate, First Class Honours, University of Hull"
  },
  "categories": [
    {
      "id": "all",
      "label": "Everything"
    },
    {
      "id": "ai",
      "label": "AI & ML"
    },
    {
      "id": "web",
      "label": "Web & apps"
    },
    {
      "id": "sys",
      "label": "Systems & security"
    },
    {
      "id": "data",
      "label": "Data"
    }
  ],
  "now": [
    {
      "pid": "0001",
      "proc": "conscious-agent",
      "label": "Conscious Instinct Agent",
      "status": "training v9",
      "state": "R",
      "progress": 0.78,
      "project": "conscious",
      "text": "My biggest ongoing build. The V7 brain is exported to a single ONNX graph and runs live inside a Unity world. V8 taught it that hiding works (predators lose interest if it shelters long enough), and V9 is polishing its behaviour. Next: routing around danger on the way to food, and multi step imagination."
    },
    {
      "pid": "0002",
      "proc": "coop-website",
      "label": "Website for a local courier cooperative",
      "status": "prototype",
      "state": "R",
      "progress": 0.62,
      "project": "coop",
      "text": "A site for a worker owned bike repair and cargo bike courier cooperative here in Hull, a business with no web presence yet. It has repair booking with a live estimate, a courier quote tool and clear prices, all styled from their own business card. It is my first client project and the first step towards offering web and IT services to local businesses."
    },
    {
      "pid": "0003",
      "proc": "human-agent-world",
      "label": "Human Agent World (Unity 3D)",
      "status": "training",
      "state": "R",
      "progress": 0.45,
      "project": "human-world",
      "text": "Taking the instinct ideas out of grid worlds and into 3D physics: 16 agents learning to forage in parallel with PPO, curiosity and a curriculum that gets harder as they improve."
    },
    {
      "pid": "0004",
      "proc": "halal-finder",
      "label": "Halal Finder mobile app",
      "status": "v1 running",
      "state": "R",
      "progress": 0.55,
      "project": "halal",
      "text": "Rebuilding my Halal Finder website as a cross platform mobile app: React Native with Expo, a new Express + SQLite API, live certificate checks and a barcode scanner for packaged food. The first version runs on phones and the web."
    },
    {
      "pid": "0005",
      "proc": "m365-upskill",
      "label": "Microsoft 365, Intune & Entra ID",
      "status": "learning",
      "state": "S",
      "progress": 0.3,
      "text": "Growing the IT side of my skill set: Microsoft 365 administration, Intune device management and Entra ID identity, plus Power Apps, Power Automate and SharePoint for the kind of small internal tools I like building."
    },
    {
      "pid": "0006",
      "proc": "open-to-work",
      "label": "Looking for my next role",
      "status": "listening",
      "state": "L",
      "progress": 1,
      "text": "Open to IT support, junior developer and AI/ML roles, and to freelance websites for local businesses. If you have something in mind, say hello."
    }
  ],
  "projects": [
    {
      "id": "conscious",
      "code": "EXP-01",
      "title": "Conscious Instinct Agent",
      "year": "2026, ongoing",
      "status": "ongoing",
      "cats": [
        "ai"
      ],
      "featured": true,
      "visual": "bars",
      "summary": "A deep RL agent whose behaviour comes from competing instincts (hunger, fear, curiosity and fatigue), tied together by a “global workspace” inspired by theories of consciousness.",
      "metric": {
        "value": "+249",
        "label": "avg. reward (V6) · best episode +401 with 0 hits"
      },
      "tags": [
        "Python",
        "PyTorch",
        "Gymnasium",
        "ONNX",
        "Unity",
        "C#"
      ],
      "problem": "My honours project showed that layered instincts produce richer behaviour than a single goal, but tabular Q learning can’t scale. I wanted an agent that keeps a model of itself and its world, remembers good and bad experiences, and decides which instinct gets the spotlight at each moment.",
      "built": [
        "A <b>self model</b>: drives, position, last action, coverage and (from V7) remembered food and safe zone directions.",
        "An <b>RSSM world model</b> (GRU 256 + 32 dim latent) that predicts what happens next, plus a curiosity bonus for surprises.",
        "<b>Episodic memory</b> of 3,000 experiences, recalled by similarity and tagged with how good or bad they felt.",
        "A <b>global workspace</b>: 8 streams (senses, world model, memory, self and four instincts) compete through attention, and the winner is broadcast to every decision maker.",
        "<b>Four dueling DQNs</b> (hunger, survival, exploration, energy) arbitrated by urgency, with a crisis override.",
        "A one graph <b>ONNX export</b> of the whole brain, with a parity check, so V7 runs live inside Unity."
      ],
      "results": [
        "V6: <b>+249</b> average reward, 21% better than V5.",
        "V7: +248 reward with fewer danger hits than the V2 baseline. Best episode <b>+401 with zero hits</b>, trained 1.77× faster.",
        "Every run has an “aha” moment around episodes 250 to 300 that predicts convergence."
      ],
      "learned": "Failures taught me the most. V3’s LSTM Q networks hit a backprop through time bottleneck and crashed to −4,500, and V4 had a checkpoint bug. Since then I use feed forward Q nets, save memory with every checkpoint, and pick checkpoints by evaluation score, not training average.",
      "links": [],
      "privateNote": "Code is private for now, but I’m happy to demo it live.",
      "widget": "conscious"
    },
    {
      "id": "coop",
      "code": "EXP-02",
      "title": "Courier cooperative website",
      "year": "2026",
      "status": "in progress",
      "cats": [
        "web"
      ],
      "featured": true,
      "visual": "browser",
      "summary": "A website for a worker owned bike repair and cargo bike courier cooperative in Hull, with repair booking and a live estimate, a courier quote tool and clear pricing.",
      "metric": {
        "value": "Client",
        "label": "my first project for a local business"
      },
      "tags": [
        "HTML",
        "CSS",
        "JavaScript",
        "UX"
      ],
      "problem": "A small local business doing good work with no website at all. Customers couldn’t check prices, book a repair or arrange a delivery online.",
      "built": [
        "A one page site styled from the cooperative’s own business card: warm, hand made and not a template.",
        "Repair booking: pick what’s wrong with your bike, see a running estimate, send the request.",
        "A courier section for sending things across Hull, a prices section and a “come and say hello” section.",
        "Light and fast: a single file with no framework, built mobile first."
      ],
      "results": [
        "The prototype is ready to show the owners. Next: confirm their details, then add a booking inbox, calendar and payments."
      ],
      "learned": "Designing for a real business means designing for its customers first: phones, clear prices and as few steps as possible.",
      "links": [],
      "privateNote": "Client preview available on request.",
      "widget": "coop"
    },
    {
      "id": "adam",
      "code": "EXP-03",
      "title": "Project Adam: layered instincts",
      "year": "2025/26",
      "status": "shipped",
      "cats": [
        "ai"
      ],
      "featured": true,
      "visual": "grid",
      "summary": "My BSc honours project. I trained three instinct agents (hunger, exploration, survival) with tabular Q learning in custom Gymnasium worlds, then combined them into one multi instinct agent.",
      "metric": {
        "value": "11×",
        "label": "smaller state space with relative encoding"
      },
      "tags": [
        "Python",
        "Gymnasium",
        "NumPy",
        "Q learning"
      ],
      "problem": "Animals don’t optimise one objective. Hunger, curiosity and self preservation compete all the time. Does layering instinct rewards give an RL agent better, more realistic behaviour than one unified goal?",
      "built": [
        "Three custom <b>Gymnasium</b> environments, one per instinct, plus a shared 10×10 world.",
        "<b>Tabular Q learning</b> with exponential ε-decay, 2,000 episodes per configuration.",
        "A <b>relative, direction based state encoding</b> that cut the hunger agent’s state space from 4,474 to 392 keys. That was the difference between converging and not.",
        "A <b>multi instinct agent</b> that combines all three rewards through weighted scalarisation."
      ],
      "results": [
        "The hunger specialist reached a <b>77%</b> food collection success rate.",
        "The exploration specialist covered <b>36 to 49%</b> of the grid in testing.",
        "Only the combined agent ever met the composite survival goal, a behaviour no single instinct produced on its own."
      ],
      "learned": "Good training numbers can lie. My hunger agent looked great on paper while behaving badly because of a hidden reward bug. I found it by testing one assumption at a time, and now I always watch the agent, not just the curve.",
      "links": [
        {
          "label": "GitHub",
          "url": "https://github.com/ayshkhan12/Project-Adam"
        }
      ],
      "widget": "adam"
    },
    {
      "id": "secure-api",
      "code": "EXP-04",
      "title": "Secure REST API & applied cryptography",
      "year": "2026",
      "status": "shipped",
      "cats": [
        "sys",
        "web"
      ],
      "summary": "An ASP.NET Core Web API with custom authentication, API keys, role based access and real cryptography: RSA 2048 key exchange, hybrid RSA + AES encryption and digital signatures.",
      "metric": {
        "value": "RSA 2048",
        "label": "hybrid RSA + AES · signed messages"
      },
      "tags": [
        "C#",
        ".NET 8",
        "ASP.NET Core",
        "EF Core",
        "Cryptography"
      ],
      "problem": "Build a distributed service that only the right people can use, and prove that what they receive really came from the server.",
      "built": [
        "Custom <b>authentication and authorisation middleware</b>: API keys mapped to users, with User and Admin roles.",
        "Endpoints for user management, SHA 1/SHA 256 hashing, publishing the server’s RSA public key and signing messages.",
        "An admin only endpoint that accepts <b>hybrid encrypted</b> requests: the AES key travels encrypted with the server’s RSA key, and the data travels encrypted with AES.",
        "Central error handling middleware, request logging through EF Core migrations, and a C# console client to drive it all."
      ],
      "results": [
        "A working client/server pair covering authentication, authorisation, hashing, signatures and hybrid encryption end to end."
      ],
      "learned": "Security is mostly careful plumbing. Middleware order, consistent error responses and never trusting input matter as much as the maths.",
      "links": [
        {
          "label": "GitHub",
          "url": "https://github.com/ayshkhan12/DistSysACW"
        }
      ],
      "widget": "crypto"
    },
    {
      "id": "nlp",
      "code": "EXP-05",
      "title": "Can transformers detect fake news?",
      "year": "2026",
      "status": "shipped",
      "cats": [
        "ai",
        "data"
      ],
      "summary": "I fine tuned DistilBERT against classic baselines on 12,836 political statements from the LIAR dataset, with an ablation to see what fine tuning really adds.",
      "metric": {
        "value": "0.618",
        "label": "macro F1 · +58% over baseline"
      },
      "tags": [
        "Python",
        "PyTorch",
        "Transformers",
        "scikit-learn"
      ],
      "problem": "Fact checkers can’t keep up with misinformation. Can a compact transformer beat simple word count models at spotting false political claims?",
      "built": [
        "Three baselines: majority class, TF IDF + Naive Bayes and TF IDF + Logistic Regression.",
        "Fine tuned <b>DistilBERT</b> with warm up, linear decay and gradient clipping, keeping the checkpoint with the best validation macro F1.",
        "An <b>ablation</b> with frozen DistilBERT embeddings + logistic regression to isolate the value of fine tuning."
      ],
      "results": [
        "Fine tuned DistilBERT scored the best macro F1 (<b>0.618</b>), 58% above the majority baseline.",
        "Frozen embeddings only reached 0.472, so the gains come from fine tuning itself."
      ],
      "learned": "Accuracy can fool you: predicting “false” every time already scores 64% here. Choosing macro F1 as the main metric was the most important decision in the project.",
      "links": [
        {
          "label": "GitHub",
          "url": "https://github.com/ayshkhan12/nlp-fake-news-classification"
        }
      ],
      "widget": "nlp"
    },
    {
      "id": "mnist",
      "code": "EXP-06",
      "title": "Triple MNIST: three digits at once",
      "year": "2025/26",
      "status": "shipped",
      "cats": [
        "ai"
      ],
      "summary": "Classifying 84×84 images of three handwritten digits (up to 1,000 possible labels) and pushing full sequence accuracy from 82.6% to 99.1%.",
      "metric": {
        "value": "99.1%",
        "label": "full sequence test accuracy"
      },
      "tags": [
        "Python",
        "PyTorch",
        "torchvision",
        "scikit-learn"
      ],
      "problem": "Normal MNIST has 10 classes. Triple MNIST has up to 1,000, and many combinations never appear in training, so a model has to understand digits instead of memorising labels.",
      "built": [
        "Exploratory analysis: perfectly balanced classes, 640/160/200 labels across splits, 360 combinations missing entirely.",
        "Baselines (including a decision tree) and a monolithic CNN.",
        "An <b>image splitting</b> approach that reads each digit separately, then a <b>multi task CNN</b> with one head per digit."
      ],
      "results": [
        "82.64% → 94.28% (split images) → <b>99.10%</b> (multi task CNN), with per digit accuracy above 99.6%."
      ],
      "learned": "Structure beats size. Bigger, regularised networks made things worse. Reframing the problem around the three digits made everything better.",
      "links": [],
      "privateNote": "Report and notebook available on request.",
      "widget": "mnist"
    },
    {
      "id": "codegen",
      "code": "EXP-07",
      "title": "Pseudocode → Python with CodeT5+",
      "year": "2026",
      "status": "shipped",
      "cats": [
        "ai"
      ],
      "summary": "I evaluated a 220M parameter code model at turning plain English pseudocode into working Python, using prompt engineering, LoRA fine tuning and a live Gradio demo.",
      "metric": {
        "value": "100%",
        "label": "syntax validity with explicit constraint prompts"
      },
      "tags": [
        "Python",
        "Hugging Face",
        "PEFT / LoRA",
        "Gradio"
      ],
      "problem": "Pseudocode is clear to people but useless to a compiler. How far can a small, open model close that gap, and what actually helps?",
      "built": [
        "Automated evaluation: syntax validity, Pass@1, CodeBLEU and BERTScore.",
        "Five prompting strategies compared side by side.",
        "<b>LoRA fine tuning</b> with Hugging Face PEFT on a small custom dataset.",
        "A <b>Gradio app</b> to try every strategy live, plus an ethics review with a risk mitigation table."
      ],
      "results": [
        "Explicit constraints took syntax validity from 66.7% to <b>100%</b> by patching the model’s known failure modes.",
        "Few shot prompting failed completely: a 220M model is too small for in context learning.",
        "LoRA on just 24 examples didn’t help (Pass@1 16.7%), a lesson in how much data fine tuning needs."
      ],
      "learned": "With small models, prompts that remove ambiguity beat clever prompts. And fine tuning is only as good as the data behind it.",
      "links": [],
      "privateNote": "Notebook and demo available on request.",
      "widget": "codegen"
    },
    {
      "id": "human-world",
      "code": "EXP-08",
      "title": "Human Agent World",
      "year": "2026",
      "status": "ongoing",
      "cats": [
        "ai"
      ],
      "summary": "A 3D Unity world where an agent with human like needs learns to forage purely by trial and error, with 16 copies training in parallel.",
      "metric": {
        "value": "16",
        "label": "agents learning in parallel"
      },
      "tags": [
        "Unity 6",
        "C#",
        "ML Agents",
        "PPO",
        "Python"
      ],
      "problem": "Grid worlds are great for research, but a robot lives in continuous 3D space. I wanted to see the same instinct ideas emerge in a physics world.",
      "built": [
        "A scene builder that generates a 4×4 grid of training arenas from code: walls, food, obstacles and a lethal danger zone.",
        "Rewards for eating, penalties for bumping and starving, death inside the danger radius and a small survival bonus.",
        "Ray cast perception, a <b>curiosity</b> module for intrinsic reward, and a <b>curriculum</b> that grows from 2 to 10 obstacles as the agent improves.",
        "A second scene that runs my V7 PyTorch brain (exported to ONNX) on Unity’s inference engine."
      ],
      "results": [
        "Designed for distinct learning stages: random spinning → wall avoidance → chasing food → respecting the danger zone → efficient foraging loops. Training is ongoing."
      ],
      "learned": "Environment design is half of RL. Curriculum and reward shaping shape the final behaviour more than any network tweak.",
      "links": [],
      "privateNote": "Private while in development."
    },
    {
      "id": "campus-map",
      "code": "EXP-09",
      "title": "Interactive campus map",
      "year": "2025",
      "status": "shipped",
      "cats": [
        "web"
      ],
      "summary": "A Blazor web app to help new students and visitors find their way around the University of Hull, built in a Scrum team.",
      "tags": [
        "C#",
        "Blazor",
        "SignalR",
        "EF Core",
        "SQLite",
        "SVG"
      ],
      "problem": "New students get lost. The university needed a friendlier way to find buildings and rooms than a static PDF.",
      "built": [
        "Interactive <b>SVG floor plans</b> you can click through.",
        "A <b>SignalR</b> hub for live map updates.",
        "User accounts and profiles with EF Core + SQLite, and a personal schedule page.",
        "Sprints planned on a Trello Kanban board, with reviews and merges on GitHub."
      ],
      "results": [
        "A working prototype with accounts, schedules and live updates, delivered across sprints."
      ],
      "learned": "Teamwork means merge conflicts, compromises and clear tickets. A shared Kanban board saved us more time than any library.",
      "links": [
        {
          "label": "GitHub",
          "url": "https://github.com/ayshkhan12/InteractiveMap"
        },
        {
          "label": "Map app",
          "url": "https://github.com/ayshkhan12/InteractiveMapApp"
        }
      ]
    },
    {
      "id": "halal",
      "code": "EXP-10",
      "title": "Halal Finder",
      "year": "2026",
      "status": "in progress",
      "cats": [
        "web"
      ],
      "summary": "A cross platform mobile app for finding certified halal restaurants, butchers and grocers nearby, and checking whether a packaged product has a current halal certificate.",
      "metric": {
        "value": "3",
        "label": "platforms from one codebase: iOS, Android and web"
      },
      "tags": [
        "TypeScript",
        "React Native",
        "Expo",
        "Express",
        "SQLite"
      ],
      "problem": "Finding food you can trust is harder than it should be when you’re new to a city. I wanted one place to search by location and certification, and to see whether a certificate is actually still valid.",
      "built": [
        "A <b>React Native app</b> (Expo, TypeScript, Expo Router) that runs on iOS, Android and the web from one codebase.",
        "Explore and map views: places sorted by distance, live search and filters, and map pins that show certificate status by shape and colour.",
        "<b>Live certificate checks</b>: every listing links to its certifier, certificate number and expiry date, and is marked certified, expiring soon or expired.",
        "A <b>barcode scanner</b> for packaged products, with dietary filters and nearest stockists.",
        "A <b>REST API</b> in Express 5 with SQLite, JWT sign in and automated tests. Saved items work without an account and sync once you sign in."
      ],
      "results": [
        "The first version runs on phones and the web. It started in March 2026 as a vanilla JS website, which I kept in the repo for reference."
      ],
      "learned": "Trust is the product. Showing who certified a place and when the certificate runs out matters more than any other feature. I also built it to WCAG 2.2 AA so everyone can use it.",
      "links": [],
      "privateNote": "Code available on request."
    },
    {
      "id": "lighthr",
      "code": "EXP-11",
      "title": "LightHR: fair & explainable analytics",
      "year": "2025",
      "status": "shipped",
      "cats": [
        "data",
        "ai"
      ],
      "summary": "I analysed an HR dataset with clustering, association rules and classifiers, then asked why the models decide what they do and whether they’re fair.",
      "tags": [
        "Python",
        "scikit-learn",
        "XGBoost",
        "SHAP",
        "LIME",
        "Fairlearn"
      ],
      "built": [
        "<b>K medoids clustering</b>, checked with silhouette scores, to find groups of employees.",
        "<b>Apriori association rules</b> to surface patterns.",
        "Decision tree, random forest and XGBoost classifiers.",
        "<b>SHAP</b> and <b>LIME</b> explanations, plus <b>Fairlearn</b> checks for demographic parity and equalised odds."
      ],
      "learned": "A model isn’t done when it’s accurate. It’s done when you can explain it and show it treats people fairly.",
      "links": [],
      "privateNote": "Notebook available on request."
    },
    {
      "id": "engagement",
      "code": "EXP-12",
      "title": "Engagement Monitoring System",
      "year": "2024/25",
      "status": "shipped",
      "cats": [
        "web",
        "sys"
      ],
      "summary": "A C# console app for students, personal supervisors and senior tutors to track progress and wellbeing and book meetings.",
      "tags": [
        "C#",
        ".NET",
        "JSON",
        "UML"
      ],
      "problem": "Without one place to track student wellbeing, people slip through the cracks. Each role needed its own view of the same data.",
      "built": [
        "Three roles with their own menus: <b>students</b> report progress and book meetings, <b>supervisors</b> review their students, and <b>senior tutors</b> oversee everyone.",
        "JSON persistence for students, supervisors, tutors and meetings.",
        "Use case and activity diagrams drawn up before writing code."
      ],
      "learned": "Designing the roles and data first made the code much simpler.",
      "links": [
        {
          "label": "GitHub",
          "url": "https://github.com/ayshkhan12/DDD_IP"
        }
      ],
      "widget": "terminal"
    },
    {
      "id": "netdb",
      "code": "EXP-13",
      "title": "Networked database system",
      "year": "2025",
      "status": "shipped",
      "cats": [
        "sys",
        "data"
      ],
      "summary": "A MySQL backed networked database system with a C# client application, built for the Databases & Networks module.",
      "tags": [
        "C#",
        "MySQL",
        "SQL",
        "Networking"
      ],
      "built": [
        "Relational schema design in MySQL.",
        "A C# client that talks to the database over the network."
      ],
      "links": []
    },
    {
      "id": "rota",
      "code": "EXP-14",
      "title": "Shift rota tool",
      "year": "2025/26",
      "status": "in use",
      "cats": [
        "web"
      ],
      "summary": "I built this on my own initiative at work to help automate shift scheduling for my colleagues and make planning easier for the team.",
      "tags": [
        "Automation",
        "Internal tool"
      ],
      "learned": "The most useful software is often small and close to the people who use it.",
      "links": []
    }
  ],
  "home": {
    "featured": [
      "adam",
      "secure-api",
      "nlp",
      "halal"
    ]
  },
  "experience": [
    {
      "role": "Retail Assistant",
      "org": "SPAR, Hull University Students’ Union",
      "place": "Hull",
      "dates": "Sept 2025 to present",
      "type": "Part time",
      "points": [
        "First point of contact for customers at tills and self checkout, sorting out payment and till issues calmly at peak times.",
        "Restock shelves and manage stock rotation to store standards.",
        "Built a shift rota tool on my own initiative to help automate scheduling for colleagues."
      ]
    },
    {
      "role": "Team Member",
      "org": "The Salad Project",
      "place": "London",
      "dates": "May 2025 to Sept 2025",
      "type": "Part time",
      "points": [
        "Employee of the Month, and offered a supervisor role.",
        "Helped customers build meals around taste, provenance and dietary needs in a fast paced kitchen."
      ]
    },
    {
      "role": "Team Lead, Employer’s Challenge",
      "org": "R Evolution and University of Hull",
      "place": "Hull",
      "dates": "Mar 2025 to Apr 2025",
      "points": [
        "Led a cross functional team researching barriers to cycling in Withernsea: ran meetings, delegated tasks and proposed community solutions."
      ]
    },
    {
      "role": "Server",
      "org": "S&S Hospitality",
      "place": "Hong Kong",
      "dates": "Jan 2024 to Aug 2024",
      "type": "Full time",
      "points": [
        "Customer service, inventory control and stock replenishment under strict food safety standards."
      ]
    },
    {
      "role": "Assistant Supervisor",
      "org": "Regal Hotels International (Vivace)",
      "place": "Hong Kong",
      "dates": "Nov 2023 to Dec 2023",
      "type": "Full time",
      "points": [
        "Guided guests through the menu and ran the al fresco grill section of a busy Mediterranean restaurant."
      ]
    },
    {
      "role": "English Tutor",
      "org": "Be With You Programme and Hong Kong England Education Centre",
      "place": "Hong Kong",
      "dates": "Sept 2022 to Oct 2023",
      "type": "Part time",
      "points": [
        "Taught primary and secondary pupils, including English enhancement courses for pupils with special educational needs, and wrote DSE intensive course materials."
      ]
    }
  ],
  "education": [
    {
      "school": "University of Hull",
      "award": "BSc (Hons) Computer Science, First Class Honours",
      "dates": "Sept 2024 to July 2026",
      "note": "Databases and Networks, Artificial Intelligence, Machine Learning, Natural Language Processing, Design Develop Deploy, UX and UI."
    },
    {
      "school": "UOW College Hong Kong",
      "award": "Associate of Engineering",
      "dates": "Aug 2021 to July 2024",
      "note": "Object Oriented Programming, Data Structures and Algorithms, Networking, Electronic Devices and Circuits. Class Programme Representative."
    }
  ],
  "skillGroups": [
    {
      "name": "Languages",
      "items": [
        "C#",
        "Python",
        "TypeScript",
        "JavaScript",
        "SQL",
        "HTML and CSS"
      ]
    },
    {
      "name": "Frameworks",
      "items": [
        "ASP.NET Core",
        "Entity Framework Core",
        "Blazor",
        "React Native (Expo)",
        "Node.js and Express",
        "REST APIs"
      ]
    },
    {
      "name": "AI and ML",
      "items": [
        "PyTorch",
        "Hugging Face and PEFT (LoRA)",
        "scikit-learn",
        "XGBoost",
        "Reinforcement learning",
        "SHAP, LIME and Fairlearn",
        "Unity ML Agents"
      ]
    },
    {
      "name": "Data",
      "items": [
        "MySQL",
        "SQLite"
      ]
    },
    {
      "name": "IT and tools",
      "items": [
        "Windows and macOS support",
        "Microsoft 365",
        "Networking (TCP/IP)",
        "Git and GitHub",
        "Agile (Scrum, Kanban)",
        "Technical writing"
      ]
    }
  ],
  "awards": [
    "Hull Employability Award for STEM (May 2025)",
    "Employer’s Challenge Team Lead (2025)",
    "Venn Challenge winner, AI programming competition",
    "President, South Asian Society (2025)"
  ],
  "languages": [
    "English (IELTS 8.5)",
    "Urdu (native)",
    "French (intermediate)",
    "Hindi and Punjabi (conversational)"
  ]
};
