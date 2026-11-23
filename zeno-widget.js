
(() => {
  if (document.getElementById("zeno-launcher")) return;

  const languages = [
    ["Auto detect", "auto"],
    ["English", "en-US"],
    ["Urdu", "ur-PK"],
    ["German", "de-DE"],
    ["Arabic", "ar-SA"],
    ["French", "fr-FR"],
    ["Spanish", "es-ES"],
    ["Hindi", "hi-IN"],
    ["Chinese", "zh-CN"],
    ["Japanese", "ja-JP"],
    ["Korean", "ko-KR"],
    ["Italian", "it-IT"],
    ["Portuguese", "pt-PT"],
    ["Turkish", "tr-TR"],
    ["Russian", "ru-RU"],
    ["Dutch", "nl-NL"]
  ];

  const css = `
  #zeno-launcher {
    position:fixed; right:24px; bottom:24px; z-index:99999;
    width:66px;height:66px;border-radius:50%;border:1px solid #38bdf8;
    background:linear-gradient(145deg,#172554,#071426);
    color:white;font-size:30px;cursor:pointer;
    box-shadow:0 0 25px #0ea5e955;
  }
  #zeno-panel {
    position:fixed;right:24px;bottom:104px;z-index:99999;
    width:min(370px,calc(100vw - 28px));height:560px;max-height:75vh;
    display:none;flex-direction:column;overflow:hidden;
    background:#081323;color:#eaf4ff;border:1px solid #24415e;
    border-radius:20px;box-shadow:0 15px 60px #0009;
    font-family:Arial,sans-serif;
  }
  #zeno-panel *{box-sizing:border-box}
  #zeno-panel.open{display:flex}
  .zeno-head{padding:13px 16px;background:#10233b;
    display:flex;align-items:center;justify-content:space-between}
  .zeno-head strong{font-size:17px;color:#7dd3fc}
  .zeno-head small{display:block;color:#94a3b8;margin-top:3px}
  .zeno-close{background:none;border:0;color:white;font-size:23px;cursor:pointer}
  #zeno-stage {
  height: 220px;
  min-height: 220px;
  flex: 0 0 220px;
  position: relative;
  background: radial-gradient(ellipse at center,#15365a,#081323 70%);
  overflow: hidden;
}

#zeno-stage canvas {
  display: block;
  width: 100%;
  height: 100%;
}
  #zeno-stage canvas{width:100%;height:100%;display:block}
  #zeno-fallback{position:absolute;inset:0;display:grid;place-items:center;font-size:85px}
  .zeno-tools{display:flex;gap:8px;padding:9px 12px}
  .zeno-tools select{flex:1;min-width:0;background:#12243a;color:white;
    border:1px solid #29445f;border-radius:9px;padding:9px}
  #zeno-messages{flex:1;overflow-y:auto;padding:12px;display:flex;
    flex-direction:column;gap:10px}
  .zeno-msg{padding:10px 12px;border-radius:13px;max-width:90%;
    line-height:1.45;font-size:14px;white-space:pre-wrap;overflow-wrap:anywhere}
  .zeno-bot{background:#142b43;align-self:flex-start}
  .zeno-user{background:#075985;align-self:flex-end}
  .zeno-inputrow{display:flex;gap:7px;padding:10px;border-top:1px solid #20364e}
  #zeno-input{min-width:0;flex:1;background:#102238;color:white;
    border:1px solid #29445f;border-radius:10px;padding:11px;outline:none}
  .zeno-action{border:0;border-radius:10px;padding:10px 12px;
    background:#0284c7;color:white;cursor:pointer;font-size:16px}
  .zeno-action:disabled{opacity:.5;cursor:wait}
  .zeno-status{text-align:center;font-size:11px;color:#94a3b8;padding:0 8px 8px}
  @media(max-width:480px){
    #zeno-panel{right:10px;bottom:90px;height: min(570px,75vh)}
    #zeno-launcher{right:16px;bottom:16px}
  }`;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const launcher = document.createElement("button");
  launcher.id = "zeno-launcher";
  launcher.innerHTML = "🤖";
  launcher.setAttribute("aria-label", "Open ZENO");

  const panel = document.createElement("section");
  panel.id = "zeno-panel";
  panel.innerHTML = `
    <div class="zeno-head">
      <div><strong>🤖 ZENO</strong><small>Your AI study companion</small></div>
      <button class="zeno-close" id="zeno-close">×</button>
    </div>
    <div id="zeno-stage"><div id="zeno-fallback">🤖</div></div>
    <div class="zeno-tools">
      <select id="zeno-language" aria-label="Language">
        ${languages.map(([name, code]) =>
          '<option value="' + code + '">' + name + '</option>'
        ).join("")}
      </select>
      <button class="zeno-action" id="zeno-voice" title="Toggle spoken answers">🔊</button>
    </div>
    <div id="zeno-messages">
      <div class="zeno-msg zeno-bot">
        Hello! I'm ZENO. Ask me anything about your studies, in your language! 🌍
      </div>
    </div>
    <div class="zeno-inputrow">
      <button class="zeno-action" id="zeno-mic" title="Speak">🎤</button>
      <input id="zeno-input" placeholder="Ask ZENO anything..." />
      <button class="zeno-action" id="zeno-send">➤</button>
    </div>
    <div class="zeno-status" id="zeno-status">Ready to help you learn</div>
  `;

  document.body.append(launcher, panel);

  const $ = id => document.getElementById(id);
  const messages = $("zeno-messages");
  const input = $("zeno-input");
  const status = $("zeno-status");
  let speakingEnabled = true;
  let busy = false;
  let recognition = null;
  let history = [];

  const selectedLanguage = () => $("zeno-language").value;
  const speechLanguage = () =>
    selectedLanguage() === "auto"
      ? (navigator.language || "en-US")
      : selectedLanguage();

  function addMessage(text, type) {
    const el = document.createElement("div");
    el.className = "zeno-msg " + (type === "user" ? "zeno-user" : "zeno-bot");
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  function speak(text) {
    if (!speakingEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const lang = speechLanguage();
    utterance.lang = lang;
    utterance.rate = 1.08;
    utterance.pitch = 1.3;
    const voices = window.speechSynthesis.getVoices();
    const prefix = lang.split("-")[0].toLowerCase();
    const matchingVoices = voices.filter(v =>
  v.lang.toLowerCase().startsWith(prefix)
);

const match =
  matchingVoices.find(v => /young|natural|neural/i.test(v.name)) ||
  matchingVoices.find(v => !/compact|novelty/i.test(v.name)) ||
  matchingVoices[0];

if (match) utterance.voice = match;
 

    utterance.onstart = () => {
      $("zeno-stage").classList.add("zeno-speaking");
    };
    utterance.onend = () => {
      $("zeno-stage").classList.remove("zeno-speaking");
    };
    utterance.onerror = () => {
      $("zeno-stage").classList.remove("zeno-speaking");
    };
    window.speechSynthesis.speak(utterance);
  }

  async function askZeno(question) {
    if (!question.trim() || busy) return;
    busy = true;
    $("zeno-send").disabled = true;
    addMessage(question, "user");
    input.value = "";
    status.textContent = "ZENO is thinking...";

    const languageInstruction = selectedLanguage() === "auto"
      ? "Detect the language of the student's latest message and reply in that same language."
      : "Reply in " + languages.find(x => x[1] === selectedLanguage())[0] + ".";

    const systemPrompt =
      "You are ZENO, a friendly, intelligent and encouraging AI study companion inside StudyNest. " +
      languageInstruction +
      " Explain concepts clearly at a student's level. Help with school subjects, coding, " +
      "quizzes and study questions. Use readable formatting. Do not claim to be human.";

    history.push({ role: "user", content: question });
    if (history.length > 12) history = history.slice(-12);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: systemPrompt },
            ...history
          ]
        })
      });

      if (!response.ok) throw new Error("AI service returned " + response.status);

      const data = await response.json();
      const answer = data.text || data.reply || data.response;

      if (!answer) throw new Error("The AI response was empty.");

      history.push({ role: "assistant", content: answer });
      addMessage(answer, "bot");
      speak(answer);
      status.textContent = "Ready for your next question";
    } catch (error) {
      history.pop();
      addMessage(
        "Sorry! I couldn't connect to the AI service. Please check your internet connection and try again.",
        "bot"
      );
      status.textContent = "Connection problem";
      console.error("ZENO:", error);
    } finally {
      busy = false;
      $("zeno-send").disabled = false;
    }
  }

  launcher.addEventListener("click", () => {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) input.focus();
  });

  $("zeno-close").addEventListener("click", () => {
    panel.classList.remove("open");
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  });

  $("zeno-send").addEventListener("click", () => askZeno(input.value));
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") askZeno(input.value);
  });

  $("zeno-voice").addEventListener("click", () => {
    speakingEnabled = !speakingEnabled;
    $("zeno-voice").textContent = speakingEnabled ? "🔊" : "🔇";
    if (!speakingEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  });

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  $("zeno-mic").addEventListener("click", () => {
    if (!SpeechRecognition) {
      status.textContent = "Voice input isn't supported in this browser. Try Chrome or Edge.";
      return;
    }
    if (recognition) recognition.stop();

    recognition = new SpeechRecognition();
    recognition.lang = speechLanguage();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => status.textContent = "Listening...";
    recognition.onresult = event => {
      const spokenText = event.results[0][0].transcript;
      input.value = spokenText;
      askZeno(spokenText);
    };
    recognition.onerror = event => {
      status.textContent = "Microphone issue: " + event.error;
    };
    recognition.onend = () => {
      if (status.textContent === "Listening...") status.textContent = "Ready";
    };

    try { recognition.start(); }
    catch (error) { status.textContent = "Please try the microphone again."; }
  });

  // Load a lightweight 3D robot using Three.js.
  function loadRobot() {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = createRobot;
    script.onerror = () => {
      $("zeno-fallback").textContent = "🤖";
    };
    document.head.appendChild(script);
  }

  function createRobot() {
    if (!window.THREE) return;

    const THREE = window.THREE;
    const stage = $("zeno-stage");
    const fallback = $("zeno-fallback");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, stage.clientWidth / stage.clientHeight, 0.1, 100);
    camera.position.set(0, 1.1, 6);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    stage.appendChild(renderer.domElement);
    fallback.style.display = "none";

    scene.add(new THREE.AmbientLight(0xffffff, 1.3));
    const light = new THREE.PointLight(0x38bdf8, 2.2);
    light.position.set(2, 3, 4);
    scene.add(light);

    const robot = new THREE.Group();
    scene.add(robot);

    const blue = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, metalness: 0.65, roughness: 0.28
    });
    const dark = new THREE.MeshStandardMaterial({
      color: 0x101c31, metalness: 0.4, roughness: 0.3
    });
    const glow = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
    const white = new THREE.MeshStandardMaterial({ color: 0xe0f2fe });

    function sphere(parent, material, x, y, z, sx, sy, sz) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 24), material
      );
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      parent.add(mesh);
      return mesh;
    }

    // Body
    sphere(robot, blue, 0, -0.7, 0, 0.57, 0.65, 0.38);

    // Head
    const head = new THREE.Group();
    head.position.set(0, 0.55, 0);
    robot.add(head);
    sphere(head, blue, 0, 0, 0, 0.72, 0.59, 0.53);
    sphere(head, dark, 0, -0.02, 0.43, 0.61, 0.39, 0.17);

    // Eyes
    sphere(head, glow, -0.23, 0.04, 0.59, 0.09, 0.12, 0.04);
    sphere(head, glow, 0.23, 0.04, 0.59, 0.09, 0.12, 0.04);

    // Mouth
    const mouth = sphere(head, glow, 0, -0.23, 0.595, 0.15, 0.025, 0.025);

    // Antenna
    const antenna = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, 0.23, 12), blue
    );
    antenna.position.set(0, 0.67, 0);
    head.add(antenna);
    sphere(head, glow, 0, 0.8, 0, 0.08, 0.08, 0.08);

    // Arms
    const arms = [];
    [-1, 1].forEach(side => {
      const arm = new THREE.Group();
      arm.position.set(side * 0.55, -0.45, 0);
      robot.add(arm);
      sphere(arm, blue, side * 0.17, -0.18, 0, 0.16, 0.32, 0.16);
      sphere(arm, white, side * 0.17, -0.43, 0, 0.15, 0.15, 0.15);
      arms.push(arm);
    });

    // Legs
    [-1, 1].forEach(side => {
      sphere(robot, dark, side * 0.25, -1.28, 0, 0.19, 0.35, 0.2);
    });

    let frame = 0;
    function animate() {
      requestAnimationFrame(animate);
      frame += 0.025;

      robot.position.y = Math.sin(frame * 1.5) * 0.055;
      robot.rotation.y = Math.sin(frame * 0.6) * 0.12;
      head.rotation.z = Math.sin(frame) * 0.025;
      arms[0].rotation.z = Math.sin(frame * 1.5) * 0.08;
      arms[1].rotation.z = -Math.sin(frame * 1.5) * 0.08;

      const isSpeaking = window.speechSynthesis &&
        window.speechSynthesis.speaking;
      mouth.scale.y = isSpeaking
        ? 0.025 + Math.abs(Math.sin(frame * 10)) * 0.11
        : 0.025;

      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener("resize", () => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  loadRobot();
})();
