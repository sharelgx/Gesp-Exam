document.addEventListener("DOMContentLoaded", async () => {
  const levelButtons = document.querySelectorAll(".level-btn");
  const knowledgeList = document.getElementById("knowledge-list");
  const rightPanelId = "right-panel";

  let currentLevel = "level1";
  let currentKnowledge = null;

  await loadAndRenderKnowledgePoints(currentLevel);

  levelButtons.forEach(btn => {
    btn.addEventListener("click", async () => {
      const clickedLevel = btn.dataset.level;
      if (clickedLevel === currentLevel) return;

      document.querySelector(".level-btn.active").classList.remove("active");
      btn.classList.add("active");

      currentLevel = clickedLevel;
      await loadAndRenderKnowledgePoints(currentLevel);
    });
  });

  async function loadAndRenderKnowledgePoints(level) {
    clearElement(knowledgeList);

    const kpArray = await window.getKnowledgePoints(level);
    if (!kpArray || kpArray.length === 0) {
      const li = createElement("li", { textContent: "该级别暂无知识点" });
      knowledgeList.appendChild(li);
      const right = document.getElementById(rightPanelId);
      clearElement(right);
      const div = createElement("div", { className: "placeholder", textContent: "暂无题目" });
      right.appendChild(div);
      currentKnowledge = null;
      return;
    }

    kpArray.forEach((kp, idx) => {
      const li = createElement("li", { textContent: kp });
      li.dataset.knowledge = kp;
      li.classList.add("knowledge-item");
      if (idx === 0) {
        li.classList.add("active");
        currentKnowledge = kp;
      }
      knowledgeList.appendChild(li);

      li.addEventListener("click", async () => {
        if (li.dataset.knowledge === currentKnowledge) return;
        const prev = knowledgeList.querySelector(".active");
        if (prev) prev.classList.remove("active");
        li.classList.add("active");

        currentKnowledge = kp;
        await window.loadQuestions(rightPanelId, currentLevel, currentKnowledge);
      });
    });

    if (currentKnowledge) {
      await window.loadQuestions(rightPanelId, currentLevel, currentKnowledge);
    }
  }
});