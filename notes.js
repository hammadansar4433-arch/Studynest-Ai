(() => {
  const $ = (id) => document.getElementById(id);
  const STORAGE_KEY = "studynest_ai_notes_v1";
  let currentNotes = "";
  let currentTitle = "";

  const setStatus = (message) => { $("status").textContent = message; };

  $("source").addEventListener("input", () => {
    $("char-count").textContent = `${$("source").value.length} / 2400 characters`;
  });

  $("generate").addEventListener("click", async () => {
    const subject = $("subject").value.trim();
    const source = $("source").value.trim();
    if (!subject || !source) {
      setStatus("Please enter a subject and paste some study material first.");
      return;
    }

    const task = $("task").value;
    const language = $("language").value;
    const prompt = [
      "You are StudyNest, a careful educational study assistant.",
      `Subject/chapter: ${subject}.`,
      `Task: Create ${task}.`,
      `Output language: ${language}.`,
      "Use clear headings and student-friendly explanations. Preserve facts and formulas from the source. Do not invent details. If the source is unclear or incomplete, say so. For MCQs, provide four options and explain the correct answer.",
      "STUDY MATERIAL:",
      source
    ].join("\n");

    const button = $("generate");
    button.disabled = true;
    button.textContent = "Generating...";
    setStatus("StudyNest AI is preparing your material. This may take a moment.");
    $("result").textContent = "Generating your study material...";

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] })
      });

      let data = {};
      try { data = await response.json(); } catch (_) {}
      if (!response.ok) {
        const messages = {
          no_key: "The AI API key is not configured in Vercel.",
          bad_key: "The AI service rejected its API key. Check the Vercel environment variable.",
          rate_limited: "The AI service is busy or its usage limit has been reached. Try again later.",
          model_unavailable: "The AI model is temporarily unavailable. Try again later."
        };
        throw new Error(messages[data.error] || "The AI request failed. Please try again.");
      }
      if (!data.text) throw new Error("The AI returned an empty response.");
      currentNotes = data.text;
      currentTitle = subject;
      $("result").textContent = currentNotes;
      setStatus("Your study material is ready.");
    } catch (error) {
      $("result").textContent = "We couldn't generate your notes.";
      setStatus(error.message || "Something went wrong. Please try again.");
    } finally {
      button.disabled = false;
      button.textContent = "✦ Generate study material";
    }
  });

  $("copy").addEventListener("click", async () => {
    if (!currentNotes) return setStatus("Generate notes before copying.");
    try {
      await navigator.clipboard.writeText(currentNotes);
      setStatus("Notes copied to clipboard.");
    } catch (_) {
      setStatus("Clipboard access was blocked by your browser. You can select and copy the notes manually.");
    }
  });

  $("download").addEventListener("click", () => {
    if (!currentNotes) return setStatus("Generate notes before downloading.");
    const blob = new Blob([currentNotes], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(currentTitle || "StudyNest-notes").replace(/[^a-z0-9-_]+/gi, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });

  function readSaved() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
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
    if (!currentNotes) return setStatus("Generate notes before saving.");
    const notes = readSaved();
    notes.unshift({
      title: currentTitle || $("subject").value.trim() || "My notes",
      content: currentNotes,
      savedAt: new Date().toISOString()
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes.slice(0, 25)));
      renderSaved();
      setStatus("Notes saved in this browser.");
    } catch (_) {
      setStatus("Browser storage is full or unavailable. Download your notes instead.");
    }
  });

  renderSaved();
})();
