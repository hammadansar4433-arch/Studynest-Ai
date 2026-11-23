STUDYNEST ADD-ON PACK — INSTALLATION GUIDE

This pack contains:
- notes.html, notes.css, notes.js: standalone AI Notes Generator page
- lab3d-projects.js: adds four extra interactive 3D projects below your existing 3D Lab
- README-INSTALL.txt: these instructions

IMPORTANT SAFETY / BACKUP
1. Before uploading, open your GitHub repository and check that you are on the main branch.
2. Your current public repository has index.html loading lab3d.js near the bottom of the page.
3. Do not delete or replace index.html, lab3d.js, api/, auth.js, calc.js, or package.json.
4. For an easy rollback, create a GitHub branch or download a ZIP backup of the repository first.

PART A — AI NOTES GENERATOR
1. Extract this ZIP on your computer.
2. In GitHub, open the Studynest-Ai repository.
3. Choose Add file -> Upload files.
4. Upload notes.html, notes.css and notes.js into the repository root (the same folder as index.html).
5. Commit the changes to main.
6. After Vercel deploys, open https://studynest1-navy.vercel.app/notes.html

The notes page calls your existing /api/ai endpoint. Your Vercel project needs the existing GEMINI_API_KEY environment variable configured. Notes are saved in local browser storage only; they are not cloud-synced.

PART B — EXTRA 3D LAB PROJECTS
The existing lab3d.js is left untouched. The new file adds a separate extension panel underneath the existing 3D Lab section.

1. In GitHub, upload lab3d-projects.js into the repository root (same folder as index.html).
2. Open index.html in GitHub and click the pencil (Edit) icon.
3. Near the bottom, find this existing line:
   <script src="lab3d.js" defer></script>
4. Immediately BELOW it, add this one line:
   <script src="lab3d-projects.js" defer></script>
5. Commit the edit. Do not remove or change the existing lab3d.js line.
6. Wait for Vercel to deploy, then open the homepage and scroll to the 3D Lab.

New projects:
- Physics: Wave on a string
- Physics: Refraction of light (Snell's law)
- Biology: Plant cell
- Mathematics: Unit circle (sine and cosine)

The extra models use the same Three.js CDN already used by the original 3D Lab. The extension is lazy-loaded when its panel approaches the screen.

TEST CHECKLIST
After deployment, test:
- Homepage loads and existing sections are still present.
- Existing 3D Lab still opens and its original project tabs still work.
- Extra 3D panel loads after scrolling to it.
- Project selector and slider update the model and facts.
- AI Notes page opens and can call the AI endpoint.
- On the AI Notes page, test copy, download and save.
- Test on desktop and mobile.

If something goes wrong:
- Open GitHub -> index.html -> History to restore the previous index.html version.
- If the add-on script causes a problem, remove only the new lab3d-projects.js script line from index.html and commit.
- If the Notes page has a problem, delete only notes.html, notes.css and notes.js; the existing homepage files are separate.

LIMITATIONS
No code change can guarantee a fault-free deployment across every browser/device. This pack is designed to avoid replacing existing core files; still use a backup and run the checklist after deployment.
