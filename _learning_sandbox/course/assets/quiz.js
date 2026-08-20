/* ==========================================================================
   quiz.js — reusable retrieval-practice widget for the pysystemtrade course.

   Usage in a lesson (self-contained, no build step):
     <div class="quiz" data-quiz='[
        {"q":"question text",
         "options":["answer a","answer b","answer c"],
         "correct":0,
         "why":"one-line explanation shown after answering"} ]'></div>
     <script src="../assets/quiz.js"></script>

   Design notes:
   - Retrieval practice > re-reading. Answers are deliberately close in length
     so formatting gives no clue (see the teach skill's quiz rule).
   - Immediate feedback: the tightest possible loop.
   ========================================================================== */

(function () {
  const style = document.createElement("style");
  style.textContent = `
    .quiz { border:1px solid var(--rule,#e2e0d8); border-radius:6px;
            padding:1.1rem 1.2rem; margin:1.8rem 0; background:#fbfaf6;
            font-family:-apple-system,system-ui,sans-serif; }
    .quiz .q { font-weight:600; margin:0 0 .7rem; font-size:.98rem;
               color:var(--ink,#1a1a1a); }
    .quiz .qnum { font-size:.7rem; letter-spacing:.12em; text-transform:uppercase;
                  color:var(--accent,#7a1705); font-weight:700; display:block;
                  margin-bottom:.3rem; }
    .quiz button.opt { display:block; width:100%; text-align:left;
        font:inherit; font-size:.92rem; padding:.55rem .8rem; margin:.35rem 0;
        border:1px solid var(--rule,#e2e0d8); border-radius:4px; background:#fff;
        cursor:pointer; transition:background .12s,border-color .12s; }
    .quiz button.opt:hover:not(:disabled) { border-color:#14507a; background:#f4f8fb; }
    .quiz button.opt:disabled { cursor:default; }
    .quiz button.opt.correct { background:#e6f4ea; border-color:#1c6b3c; color:#14532d; }
    .quiz button.opt.wrong   { background:#fbeae7; border-color:#9a2417; color:#7a1705; }
    .quiz .why { font-size:.88rem; margin:.7rem 0 0; padding:.6rem .8rem;
        background:#f4f2ec; border-radius:4px; color:#444; display:none; }
    .quiz .why.show { display:block; }
    .quiz .score { font-size:.85rem; color:#555; margin-top:1rem;
        padding-top:.7rem; border-top:1px solid var(--rule,#e2e0d8); }
  `;
  document.head.appendChild(style);

  document.querySelectorAll(".quiz").forEach((root, qi) => {
    let items;
    try { items = JSON.parse(root.getAttribute("data-quiz")); }
    catch (e) { root.textContent = "Quiz failed to load."; return; }

    let answered = 0, correct = 0;
    root.innerHTML = "";
    const score = document.createElement("div");
    score.className = "score";
    score.textContent = `0 / ${items.length} answered`;

    items.forEach((item, i) => {
      const block = document.createElement("div");
      block.style.marginBottom = "1.1rem";
      const q = document.createElement("p");
      q.className = "q";
      q.innerHTML = `<span class="qnum">Question ${i + 1}</span>${item.q}`;
      block.appendChild(q);

      const why = document.createElement("p");
      why.className = "why";
      why.textContent = item.why || "";

      item.options.forEach((opt, oi) => {
        const btn = document.createElement("button");
        btn.className = "opt";
        btn.textContent = opt;
        btn.addEventListener("click", () => {
          if (block.dataset.done) return;
          block.dataset.done = "1";
          answered++;
          const isRight = oi === item.correct;
          if (isRight) correct++;
          btn.classList.add(isRight ? "correct" : "wrong");
          if (!isRight) {
            block.querySelectorAll("button.opt")[item.correct]
                 .classList.add("correct");
          }
          block.querySelectorAll("button.opt").forEach(b => (b.disabled = true));
          why.classList.add("show");
          score.textContent =
            `${answered} / ${items.length} answered — ${correct} correct`;
        });
        block.appendChild(btn);
      });
      block.appendChild(why);
      root.appendChild(block);
    });
    root.appendChild(score);
  });
})();
