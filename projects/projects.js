/* =================================================================
   PROJECTS DATA — single source of truth for every project shown on
   the site (CV experience listings, /projects/ gallery, /cvprojects/,
   and per-project detail pages at /projects/<company>/<name>/).

   Each entry declares which company/category it belongs to via
   `company`. Companies are defined in cv.js (experience[].org and
   projects[].title — e.g. "Side-Projects").

   At the bottom of this file a bootstrap walks window.CV_DATA and
   re-populates the matching `projects` arrays in-place, so no
   downstream renderer has to know about this split.

   NOTE: This file is rewritten by dev-server.py when projects are
   edited via the localhost visual editor. Manual edits are preserved
   inside individual entries; section grouping comments are
   regenerated on save.
   ================================================================= */
window.PROJECTS_DATA = [
    /* ===== Nagelld ===== */
    {
        "company": "Nagelld",
        "name": "Crane Simulator",
        "date": "",
        "summary": "A complex and highly realistic internal overhead crane simulator with a custom grayscale-shaded environment so objective objects and the crane itself pop out.",
        "popupDescription": "A complex and highly realistic internal overhead crane simulator with a custom environment shaded in grayscale so that objective objects and the crane itself pops out. Featuring easily customizable courses and loads. The crane can be easily modified and have many customizable parameters, featuring complex crane features for realistic training scenarios.",
        "image": "/assets/images/cvprojects/nagelld_cranesimulator.jpeg",
        "tags": [
            "Unity",
            "C#",
            "VR / XR",
            "Mobile"
        ],
        "link": {
            "url": "",
            "label": "",
            "showOnCard": false
        }
    },
    {
        "company": "Nagelld",
        "name": "Boat Simulator",
        "date": "",
        "summary": "Solo-developed boat simulator with realistic physics, multi-user crew, and modular boats for varied weather scenarios.",
        "popupDescription": "I was the solo developer behind this Boat Simulator. The boat simulator features a highly realistic and detailed physics engine simulating accurate boat physics, and realistic crane physics for lowering the boat by davit. Multiple users can walk around freely on the boat while driving and need to work and communicate together to problem-solve and exercise in various waves, wind and weather conditions. The simulator is modular allowing you to swap out boats and setup custom scenarios quickly.",
        "image": "/assets/images/cvprojects/nagelld_boatsim.jpeg",
        "tags": [
            "Unreal Engine",
            "Blueprint",
            "VR / XR",
            "Networking"
        ]
    },
    {
        "company": "Nagelld",
        "name": "Fire Fighting Experiment",
        "date": "",
        "summary": "Short internal VR experiment for extinguishing fires in low-visibility, smoke-filled environments.",
        "popupDescription": "A short, internal unfinished experiment for a VR fire-fighting experience where the user extinguishes fires and navigates various low visibility, smoke-filled environments.",
        "image": "/assets/images/cvprojects/nagelld_firesim.jpeg",
        "tags": [
            "Unreal Engine",
            "Blueprint",
            "VR / XR"
        ]
    },
    {
        "company": "Nagelld",
        "name": "Interactive Application",
        "date": "",
        "summary": "Mobile 3D viewer for product presentations — rotate, zoom, pan and pick models apart, optimized for weak hardware.",
        "popupDescription": "Interactive viewer is a mobile application that visualizes 3d models or solutions, designed for highlighting important product details for presentations with good user-experience at the core. It allows rotating around, zooming in and panning around models and picking them apart showing interior parts of motors or other enclosed systems, or highlighting and visualizing flow direction in a pump system. Optimized for weak hardware allowing for great performance on mobile phones or tablets.",
        "image": "/assets/images/cvprojects/nagelld_interactiveapp.jpeg",
        "tags": [
            "Unity",
            "C#",
            "Mobile"
        ]
    },
    {
        "company": "Nagelld",
        "name": "Boat Simulator Quest",
        "date": "",
        "summary": "Reworked the Boat Simulator from Unreal to Unity for mobile VR — added networking, hand-tracking, and physical control support.",
        "popupDescription": "Completely reworked the entire Boat Simulator and ported it from Unreal Engine to Unity for running on mobile VR hardware. Maintaining a good visual quality while optimized for running on weak hardware. The simulator includes all the features of the previous one, but adds better networking and hand-tracking features while supporting physical boat controls tied to the simulator.",
        "image": "/assets/images/cvprojects/nagelld_boatsimquest.jpeg",
        "tags": [
            "Unity",
            "C#",
            "VR / XR",
            "Networking",
            "Mobile"
        ]
    },
    {
        "company": "Nagelld",
        "name": "Offshore Supply Vessel Bridge",
        "date": "",
        "summary": "Designed, modelled and textured a generic OSV bridge with baked lighting for high-quality mobile VR visuals.",
        "popupDescription": "Designed, modelled and textured the bridge of a generic offshore supply vessel. Then setup baked lighting for high quality visuals on mobile VR hardware.",
        "image": "/assets/images/cvprojects/nagelld_vesselbridge.jpeg",
        "tags": [
            "Unity",
            "VR / XR",
            "Blender",
            "Substance Painter"
        ]
    },

    /* ===== Visual Engineering ===== */
    {
        "company": "Visual Engineering",
        "name": "VR Crane Simulator",
        "summary": "Overhead and tower crane VR simulator with courses to test operator skill. Published to Meta AppStore, runs natively on mobile VR hardware.",
        "popupDescription": "Crane Simulator for overhead crane and tower-crane providing various challenges and courses to test operators skill. Published to Meta AppStore. Running directly on mobile VR hardware.",
        "image": "/assets/images/cvprojects/ve_cranesim.jpeg",
        "tags": [
            "Unity",
            "C#",
            "VR / XR",
            "Mobile"
        ]
    },

    /* ===== Side-Projects ===== */
    {
        "company": "Side-Projects",
        "name": "TINY VOTERS",
        "date": "",
        "summary": "Ever had problems making up your mind? Tiny Voters will help you decide. Get answers at once whether it's yes, no, a number you're thinking of, or anything else.",
        "popupDescription": "Tiny Voters is an interactive decision-making web application designed to help users overcome choice paralysis and make decisions quickly and efficiently. Whether you're trying to decide between yes or no, pick a random number, or choose from a list of options, Tiny Voters provides an engaging and visually appealing solution.\n\nBuilt with Unity and deployed as a WebGL application, Tiny Voters combines the power of game engine technology with web accessibility, creating a smooth and responsive user experience across all devices and platforms.\n\nThe application features cute animated characters called \"Tiny Voters\" who cast their votes to help you make decisions. Each decision type has its own unique voting mechanism, making the process both functional and entertaining.",
        "image": "/assets/images/cvprojects/private_tinyvoters.png",
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
        }
    },
    {
        "company": "Side-Projects",
        "name": "STAR CITIZEN TRACKER",
        "date": "",
        "summary": "A .NET Application using HTML for frontend and a C# backend, that tracks player statistics in-game and uploads the data in real-time to an SQL database.",
        "popupDescription": "A .NET Application using HTML for frontend and a C# backend, that tracks player statistics in-game and uploads the data in real-time to an SQL database. The website provides a user-friendly, realtime analytics dashboard for players to view their performance and statistics directly from the database using secure Web Service APIs. The .NET application provides, like the website, a login interface that verifies users securely using encrypted credentials, ensuring data privacy and security.\nThe design of the .NET App and Website was designed as modern minimalism with the principle of 3 colors for the entire website, where the colors could flip to allow darkmode viewing, reveal hovered interaction states, intent and contrast.",
        "image": "/assets/images/cvprojects/private_sctracker.png",
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
        "company": "Side-Projects",
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
        "company": "Side-Projects",
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
    }
];

/* =================================================================
   BOOTSTRAP — merge PROJECTS_DATA back into CV_DATA so existing
   renderers that read CV_DATA.experience[].projects and
   CV_DATA.projects[].projects keep working unchanged.
   ================================================================= */
(function mergeIntoCv() {
    const cv = window.CV_DATA;
    if (!cv) return;

    function projectsForCompany(companyName) {
        const want = (companyName || '').toLowerCase();
        return window.PROJECTS_DATA
            .filter(p => (p.company || '').toLowerCase() === want)
            .map(p => { const { company, ...rest } = p; return rest; });
    }

    (cv.experience || []).forEach(exp => {
        const matches = projectsForCompany(exp.org);
        if (matches.length) exp.projects = matches;
    });

    (cv.projects || []).forEach(group => {
        const matches = projectsForCompany(group.title);
        if (matches.length) group.projects = matches;
    });
})();
