StudyNest - deploy on Vercel
1. Get a free Gemini API key from Google AI Studio (aistudio.google.com).
2. Upload this folder to a GitHub repository (or use the Vercel CLI: run "npx vercel" in this folder).
3. On vercel.com: Add New > Project > import the repository.
4. Before pressing Deploy, open Environment Variables and add:
     Name:  GEMINI_API_KEY
     Value: your key
5. Press Deploy. Open the link Vercel gives you.

If the AI says "Something went wrong", open api/ai.js and change the model name
"gemini-2.5-flash" to a current one shown in Google AI Studio, then redeploy.
Your planner data is saved in each person's own browser.

3D Lab: the section loads three.js from cdnjs the first time it scrolls into view, so it needs internet once per visit. Code is in lab3d.js.

Visitor tracking (Neon database):
1. Vercel > your project > Storage > Create > Neon (free). Connect it to this project. It adds DATABASE_URL for you.
2. Settings > Environment Variables > add ADMIN_KEY with a password you choose. Redeploy.
3. Open  your-site/admin.html  and type the ADMIN_KEY to see visitors.
Open your site once with ?owner=1 on the end to stop your own visits from being counted (?owner=0 undoes it).
AI check: open /api/ai?test=1 on your site to see which Gemini model works.

Sign up / Log in (email + password):
1. Needs the Neon database above (DATABASE_URL).
2. Vercel > Settings > Environment Variables > add AUTH_SECRET = any long random text (30+ characters). Redeploy.
3. In auth.js the first line "const REQUIRED=true" means everyone must sign up. Change it to false to let people skip.
4. See everyone who signed up in admin.html (with a CSV download of their emails).
Passwords are stored hashed. There is no "forgot password" email yet (that needs an email service).
