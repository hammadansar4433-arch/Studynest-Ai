
(() => {
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "studynest_ai_notes_v1";

  let currentNotes = "";
  let currentTitle = "";

  const setStatus = (message) => {
    $("status").textContent = message;
  };

  $("generate").addEventListener("click", async () => {
    const subject = $("subject").value.trim();
    const extra = $("source").value.trim();

    if (!subject) {
      setStatus("Please enter a topic first.");
      $("subject").focus();
      return;
    }

    const task = $("task").value;
    const language = $("language").value;

    const prompt = `
You are StudyNest AI, an expert educational tutor.

Create educational material FROM SCRATCH about this topic:

TOPIC: ${subject}

TASK: ${task}
OUTPUT LANGUAGE: ${language}

STUDENT REQUIREMENTS:
${extra || "No additional instructions."}

IMPORTANT INSTRUCTIONS:
- Do not ask the student to paste chapter notes.
- Generate the material using your own knowledge.
- Use clear headings and organized sections.
- Explain concepts in simple, student-friendly language.
- Include important definitions and examples.
- Include relevant formulas and explain their symbols.
- For science topics, explain the concepts accurately.
- For MCQs, provide four options and explain the correct answer.
- Do not invent facts, references or textbook page numbers.
- If something is uncertain, clearly mention it.
- Make the notes useful for exam preparation.
- End with a short revision summary.

Generate the requested material now.
`;

    const button = $("generate");
    button.disabled = true;
    button.textContent = "Generating...";
    setStatus("StudyNest AI is creating your notes...");
    $("result").textContent = "Preparing your study material...";

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }]
        })
      });

      let data = {};
      try {
        data = await response.json();
      } catch (_) {}

      if (!response.ok) {
        const messages = {
          no_key: "AI API key is not configured in Vercel.",
          bad_key: "The AI service rejected its API key. Check Vercel settings.",
          rate_limited: "AI usage limit reached. Please try again later.",
          model_unavailable: "AI model is temporarily unavailable."
        };

        throw new Error(
          messages[data.error] || "AI request failed. Please try again."
        );
      }

      if (!data.text) {
        throw new Error("The AI returned an empty response.");
      }

      currentNotes = data.text;
      currentTitle = subject;

      $("result").textContent = currentNotes;
      setStatus("Your notes have been generated successfully!");

    } catch (error) {
      $("result").textContent = "We couldn't generate your notes.";
      setStatus(error.message || "Something went wrong.");
    } finally {
      button.disabled = false;
      button.textContent = "✦ Generate my notes";
    }
  });

  $("copy").addEventListener("click", async () => {
    if (!currentNotes) {
      return setStatus("Generate notes before copying.");
    }

    try {
      await navigator.clipboard.writeText(currentNotes);
      setStatus("Notes copied successfully!");
    } catch (_) {
      setStatus("Clipboard access blocked. Please copy manually.");
    }
  });

  $("download").addEventListener("click", () => {
    if (!currentNotes) {
      return setStatus("Generate notes before downloading.");
    }

    const blob = new Blob([currentNotes], {
      type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download =
      `${(currentTitle || "StudyNest-notes").replace(/[^a-z0-9-_]+/gi, "-")}.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  function readSaved() {
    try {
      const value = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function renderSaved() {
    const list = $("saved-list");
    list.replaceChildren();

    const notes = readSaved();

    if (!notes.length) {
      list.textContent = "No saved notes yet.";
      return;
    }

    notes.forEach((note) => {
      const row = document.createElement("div");
      row.className = "saved-item";

      const title = document.createElement("span");
      title.className = "saved-title";
      title.textContent = note.title || "Untitled notes";

      const open = document.createElement("button");
      open.className = "secondary";
      open.type = "button";
      open.textContent = "Open";

      open.addEventListener("click", () => {
        currentTitle = note.title || "StudyNest notes";
        currentNotes = note.content || "";

        $("subject").value = currentTitle;
        $("result").textContent = currentNotes;

        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      row.append(title, open);
      list.append(row);
    });
  }

  $("save").addEventListener("click", () => {
    if (!currentNotes) {
      return setStatus("Generate notes before saving.");
    }

    const notes = readSaved();

    notes.unshift({
      title: currentTitle || $("subject").value.trim() || "My notes",
      content: currentNotes,
      savedAt: new Date().toISOString()
    });

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(notes.slice(0, 25))
      );

      renderSaved();
      setStatus("Notes saved successfully!");
    } catch (_) {
      setStatus("Browser storage is full. Download your notes instead.");
    }
  });

  renderSaved();
})();
