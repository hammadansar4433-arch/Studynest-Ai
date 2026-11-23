
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
    position:fixed;right:24px;bottom:24px;z-index:99999;
    width:66px;height:66px;border-radius:50%;
    border:1px solid #38bdf8;
    background:linear-gradient(145deg,#172554,#071426);
    color:white;font-size:30px;cursor:pointer;
    box-shadow:0 0 25px #0ea5e955;
  }

  #zeno-panel {
    position:fixed;right:24px;bottom:104px;z-index:99999;
    width:min(390px,calc(100vw - 28px));
    height:620px;max-height:82vh;
    display:none;flex-direction:column;overflow:hidden;
    background:#081323;color:#eaf4ff;
    border:1px solid #24415e;border-radius:20px;
    box-shadow:0 15px 60px #0009;
    font-family:Arial,sans-serif;
  }

  #zeno-panel * {box-sizing:border-box}
  #zeno-panel.open {display:flex}

  .zeno-head {
    padding:13px 16px;background:#10233b;
    display:flex;align-items:center;justify-content:space-between;
    flex:0 0 auto;
  }

  .zeno-head strong {font-size:17px;color:#7dd3fc}
  .zeno-head small {display:block;color:#94a3b8;margin-top:3px}
  .zeno-close {
    background:none;border:0;color:white;
    font-size:23px;cursor:pointer;
  }

  #zeno-stage {
    height:240px;min-height:200px;flex:0 0 240px;
    position:relative;
    background:radial-gradient(ellipse at center,#19446c,#081323 72%);
    overflow:hidden;
  }

  #zeno-stage canvas {
    display:block;width:100%;height:100%;
  }

  #zeno-fallback {
    position:absolute;inset:0;
    display:grid;place-items:center;font-size:85px;
  }

  .zeno-tools {display:flex;gap:8px;padding:9px 12px;flex:0 0 auto}

  .zeno-tools select {
    flex:1;min-width:0;background:#12243a;color:white;
    border:1px solid #29445f;border-radius:9px;padding:9px;
  }

  #zeno-messages {
    flex:1;min-height:55px;overflow-y:auto;padding:12px;
    display:flex;flex-direction:column;gap:10px;
  }

  .zeno-msg {
    padding:10px 12px;border-radius:13px;max-width:90%;
    line-height:1.55;font-size:14px;white-space:pre-wrap;
    overflow-wrap:anywhere;
  }

  .zeno-bot {background:#142b43;align-self:flex-start}
  .zeno-user {background:#075985;align-self:flex-end}

  .zeno-inputrow {
    display:flex;gap:7px;padding:10px;
    border-top:1px solid #20364e;flex:0 0 auto;
  }

  #zeno-input {
    min-width:0;flex:1;background:#102238;color:white;
    border:1px solid #29445f;border-radius:10px;
    padding:11px;outline:none;
  }

  .zeno-action {
    border:0;border-radius:10px;padding:10px 12px;
    background:#0284c7;color:white;cursor:pointer;font-size:16px;
  }

  .zeno-action:disabled {opacity:.5;cursor:wait}
  .zeno-status {
    text-align:center;font-size:11px;color:#94a3b8;
    padding:0 8px 8px;flex:0 0 auto;
  }

  @media(max-width:480px) {
    #zeno-panel {
      right:10px;bottom:90px;
      height:min(650px,82vh);
    }
    #zeno-launcher {right:16px;bottom:16px}
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
      <div>
        <strong>🤖 ZENO</strong>
        <small>Your AI study companion</small>
      </div>
      <button class="zeno-close" id="zeno-close">×</button>
    </div>

    <div id="zeno-stage">
      <div id="zeno-fallback">🤖</div>
    </div>

    <div class="zeno-tools">
      <select id="zeno-language" aria-label="Language">
        ${languages.map(([name, code]) =>
          '<option value="' + code + '">' + name + '</option>'
        ).join("")}
      </select>
      <button class="zeno-action" id="zeno-voice"
        title="Toggle spoken answers">🔊</button>
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

    <div class="zeno-status" id="zeno-status">
      Ready to help you learn
    </div>
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

  // -------------------------------
  // LANGUAGE SETTINGS
  // -------------------------------

  const selectedLanguage = () => $("zeno-language").value;

  function detectSpeechLanguage(text) {
    if (selectedLanguage() !== "auto") {
      return selectedLanguage();
    }

    // Detect common writing systems.
    if (/[ٹڈڑںھہچژگپے]/.test(text)) return "ur-PK";
    if (/[\u0900-\u097F]/.test(text)) return "hi-IN";
    if (/[\u4e00-\u9fff]/.test(text)) return "zh-CN";
    if (/[\u3040-\u30ff]/.test(text)) return "ja-JP";
    if (/[\uac00-\ud7af]/.test(text)) return "ko-KR";
    if (/[\u0600-\u06FF]/.test(text)) return "ar-SA";

    return navigator.language || "en-US";
  }

  function addMessage(text, type) {
    const el = document.createElement("div");
    el.className =
      "zeno-msg " + (type === "user" ? "zeno-user" : "zeno-bot");
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  // -------------------------------
  // NATURALER VOICE SELECTION
  // -------------------------------

  function speak(text) {
    if (!speakingEnabled || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const lang = detectSpeechLanguage(text);
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = lang;
    utterance.rate = 0.96;
    utterance.pitch = 1.2;

    const voices = window.speechSynthesis.getVoices();
    const prefix = lang.split("-")[0].toLowerCase();

    const matchingVoices = voices.filter(v =>
      v.lang.toLowerCase().startsWith(prefix)
    );

    // Prefer Pakistani Urdu voices when available.
    let match = null;

    if (prefix === "ur") {
      match =
        matchingVoices.find(v => /pakistan|pakistani/i.test(v.name)) ||
        matchingVoices.find(v => /ur-pk/i.test(v.lang));
    }

    if (!match) {
      match =
        matchingVoices.find(v => /natural|neural|premium/i.test(v.name)) ||
        matchingVoices.find(v => !/compact|novelty/i.test(v.name)) ||
        matchingVoices[0];
    }

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

  // -------------------------------
  // AI CHAT
  // -------------------------------

  async function askZeno(question) {
    if (!question.trim() || busy) return;

    busy = true;
    $("zeno-send").disabled = true;

    addMessage(question, "user");
    input.value = "";
    status.textContent = "ZENO is thinking...";

    const languageCode = selectedLanguage();
    const languageName =
      languages.find(x => x[1] === languageCode)?.[0] || "the student's language";

    let languageInstruction;

    if (languageCode === "ur-PK") {
      languageInstruction =
        "Reply in natural, fluent Pakistani Urdu using Urdu script. " +
        "Always address the student respectfully using آپ, not تم or تو. " +
        "Use everyday Pakistani Urdu expressions and natural sentence structure. " +
        "Avoid awkward literal translations, overly formal wording, and unnecessary Hindi vocabulary. " +
        "If a technical English term is commonly used in Pakistan, you may keep that term in English.";
    } else if (languageCode === "auto") {
      languageInstruction =
        "Detect the language of the student's latest message and reply in that same language. " +
        "If the student writes Urdu, reply in natural Pakistani Urdu using Urdu script. " +
        "Use respectful آپ when speaking Urdu. Do not switch to Hindi unless the student uses Hindi.";
    } else {
      languageInstruction =
        "Reply naturally in " + languageName +
        ". Use natural everyday expressions and correct spelling.";
    }

    const systemPrompt =
      "You are ZENO, a friendly, intelligent and encouraging AI study companion inside StudyNest. " +
      languageInstruction +
      " Explain concepts clearly at a student's level. Help with school subjects, coding, " +
      "quizzes and study questions. Be warm, clear and conversational. " +
      "Do not claim to be human. Keep simple answers concise.";

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

      if (!response.ok) {
        throw new Error("AI service returned " + response.status);
      }

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

  // -------------------------------
  // PANEL OPEN / CLOSE
  // -------------------------------

  launcher.addEventListener("click", () => {
    panel.classList.toggle("open");

    if (panel.classList.contains("open")) {
      input.focus();

      // Important: initialize the robot AFTER the panel is visible.
      requestAnimationFrame(() => {
        loadRobot();
        resizeRobot();
      });
    } else {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  });

  $("zeno-close").addEventListener("click", () => {
    panel.classList.remove("open");

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  });

  $("zeno-send").addEventListener("click", () => {
    askZeno(input.value);
  });

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

  // -------------------------------
  // MICROPHONE
  // -------------------------------

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  $("zeno-mic").addEventListener("click", () => {
    if (!SpeechRecognition) {
      status.textContent =
        "Voice input isn't supported here. Try Chrome or Edge.";
      return;
    }

    if (recognition) recognition.stop();

    recognition = new SpeechRecognition();

    recognition.lang =
      selectedLanguage() === "auto"
        ? (navigator.language || "en-US")
        : selectedLanguage();

    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      status.textContent = "Listening...";
    };

    recognition.onresult = event => {
      const spokenText = event.results[0][0].transcript;
      input.value = spokenText;
      askZeno(spokenText);
    };

    recognition.onerror = event => {
      status.textContent = "Microphone issue: " + event.error;
    };

    recognition.onend = () => {
      if (status.textContent === "Listening...") {
        status.textContent = "Ready";
      }
    };

    try {
      recognition.start();
    } catch (error) {
      status.textContent = "Please try the microphone again.";
    }
  });

  // -------------------------------
  // THREE.JS ROBOT
  // -------------------------------

  let robotLoading = false;
  let robotInitialized = false;
  let robotRenderer = null;
  let robotCamera = null;
  let robotScene = null;
  let robotObject = null;
  let robotHead = null;
  let robotMouth = null;
  let robotEyes = [];
  let robotArms = [];
  let robotFrame = 0;
  let lastBlink = 0;
  let blinking = false;
  let blinkTime = 0;

  function loadRobot() {
    if (robotInitialized || robotLoading) return;

    if (window.THREE) {
      createRobot();
      return;
    }

    robotLoading = true;

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";

    script.onload = () => {
      robotLoading = false;
      createRobot();
    };

    script.onerror = () => {
      robotLoading = false;
      $("zeno-fallback").textContent = "🤖";
      status.textContent = "3D robot couldn't load. Check your connection.";
    };

    document.head.appendChild(script);
  }

  function resizeRobot() {
    if (!robotRenderer || !robotCamera) return;

    const stage = $("zeno-stage");
    const width = stage.clientWidth;
    const height = stage.clientHeight;

    if (!width || !height) return;

    robotCamera.aspect = width / height;
    robotCamera.updateProjectionMatrix();
    robotRenderer.setSize(width, height);
  }

  function createRobot() {
    if (robotInitialized || !window.THREE) return;

    const stage = $("zeno-stage");
    const width = stage.clientWidth;
    const height = stage.clientHeight;

    // Wait until the visible panel has real dimensions.
    if (!width || !height) {
      requestAnimationFrame(createRobot);
      return;
    }

    const THREE = window.THREE;

    robotScene = new THREE.Scene();

    robotCamera = new THREE.PerspectiveCamera(
      35,
      width / height,
      0.1,
      100
    );

    robotCamera.position.set(0, 0, 7.2);
    robotCamera.lookAt(0, -0.12, 0);

    robotRenderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });

    robotRenderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 2)
    );

    robotRenderer.setSize(width, height);
    stage.appendChild(robotRenderer.domElement);

    $("zeno-fallback").style.display = "none";

    // Lighting
    robotScene.add(new THREE.AmbientLight(0xffffff, 1.5));

    const mainLight = new THREE.PointLight(0x38bdf8, 2.5);
    mainLight.position.set(2, 3, 5);
    robotScene.add(mainLight);

    const sideLight = new THREE.PointLight(0x2563eb, 1.5);
    sideLight.position.set(-3, 0, 2);
    robotScene.add(sideLight);

    robotObject = new THREE.Group();
    robotScene.add(robotObject);

    // Materials
    const blue = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.65,
      roughness: 0.25
    });

    const dark = new THREE.MeshStandardMaterial({
      color: 0x101c31,
      metalness: 0.5,
      roughness: 0.3
    });

    const glow = new THREE.MeshBasicMaterial({
      color: 0x67e8f9
    });

    const white = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      metalness: 0.4,
      roughness: 0.3
    });

    function sphere(parent, material, x, y, z, sx, sy, sz) {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(1, 32, 24),
        material
      );

      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      parent.add(mesh);
      return mesh;
    }

    function cylinder(parent, material, x, y, z, top, bottom, length) {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(top, bottom, length, 20),
        material
      );

      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    }

    // Torso
    sphere(
      robotObject, blue,
      0, -0.65, 0,
      0.58, 0.68, 0.38
    );

    // Chest display
    sphere(
      robotObject, dark,
      0, -0.58, 0.36,
      0.34, 0.25, 0.08
    );

    sphere(
      robotObject, glow,
      0, -0.58, 0.445,
      0.12, 0.08, 0.025
    );

    // Neck
    cylinder(
      robotObject, dark,
      0, 0.05, 0,
      0.13, 0.13, 0.2
    );

    // Head
    robotHead = new THREE.Group();
    robotHead.position.set(0, 0.65, 0);
    robotObject.add(robotHead);

    sphere(
      robotHead, blue,
      0, 0, 0,
      0.73, 0.59, 0.53
    );

    // Face screen
    sphere(
      robotHead, dark,
      0, -0.02, 0.43,
      0.62, 0.39, 0.17
    );

    // Eye sockets
    sphere(
      robotHead, white,
      -0.23, 0.04, 0.57,
      0.14, 0.16, 0.045
    );

    sphere(
      robotHead, white,
      0.23, 0.04, 0.57,
      0.14, 0.16, 0.045
    );

    // Glowing eyes
    const leftEye = sphere(
      robotHead, glow,
      -0.23, 0.04, 0.61,
      0.085, 0.105, 0.04
    );

    const rightEye = sphere(
      robotHead, glow,
      0.23, 0.04, 0.61,
      0.085, 0.105, 0.04
    );

    robotEyes = [leftEye, rightEye];

    // Mouth
    robotMouth = sphere(
      robotHead, glow,
      0, -0.23, 0.61,
      0.15, 0.025, 0.035
    );

    // Antenna
    cylinder(
      robotHead, blue,
      0, 0.67, 0,
      0.025, 0.025, 0.23
    );

    sphere(
      robotHead, glow,
      0, 0.8, 0,
      0.09, 0.09, 0.09
    );

    // Shoulders and arms
    robotArms = [];

    [-1, 1].forEach(side => {
      const arm = new THREE.Group();
      arm.position.set(side * 0.55, -0.38, 0);
      robotObject.add(arm);

      sphere(
        arm, dark,
        0, -0.06, 0,
        0.19, 0.19, 0.19
      );

      cylinder(
        arm, blue,
        side * 0.05, -0.27, 0,
        0.13, 0.15, 0.35
      );

      sphere(
        arm, white,
        side * 0.05, -0.48, 0,
        0.16, 0.15, 0.16
      );

      robotArms.push(arm);
    });

    // Legs and feet
    [-1, 1].forEach(side => {
      cylinder(
        robotObject, dark,
        side * 0.25, -1.22, 0,
        0.16, 0.19, 0.42
      );

      sphere(
        robotObject, blue,
        side * 0.25, -1.48, 0.12,
        0.23, 0.12, 0.32
      );
    });

    robotInitialized = true;

    // Keep the canvas fitted to the stage.
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(resizeRobot);
      observer.observe(stage);
    }

    window.addEventListener("resize", resizeRobot);

    function animate() {
      requestAnimationFrame(animate);

      robotFrame += 0.025;

      // Floating body movement
      robotObject.position.y =
        Math.sin(robotFrame * 1.5) * 0.055;

      robotObject.rotation.y =
        Math.sin(robotFrame * 0.6) * 0.12;

      // Head movement
      robotHead.rotation.z =
        Math.sin(robotFrame) * 0.025;

      robotHead.rotation.y =
        Math.sin(robotFrame * 0.7) * 0.04;

      // Friendly arm movement
      robotArms[0].rotation.z =
        Math.sin(robotFrame * 1.5) * 0.10;

      robotArms[1].rotation.z =
        -Math.sin(robotFrame * 1.5) * 0.10;

      // Blinking eyes
      const now = Date.now();

      if (!blinking && now - lastBlink > 3500) {
        blinking = true;
        blinkTime = now;
        lastBlink = now;
      }

      if (blinking) {
        const elapsed = now - blinkTime;
        const blinkScale = elapsed < 130 ? 0.12 : 1;

        robotEyes.forEach(eye => {
          eye.scale.y = 0.105 * blinkScale;
        });

        if (elapsed > 180) {
          blinking = false;
          robotEyes.forEach(eye => {
            eye.scale.y = 0.105;
          });
        }
      }

      // Mouth animation while ZENO speaks
      const isSpeaking =
        window.speechSynthesis &&
        window.speechSynthesis.speaking;

      robotMouth.scale.y = isSpeaking
        ? 0.025 + Math.abs(Math.sin(robotFrame * 10)) * 0.11
        : 0.025;

      robotRenderer.render(robotScene, robotCamera);
    }

    animate();
  }

  // Load robot voices when the browser provides them.
  if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }

})();
