window.CV_DATA = {
    "profile": {
        "name": "Thomas Hetland",
        "role": "IT, Designer & Developer",
        "photo": {
            "src": "/assets/profile/ProfilePicture.png",
            "alt": "Thomas Hetland"
        }
    },
    "summary": "I’m a nerd, I have spent most of my life learning software and expanding my understanding of any subjects related to technology and computers. I’ve studied media & communication for design, photography and game-development for 3d modelling and programming. I’ve made it a hobby to develop games and apps, and got pretty good at it, but never had much luck publishing them. I learn quickly, I’m a creative and curious soul. I have a great passion for developing good and scalable solutions and love diving into new and interesting projects to learn more. I always have ideas of improvements and ask questions to further my understanding of a subject",
    "about": [
        {
            "label": "Location",
            "value": "Stavanger Area"
        },
        {
            "label": "Phone",
            "value": "+47 46632234"
        },
        {
            "label": "Email",
            "value": "hetland.th@gmail.com",
            "href": "/contact-me"
        },
        {
            "label": "Date of Birth",
            "value": "24.07.1994"
        },
        {
            "label": "Language",
            "value": "Norwegian & English"
        },
        {
            "label": "Social",
            "value": "LinkedIn",
            "href": "https://www.linkedin.com/in/thomashetland/",
            "target": "_blank"
        }
    ],
    "skills": [
        "UNITY",
        "UNREAL ENGINE",
        "BLENDER",
        "SUBSTANCE PAINTER",
        "ADOBE SUITE",
        "VR / XR",
        "C#",
        "Blueprint",
        ".NET",
        "AZURE",
        "Networking",
        "Mobile",
        "WEB"
    ],
    "experience": [
        {
            "date": "MAR. 2022 — JUN. 2026",
            "title": "Developer",
            "org": "Nagelld",
            "description": "At Nagelld, we are a small team, meaning everyone has to master every part of developing a software or Simulator. I have mostly been programming for Unreal Engine & Unity. But also modelled, developed textures, audio, designed UI etc. Projects are mostly self-managed, with direct customer contact. I'm familiar with Azure, and Meta's AppLab for development with Meta's Quest VR headset. Using Git for source-control. Here are some of the projects I've developed primarily:",
            "logo": {
                "src": "/assets/logos/nagelld_logo_dark.png",
                "alt": "Nagelld"
            },
            "projects": [
                {
                    "name": "Crane Simulator",
                    "summary": "A complex and highly realistic internal overhead crane simulator with a custom grayscale-shaded environment so objective objects and the crane itself pop out.",
                    "popupDescription": "During a time of little to do, i took it upon myself to develop a Crane Simulator, mostly for fun and experimenting with certain physics properties, but then developed more into an actual Crane Simulator. I got the idea for the grayscale environment after seeing black & white images of buildings with colored cranes inside from crane promotional imagery. So I made a hangar environment in grayscale where objects you interact with, such as the crane itself, the load and the course would be in color to make them easier to see clearly. \n\nThe Crane Simulator features a highly realistic physics simulation with complex crane features made modularly for easy customization and future expansion. The courses are generated in runtime depending on primitives placed in-engine, and the courses and the cranes are loaded in on demand. That way we can very quickly create new scenarios and courses that can just be loaded into the environment.\n\nWe later got a customer who wanted a rebranded version of this, so we replaced the crane model with their own hoist setup and logos and setup more courses and modes, including some of their real crane smart features and safety information.\n\nAnd then I designed, modelled and textured a custom generic crane hoist for use in our internal Crane Simulator so that we could show it off with a modern looking crane design and the Nagelld logo. ",
                    "image": "/assets/images/projects/nagelld_cranesimulator/hero/nagelld_cranesimulator.png",
                    "tags": [
                        "Unity",
                        "C#",
                        "VR / XR",
                        "Mobile",
                        "Blender",
                        "Substance Painter"
                    ],
                    "heroVideo": "https://pub-329e3bd197cd4a0dbe81fadc30cc032a.r2.dev/CraneSimulator.mov"
                },
                {
                    "name": "Boat Simulator",
                    "summary": "Solo-developed boat simulator with realistic physics, multi-user crew, and modular boats in varied weather scenarios.",
                    "popupDescription": "I was the solo developer behind this Boat Simulator. The boat simulator features a highly realistic and detailed physics engine simulating accurate boat physics, and realistic crane physics for lowering the boat by davit. Multiple users can walk around freely on the boat while driving and need to work and communicate together to problem-solve and exercise in various waves, wind and weather conditions. The simulator is modular allowing you to swap out boats and setup custom scenarios quickly.",
                    "image": "/assets/images/projects/nagelld_boatsimulator/hero/nagelld_boatsimulator.jpeg",
                    "tags": [
                        "Unreal Engine",
                        "Blueprint",
                        "VR / XR",
                        "Networking"
                    ],
                    "heroVideo": ""
                },
                {
                    "name": "Boat Simulator Quest",
                    "summary": "Completely reworked the entire Boat Simulator and ported it from Unreal Engine to Unity for running on mobile VR hardware. Maintaining a good visual quality while optimized for running on weak hardware.",
                    "popupDescription": "Completely reworked the entire Boat Simulator and ported it from Unreal Engine to Unity for running on mobile VR hardware. Maintaining a good visual quality while optimized for running on weak hardware. The simulator includes all the features of the previous one, but adds better networking and hand-tracking features while supporting physical boat controls tied to the simulator.\n\nThe simulator features realistic boat physics and complex gerstner-wave calculations for realistic ocean waves affected by winds that pushes on every physics object in the scene. It features various scenario setups and open sandbox training that allow the instructor to alter the scenario in the middle of an excersize to simulate unexpected objectives. VR Trainees has realistic interactivity with objects, davit and boat systems, objects can be picked up, levers pulled and buttons pressed with both hand-tracking and VR controller support. Hatches can be opened and flashlights used to see in the dark. Trainees will have to adapt and communicate to overcome challenges that the Instructor throws at them. \n\nThe Instructor hosts a server where up to 5 VR trainees can join, the Instructor has full control of the scenario and overview of the simulation and can change weather, setup markers in the ocean, add search-patterns for the trainees to follow and override boat and davit systems. As showcased in the video above. \n",
                    "image": "/assets/images/projects/nagelld_boatsimulatorquest/hero/nagelld_boatsimulatorquest.jpeg",
                    "tags": [
                        "Unity",
                        "C#",
                        "VR / XR",
                        "Networking",
                        "Mobile"
                    ],
                    "heroVideo": "https://pub-329e3bd197cd4a0dbe81fadc30cc032a.r2.dev/nagelld_boatsimulatorquest.mp4"
                },
                {
                    "name": "Fire Fighting Experiment",
                    "summary": "Short internal VR experiment for extinguishing fires in low-visibility, smoke-filled environments.",
                    "popupDescription": "A short, internal unfinished experiment for a VR fire-fighting experience where the user extinguishes fires and navigates various low visibility, smoke-filled environments.",
                    "image": "/assets/images/projects/nagelld_firefightingexperiment/nagelld_firefightingexperiment.jpeg",
                    "tags": [
                        "Unreal Engine",
                        "Blueprint",
                        "VR / XR"
                    ]
                },
                {
                    "name": "Interactive Application",
                    "summary": "Interactive viewer is a mobile application that visualizes 3d models or solutions, designed for highlighting important product details for presentations with good user-experience at the core.",
                    "popupDescription": "Interactive viewer is a mobile application that visualizes 3d models or solutions, designed for highlighting important product details for presentations with good user-experience at the core. It allows rotating around, zooming in and panning around models and picking them apart showing interior parts of motors or other enclosed systems, or highlighting and visualizing flow direction in a pump system. Optimized for weak hardware allowing for great performance on mobile phones or tablets.\n\nIt also features a highly optimized Ray-triangle solution for interacting with individual objects without any colliders on a triangle level. This is used for double-clicking to set pivot point, and for hiding individual elements to look inside of complex objects.\n\nThe project is developed with modularity in mind, allowing to easily create an interactive presentation for any 3d-model within a short amount of time due to easily configurable options and togglable modules making up the application's features. ",
                    "image": "/assets/images/projects/nagelld_interactiveapplication/hero/nagelld_interactiveapplication.jpeg",
                    "tags": [
                        "Unity",
                        "C#",
                        "Mobile"
                    ],
                    "heroVideo": "/assets/videos/projects/nagelld_interactiveapplication/hero/nagelld_interactiveapplication.mp4"
                },
                {
                    "name": "Offshore Supply Vessel Bridge",
                    "summary": "Designed, modelled and textured a generic OSV bridge with baked lighting for high-quality mobile VR visuals.",
                    "popupDescription": "Designed, modelled and textured the bridge of a generic offshore supply vessel. Then setup baked lighting for high quality visuals on mobile VR hardware.",
                    "image": "/assets/images/projects/nagelld_offshoresupplyvesselbridge/nagelld_offshoresupplyvesselbridge.jpeg",
                    "tags": [
                        "Unity",
                        "VR / XR",
                        "Blender",
                        "Substance Painter"
                    ]
                },
                {
                    "name": "Software Launcher",
                    "status": "Published",
                    "image": "/assets/images/projects/nagelld_softwarelauncher/hero/nagelld_softwarelauncher.png",
                    "tags": [
                        "Azure",
                        ".NET",
                        "SQL",
                        "C#"
                    ],
                    "summary": "A launcher with account verification to Azure for downloading and updating software and simulators. With an admin panel to invite users and administrate access. ",
                    "popupDescription": "A launcher with account verification to Azure for downloading and updating software and simulators. With an admin panel to invite users and administrate access. Users can be invited from the admin panel and will automatically receive an email with their access key / serial number and a download url for the appropriate launcher. The launcher is self-updating for maintanance and after logging in the user gets access to their application and can from there download, launch or update it. The launcher has a configurable offline mode that will allow the user to launch the application without internet access for a period of time, if the user was previously logged in, primarily for expo usage without reliable internet access. ",
                    "showOnCv": false,
                    "heroVideo": ""
                },
                {
                    "name": "Interactive Fishfarm",
                    "status": "Published",
                    "image": "/assets/images/projects/nagelld_interactivefishfarm/hero/nagelld_interactivefishfarm.jpeg",
                    "heroVideo": "",
                    "tags": [
                        "Blueprint",
                        "Unreal Engine",
                        "Shaders"
                    ],
                    "summary": "An Interactive Application showcasing AkvaGroup's Nautilus submersible fish-farm system with realistic underwater shader with clean and user-friendly interface for expo showcase on touchscreens.",
                    "popupDescription": "An Interactive Application showcasing AkvaGroup's Nautilus submersible fish-farm system with realistic underwater shader or unlit view featuring clear graphics for more technical inspections. \nThe User-Interface and User-Experience is optimized for touchscreens and ease of use for people at expos to interact with on a large tv touchscreen. \n\nA radial menu provides shortcut access to Points placed around the model which moves the camera into customizable viewing angles with information popups for what you are looking at.\n\nThis software was the precursor for the Interactive Application software developed later in Unity. This was less flexible and was developed for visuals first, rather than optimized for mobile. ",
                    "showOnCv": false
                }
            ],
            "logoDark": {
                "src": "/assets/logos/nagelld_logo.png"
            }
        },
        {
            "date": "Apr. 2021 - Mar. 2022",
            "title": "Team Assistant / Developer",
            "org": "Visual Engineering",
            "description": "At Visual Engineering I worked in a small team of 3 people, I was the lead developer / programmer on the projects I worked on, and was assisted with modelling and in-engine scene setup. I also developed engine-tools that would speed up and make it easier to develop for me and setup scenarios or scenes for the other people in the team.",
            "logo": {
                "src": "/assets/logos/ve_logo_dark.png",
                "alt": "Visual Engineering"
            },
            "projects": [
                {
                    "name": "VR Crane Simulator",
                    "summary": "Overhead and tower crane VR simulator with courses to test operator skill. Published to Meta AppStore, runs natively on mobile VR hardware.",
                    "popupDescription": "Crane Simulator for overhead crane and tower-crane providing various challenges and courses to test operators skill. Published to Meta AppStore. Running directly on mobile VR hardware.",
                    "image": "/assets/images/projects/visualengineering_vrcranesimulator/SCR-20260503-tfxa.jpeg",
                    "tags": [
                        "VR / XR",
                        "Mobile",
                        "Unreal Engine",
                        "Blueprint",
                        "Engine Tools"
                    ]
                },
                {
                    "name": "Tower-Crane Simulator",
                    "date": "2021",
                    "status": "Published",
                    "image": "/assets/images/projects/visualengineering_towercranesimulator/SCR-20260503-tdau.jpeg",
                    "tags": [
                        "Unreal Engine",
                        "Blueprint",
                        "VR / XR",
                        "Networking",
                        "Engine Tools"
                    ],
                    "summary": "A complex, multi-user Tower-Crane Simulator with several scenarios and loads to lift in various weather conditions.",
                    "popupDescription": "A complex, multi-user Tower-Crane Simulator with several scenarios and loads to lift in various weather conditions."
                }
            ],
            "logoDark": {
                "src": "/assets/logos/ve_logo.png"
            }
        }
    ],
    "education": [
        {
            "date": "Aug. 2013 - Jun. 2016",
            "title": "Noroff School of Technology and Digital Media",
            "org": "College or Vocational School",
            "description": [
                "Project Management and structuring, 3D Modelling, Texturing and Game Design Principles",
                "Unreal Engine, Unity, HTML/CSS, Adobe Photoshop, Adobe Illustrator"
            ],
            "logo": {
                "src": "/assets/logos/noroff_logo_dark.png",
                "alt": "Noroff"
            },
            "logoDark": {
                "src": "/assets/logos/noroff_logo.png"
            }
        }
    ],
    "projects": [
        {
            "date": "",
            "title": "Side-Projects",
            "description": "A selection of notable side projects.",
            "logo": {
                "src": ""
            },
            "projects": [
                {
                    "name": "TINY VOTERS",
                    "summary": "Ever had problems making up your mind? Tiny Voters will help you decide. Get answers at once whether it's yes, no, a number you're thinking of, or anything else.",
                    "popupDescription": "Tiny Voters is an interactive decision-making web application designed to help users overcome choice paralysis and make decisions quickly and efficiently. Whether you're trying to decide between yes or no, pick a random number, or choose from a list of options, Tiny Voters provides an engaging and visually appealing solution.\n\nBuilt with Unity and deployed as a WebGL application, Tiny Voters combines the power of game engine technology with web accessibility, creating a smooth and responsive user experience across all devices and platforms.\n\nThe application features cute animated characters called \"Tiny Voters\" who cast their votes to help you make decisions. Each decision type has its own unique voting mechanism, making the process both functional and entertaining.",
                    "image": "/assets/images/projects/sideprojects_tinyvoters/sideprojects_tinyvoters.png",
                    "tags": [
                        "Unity",
                        "WEB",
                        "Mobile",
                        "C#"
                    ],
                    "link": {
                        "url": "https://tinyvoters.app/",
                        "label": "Try it!",
                        "showOnCard": true
                    },
                    "showOnCv": false
                },
                {
                    "name": "STAR CITIZEN TRACKER",
                    "summary": "A .NET Application using HTML for frontend and a C# backend, that tracks player statistics in-game and uploads the data in real-time to an SQL database.",
                    "popupDescription": "A .NET Application using HTML for frontend and a C# backend, that tracks player statistics in-game and uploads the data in real-time to an SQL database. The website provides a user-friendly, realtime analytics dashboard for players to view their performance and statistics directly from the database using secure Web Service APIs. The .NET application provides, like the website, a login interface that verifies users securely using encrypted credentials, ensuring data privacy and security.\nThe design of the .NET App and Website was designed as modern minimalism with the principle of 3 colors for the entire website, where the colors could flip to allow darkmode viewing, reveal hovered interaction states, intent and contrast.",
                    "image": "/assets/images/projects/sideprojects_starcitizentracker/sideprojects_starcitizentracker.png",
                    "tags": [
                        "Azure",
                        "SQL",
                        "WEB",
                        "C#",
                        ".NET"
                    ],
                    "showOnCv": false,
                    "link": {
                        "label": "Read More",
                        "url": "https://hetland.dev/projects/StarCitizenTracker/",
                        "showOnCard": false
                    }
                },
                {
                    "name": "Unity Asset: NoFolderInspection",
                    "summary": "No Folder Inspection prevents the Inspector from showing folders when they are selected by locking the inspector before it is updated, unlocking again if you select anything other than a folder.",
                    "popupDescription": "No Folder Inspection prevents the Unity Inspector from showing folders when they are selected by locking the inspector before it is updated, then unlocking again if you select anything other than a folder. A small but high-impact quality-of-life tool for Unity editor workflows.",
                    "tags": [
                        "Engine Tools",
                        "Unity",
                        "C#"
                    ],
                    "date": "2025-10-02",
                    "status": "Published",
                    "image": "/assets/images/projects/unityasset_nofolderinspection.webp",
                    "showOnCv": false,
                    "link": {
                        "url": "https://assetstore.unity.com/packages/tools/utilities/no-folder-inspection-305876",
                        "label": "View on Asset Store",
                        "showOnCard": true
                    }
                },
                {
                    "name": "Unpublished Unity Assets",
                    "summary": "A collection of Unity Editor tools and utilities currently in development. Browse upcoming assets including editor extensions, workflow tools, and productivity utilities.",
                    "popupDescription": "A growing collection of Unity Editor tools and utilities currently in development. Browse upcoming assets including editor extensions, workflow tools, and productivity utilities I'm working on but haven't yet shipped to the Unity Asset Store.",
                    "tags": [
                        "Engine Tools",
                        "Unity",
                        "C#"
                    ],
                    "date": "2026-02-09",
                    "status": "Development",
                    "image": "/assets/images/projects/unpublishedunityassets.webp",
                    "showOnCv": false,
                    "link": {
                        "url": "/projects/UnpublishedUnityAssets/",
                        "label": "Browse",
                        "showOnCard": true
                    }
                },
                {
                    "name": "Sameieboden",
                    "status": "Development",
                    "image": "/assets/images/projects/sideprojects_sameieboden/hero/sideprojects_sameieboden.png",
                    "heroVideo": "",
                    "tags": [
                        "SQL",
                        "WEB",
                        "Javascript"
                    ],
                    "summary": "A website made for the owners association where I live. The page was originally meant to just track what we had in our shared shed, but expanded to track usage, reservations and more. A webApp was also made for phones and computers to install it natively, with offline support. ",
                    "popupDescription": "A website made for the owners association where I live. The page was originally meant to just track what we had in our shared shed, but expanded to track who was using what and when, and allow for reservations. A webApp was also made for phones and computers to install it natively, with offline support. \n\nLater, and really for a bit of experimentation I added a Calendar to track when someone had reserved something, but got an idea to allow anyone to create an event so others could see. For example if there was a \"dugnad\" it would be included in that calendar. \n\nWe also had a facebook messenger group, but sometimes I found it difficult to place who lived in which unit, and then add them on facebook or find their phone number if i wanted to talk to them directly, so instead I got the idea for a chat window where you use your house number to communicate with another house number. So It's relatively anonymous and you only need to know their house number to give them a heads-up. I also added the ability for everyone to talk in a global all-chat for general purpose information. \n\nThe idea for the design came from an idea that this should be homely, and cozy instead of professional looking, so i took inspiration from Nintendo's Animal Crossing. With some nice and toony animations and an easy to navigate user experience. ",
                    "showOnCv": false
                }
            ]
        }
    ],
    "sections": [
        {
            "icon": "summary",
            "title": "SUMMARY",
            "type": "summary"
        },
        {
            "icon": "experience",
            "title": "EXPERIENCE",
            "type": "fields",
            "dataKey": "experience",
            "combineTitleOrg": true
        },
        {
            "icon": "education",
            "title": "EDUCATION",
            "type": "fields",
            "dataKey": "education"
        },
        {
            "icon": "projects",
            "title": "SIDE-PROJECTS",
            "type": "fields",
            "dataKey": "projects"
        }
    ]
};
