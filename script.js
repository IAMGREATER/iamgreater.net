/* ==========================================================================
   IAMGREATER.net — CLIENT INTERACTIVITY & VIBE SHELL
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Current Year
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 2. Mobile Nav Toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });

    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => navLinks.classList.remove('open'));
    });
  }

  // 3. Project Filter Logic
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // 4. Interactive Terminal Shell
  const terminalInput = document.getElementById('terminalInput');
  const terminalHistory = document.getElementById('terminalHistory');
  const terminalBody = document.getElementById('terminalBody');
  const quickCmds = document.querySelectorAll('.quick-cmd');

  const ideasList = [
    "Build a real-time voice-to-code agent that streams AST modifications directly into Neovim.",
    "A self-hosted ambient Lo-Fi radio generator running on ComfyUI and local GPU audio models.",
    "A local Git bot that conducts automated adversarial security audits on every push to ZimaOS.",
    "A dyslexia-optimised markdown reader with automated syllable stress coloring and speed pacing.",
    "An autonomous RSS curator that synthesizes daily machine learning papers into 30-second audio briefs."
  ];

  function handleCommand(cmdRaw) {
    const cmd = cmdRaw.trim().toLowerCase();
    if (!cmd) return;

    // Echo input
    const inputEcho = document.createElement('div');
    inputEcho.className = 'terminal-line';
    inputEcho.innerHTML = `<span class="prompt-symbol">iamgreater❯</span> ${escapeHtml(cmdRaw)}`;
    terminalHistory.appendChild(inputEcho);

    let outputHtml = '';

    switch (cmd) {
      case 'help':
        outputHtml = `
          <div class="system-msg">Available commands:</div>
          <div>• <span style="color:var(--accent-cyan)">projects</span>   : list active vibe-coded projects (QuickDraw Launcher, etc.)</div>
          <div>• <span style="color:var(--accent-cyan)">origin</span>     : the 1996 Turbo Pascal to 2026 journey</div>
          <div>• <span style="color:var(--accent-cyan)">manifesto</span>  : our philosophy of vibe coding & craft</div>
          <div>• <span style="color:var(--accent-cyan)">stack</span>      : inspect hardware & agentic tools</div>
          <div>• <span style="color:var(--accent-cyan)">spark</span>      : generate a novel vibe-coding concept</div>
          <div>• <span style="color:var(--accent-cyan)">vibe</span>       : run system diagnostic & vibe check</div>
          <div>• <span style="color:var(--accent-cyan)">clear</span>      : wipe the terminal screen</div>
        `;
        break;

      case 'projects':
        outputHtml = `
          <div><strong style="color:var(--accent-cyan)">1. QuickDraw Launcher:</strong> Lightning gesture app launcher for Android (Kotlin Compose).</div>
          <div><strong style="color:var(--accent-cyan)">2. Omarchy Tools:</strong> Sovereign Arch Linux & Hyprland desktop orchestration.</div>
          <div><strong style="color:var(--accent-cyan)">3. Local Agent Swarm:</strong> Qwen 14B on GPU + cloud architect pair.</div>
          <div><strong style="color:var(--accent-cyan)">4. Neural Sound Lab:</strong> ComfyUI generative music synthesis & Lo-Fi.</div>
          <div><strong style="color:var(--accent-cyan)">5. Sterling English:</strong> Academic & clinical communication portal.</div>
          <div><strong style="color:var(--accent-cyan)">6. ZimaOS Cloud:</strong> Sovereign edge container homelab.</div>
        `;
        break;

      case 'quickdraw':
      case 'swiftopen':
        outputHtml = `
          <div style="color:var(--accent-cyan); font-weight:600;">[QUICKDRAW LAUNCHER]</div>
          <div>Lightning-fast edge gesture launcher for Android.</div>
          <div>Package: <span style="color:#38bdf8;">apps.ipsofacto.swiftopen.modern</span></div>
          <div>Status: Staged for Google Play (Target SDK 35 / Android 15)</div>
          <div>Privacy: 100% Offline, Zero Internet Permission, Zero Battery Drain.</div>
          <div style="margin-top:6px;"><a href="quickdraw.html" style="color:#38bdf8; text-decoration:underline;">Open Interactive Showcase & Simulator ➔</a></div>
        `;
        break;

      case 'origin':
      case 'turbo':
      case 'pascal':
      case 'journey':
        outputHtml = `
          <div style="color:var(--accent-cyan)">[ORIGIN STORY: 1996 ➔ 2026]</div>
          <div style="color:#fbbf24; font-family:var(--font-mono); margin: 6px 0;">
            PROGRAM OriginStory;<br>
            USES Crt, Dos;<br>
            BEGIN<br>
            &nbsp;&nbsp;Writeln('1996-1998 : Borland Turbo Pascal ➔ Built CD collection database');<br>
            &nbsp;&nbsp;Writeln('1998-2000 : Java @ Uni ➔ OOP fundamentals & Swing applets');<br>
            &nbsp;&nbsp;Writeln('2008-2020 : XDA Custom ROMs, Kubuntu X11 & EasyStroke gestures');<br>
            &nbsp;&nbsp;Writeln('2024-2026 : Vibe Coding ➔ QuickDraw Android, Sovereign Linux & AI Swarms');<br>
            END.
          </div>
          <div>From text-mode CRT screens to XDA custom ROMs and EasyStroke gestures, leading directly to QuickDraw Launcher and sovereign AI swarms today.</div>
        `;
        break;

      case 'easystroke':
      case 'gestures':
        outputHtml = `
          <div style="color:var(--accent-cyan)">[EASYSTROKE & GESTURE LINEAGE]</div>
          <div>EasyStroke on Kubuntu X11 was the ultimate desktop superpower—triggering actions through muscle memory gestures.</div>
          <div>That exact philosophy is reborn in <strong style="color:var(--accent-emerald)">QuickDraw Launcher</strong>: bringing frictionless, edge-glide gesture access to Android without bloat or telemetry.</div>
        `;
        break;

      case 'xda':
      case 'roms':
        outputHtml = `
          <div style="color:var(--accent-cyan)">[THE XDA ERA & SOVEREIGN ANDROID]</div>
          <div>Unlocked bootloaders, flashing custom ROMs, de-bloating proprietary stock OSs, and reclaiming hardware sovereignty.</div>
          <div>That root ethos guides IAMGREATER: apps that respect user autonomy, work 100% offline, and require zero invasive permissions.</div>
        `;
        break;

      case 'manifesto':
        outputHtml = `
          <div style="color:var(--accent-violet)">[IAMGREATER MANIFESTO]</div>
          <div>1. Flow is paramount. Eliminate every layer of friction between thought and working code.</div>
          <div>2. Own your compute & hardware. Sovereign Linux, open weights, and zero-telemetry Android.</div>
          <div>3. Build for an open web and real human utility—ethical, sustainable, and blisteringly fast.</div>
        `;
        break;

      case 'stack':
        outputHtml = `
          <div><strong>Host:</strong> DarkNight (Arch Linux x86_64, Hyprland Wayland)</div>
          <div><strong>Local AI:</strong> Qwen 2.5 Coder 14B (:8090) / Ollama / Tier-2 Nemotron</div>
          <div><strong>Agent Harness:</strong> Antigravity (AGY) 2.0</div>
          <div><strong>Storage/Edge:</strong> ZimaOS @ 192.168.1.141 / NVMe 469GB / Nextcloud E2EE</div>
        `;
        break;

      case 'spark':
      case 'spark-idea':
        const randomIdea = ideasList[Math.floor(Math.random() * ideasList.length)];
        outputHtml = `
          <div style="color:var(--accent-emerald)">✨ [VIBE SPARK]</div>
          <div>${randomIdea}</div>
        `;
        break;

      case 'vibe':
        outputHtml = `
          <div>[VIBE STATUS] 🟢 100% OPERATIONAL</div>
          <div>Latency: 0.02ms | Focus: Maximum | Agents: Active</div>
        `;
        break;

      case 'clear':
        terminalHistory.innerHTML = '';
        return;

      default:
        outputHtml = `<div style="color:#f87171">Command not found: "${escapeHtml(cmdRaw)}". Type 'help' for options.</div>`;
        break;
    }

    const outputEl = document.createElement('div');
    outputEl.className = 'terminal-line';
    outputEl.innerHTML = outputHtml;
    terminalHistory.appendChild(outputEl);

    // Scroll to bottom
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  if (terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = terminalInput.value;
        terminalInput.value = '';
        handleCommand(val);
      }
    });
  }

  quickCmds.forEach(btn => {
    btn.addEventListener('click', () => {
      const cmd = btn.getAttribute('data-cmd');
      handleCommand(cmd);
    });
  });
});
