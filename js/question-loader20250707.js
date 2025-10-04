/**
 * question-loader.js
 * 自动加载题目卡片，支持题干和选项中包含 <pre><code>...</code></pre> 原始结构。
 * 可渲染高亮代码、MathJax 公式和结构体语法。
 */

async function loadQuestions(containerId, level, knowledgePoint) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  const fileName = encodeURIComponent(knowledgePoint) + ".json";
  const dataUrl = `data/${level}/${fileName}`;

  try {
    const response = await fetch(dataUrl);
    if (!response.ok) throw new Error(`无法加载题目数据：HTTP ${response.status}`);

    const questionList = await response.json();
    if (!Array.isArray(questionList) || questionList.length === 0) {
      showPlaceholder(container, "当前知识点暂无题目");
      return;
    }

    questionList.forEach(q => {
      const card = createQuestionCard(q);
      container.appendChild(card);
    });

    if (window.hljs) {
      document.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
      });
    }

    if (window.MathJax && window.MathJax.typesetPromise) {
      setTimeout(() => {
        window.MathJax.typesetPromise().catch(err => console.error('MathJax渲染失败:', err));
      }, 100);
    }

  } catch (err) {
    console.error(err);
    showPlaceholder(container, "加载题目失败，请稍后重试");
  }
}

function createQuestionCard(q) {
  const card = document.createElement("div");
  card.classList.add("question-card");
  card.id = q.id;

  const h4 = document.createElement("h4");
  const codeMatch = q.question.match(/<pre>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/i);
  const questionText = q.question.replace(/<pre>[\s\S]*?<\/pre>/i, "").trim();
  h4.innerHTML = `${q.id}. ${decodeHtml(questionText)}`;
  card.appendChild(h4);

  if (q.image) {
    const img = document.createElement("img");
    img.src = q.image;
    img.classList.add("question-image");
    card.appendChild(img);
  }

  if (codeMatch) {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.className = "language-cpp";
    code.textContent = decodeHtml(codeMatch[1]);
    pre.appendChild(code);
    card.appendChild(pre);
  }

  if (q.type === "single") {
    const ul = document.createElement("ul");
    ul.classList.add("options");
    q.options.forEach(optionText => {
      const li = document.createElement("li");
      li.dataset.option = optionText.trim().charAt(0);

      const codeMatch = optionText.match(/<pre>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/i);
      if (codeMatch) {
        const prefixText = optionText.replace(/<pre>[\s\S]*?<\/pre>/i, "").trim();
        li.innerHTML = `${prefixText}<br/>`;
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.className = "language-cpp";
        code.textContent = decodeHtml(codeMatch[1]);
        pre.appendChild(code);
        li.appendChild(pre);
        if (window.hljs) hljs.highlightElement(code);
      } else {
        li.innerHTML = optionText;
      }

      li.addEventListener("click", () => {
        handleSingleSelection(card, li, q.correct, q.explanation, q.source);
      });
      ul.appendChild(li);
    });
    card.appendChild(ul);
  }

  else if (q.type === "truefalse") {
    const ul = document.createElement("ul");
    ul.classList.add("options");
    ["A. 对", "B. 错"].forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      li.dataset.option = item.trim().charAt(0) === "A" ? "true" : "false";
      li.addEventListener("click", () => {
        handleTrueFalseSelection(card, li, q.correct, q.explanation, q.source);
      });
      ul.appendChild(li);
    });
    card.appendChild(ul);
  }

  const explanationDiv = document.createElement("div");
  explanationDiv.classList.add("explanation");
  explanationDiv.innerHTML = `
    <p><strong>正确答案：</strong><span class="answer-text"></span></p>
    <p><strong>解析：</strong><span class="explanation-text"></span></p>
    <p class="source"><strong>出处：</strong> ${q.source}</p>
  `;
  explanationDiv.style.display = "none";
  card.appendChild(explanationDiv);

  return card;
}

function handleSingleSelection(card, li, correct, explanation, source) {
  const optionsList = li.closest('.options');
  optionsList.querySelectorAll('li').forEach(opt => opt.classList.remove("selected"));
  optionsList.style.pointerEvents = 'none';
  li.classList.add("selected");

  const explanationDiv = card.querySelector(".explanation");
  explanationDiv.style.display = "block";
  explanationDiv.querySelector(".answer-text").textContent = correct;
  explanationDiv.querySelector(".explanation-text").innerHTML = decodeHtml(explanation);

  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([explanationDiv.querySelector(".explanation-text")])
      .catch(err => console.error("MathJax局部渲染失败:", err));
  }

  if (li.dataset.option !== correct) {
    li.style.backgroundColor = "#f8d7da";
    li.style.borderColor = "#f5c6cb";
  }
}

function handleTrueFalseSelection(card, li, correctRaw, explanation, source) {
  const optionsList = li.closest('.options');
  optionsList.querySelectorAll('li').forEach(opt => opt.classList.remove("selected"));
  optionsList.style.pointerEvents = 'none';
  li.classList.add("selected");

  const correct = normalizeTrueFalse(correctRaw);
  const explanationDiv = card.querySelector(".explanation");
  explanationDiv.style.display = "block";
  explanationDiv.querySelector(".answer-text").textContent = correct === "true" ? "对" : "错";
  explanationDiv.querySelector(".explanation-text").innerHTML = decodeHtml(explanation);

  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([explanationDiv.querySelector(".explanation-text")])
      .catch(err => console.error("MathJax局部渲染失败:", err));
  }

  if (li.dataset.option !== correct) {
    li.style.backgroundColor = "#f8d7da";
    li.style.borderColor = "#f5c6cb";
  }
}

function normalizeTrueFalse(val) {
  const v = val.toString().trim();
  if (["true", "对", "√"].includes(v)) return "true";
  if (["false", "错", "×"].includes(v)) return "false";
  return "false";
}

function showPlaceholder(container, message) {
  const div = document.createElement("div");
  div.classList.add("placeholder");
  div.textContent = message;
  container.appendChild(div);
}

function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

// 导出函数
window.loadQuestions = loadQuestions;
window.getKnowledgePoints = async function(level) {
  const indexUrl = `data/${level}/index.json`;
  try {
    const response = await fetch(indexUrl);
    if (!response.ok) throw new Error();
    const list = await response.json();
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};
