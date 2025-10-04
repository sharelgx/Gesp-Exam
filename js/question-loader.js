/**
 * question-loader.js
 * 自动加载题目卡片，支持题干中包含 <pre><code>...</code></pre> 原始结构。
 * 会自动识别、提取并渲染代码部分，避免原样输出 <pre> 标签。
 */

async function loadQuestions(containerId, level, knowledgePoint) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  const fileName = encodeURIComponent(knowledgePoint) + ".json";
  const dataUrl = `/data/${level}/${fileName}`;

  try {
    const response = await fetch(dataUrl);
    if (!response.ok) {
      throw new Error(`无法加载题目数据：HTTP ${response.status}`);
    }
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
      setTimeout(async () => {
        try {
          await window.MathJax.typesetPromise();
        } catch (err) {
          console.error('MathJax渲染失败:', err);
        }
      }, 100);
    } else {
      console.warn('MathJax未加载，无法渲染公式');
    }

  } catch (err) {
    console.error(err);
    showPlaceholder(container, "加载题目失败，请稍后重试");
  }
}

async function getKnowledgePoints(level) {
  const indexUrl = `/data/${level}/index.json`;
  try {
    const response = await fetch(indexUrl);
    if (!response.ok) {
      throw new Error(`无法加载知识点列表：HTTP ${response.status}`);
    }
    const kpList = await response.json();
    return Array.isArray(kpList) ? kpList : [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

function showPlaceholder(container, message) {
  const div = document.createElement("div");
  div.classList.add("placeholder");
  div.textContent = message;
  container.appendChild(div);
}

function createQuestionCard(q) {
  const card = document.createElement("div");
  card.classList.add("question-card");
  card.id = q.id;

  const h4 = document.createElement("h4");

  // ✅ 修复：保留 < 被吞问题，优先匹配 <pre> 块并分离
  const codeMatch = q.question.match(/<pre>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/i);
  let questionText = q.question;
  let postPreText = '';

  if (codeMatch) {
    const preStartIndex = q.question.indexOf(codeMatch[0]);
    const preEndIndex = preStartIndex + codeMatch[0].length;
    questionText = q.question.slice(0, preStartIndex);
    postPreText = q.question.slice(preEndIndex);
  }

  // 显示题目文本（包含问题描述）
  h4.textContent = `${q.id}. ${questionText.trim()}`;
  card.appendChild(h4);

  // 添加<pre>标签后的文本
  if (postPreText.trim()) {
    const postPreDiv = document.createElement('div');
    postPreDiv.innerHTML = decodeHtml(postPreText.trim());
    card.appendChild(postPreDiv);
  }

  if (q.image) {
    const img = document.createElement('img');
    img.src = q.image;
    img.classList.add('question-image');
    img.alt = '题目图片';
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
      
      // 检查选项是否包含代码块
      const optionCodeMatch = optionText.match(/<pre>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/i);
      
      if (optionCodeMatch) {
        // 提取选项前缀（如 "A. "）
        const prefix = optionText.substring(0, optionText.indexOf('<pre>'));
        li.textContent = prefix;
        
        // 创建代码块
        const pre = document.createElement("pre");
        const code = document.createElement("code");
        code.className = "language-cpp";
        code.textContent = decodeHtml(optionCodeMatch[1]);
        pre.appendChild(code);
        li.appendChild(pre);
      } else {
        li.textContent = optionText;
      }
      
      li.dataset.option = optionText.trim().charAt(0);
      li.addEventListener("click", () => {
        handleSingleSelection(card, li, q.correct, q.explanation, q.source);
      });
      ul.appendChild(li);
    });
    card.appendChild(ul);
  } else if (q.type === "truefalse") {
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

function handleSingleSelection(card, li, correct, explanation, source, subid) {
  const optionsList = li.closest('.options');
  const options = optionsList.querySelectorAll('li');
  options.forEach(opt => opt.classList.remove("selected"));
  optionsList.style.pointerEvents = 'none';
  li.classList.add("selected");

  const explanationDiv = subid !== undefined ? card.querySelector(`.sub-explanation.sub-${subid}`) : card.querySelector(".explanation");
  explanationDiv.style.display = "block";
  explanationDiv.querySelector(".answer-text").textContent = correct;
  explanationDiv.querySelector(".explanation-text").innerHTML = decodeHtml(explanation);

  if (window.MathJax && window.MathJax.typesetPromise) {
    const targetElement = explanationDiv.querySelector(".explanation-text");
    if (targetElement) {
      window.MathJax.typesetPromise([targetElement]).catch(err => {
        console.error('MathJax局部渲染失败:', err);
      });
    }
  }

  if (li.dataset.option !== correct) {
    li.style.backgroundColor = "#f8d7da";
    li.style.borderColor = "#f5c6cb";
  }
}

function handleTrueFalseSelection(card, li, correctRaw, explanation, source, subid) {
  const optionsList = li.closest('.options');
  const options = optionsList.querySelectorAll('li');
  options.forEach(opt => opt.classList.remove("selected"));
  optionsList.style.pointerEvents = 'none';
  li.classList.add("selected");

  const normalizedCorrect = normalizeTrueFalse(correctRaw);
  const userSelection = li.dataset.option;

  const explanationDiv = subid !== undefined ? card.querySelector(`.sub-explanation.sub-${subid}`) : card.querySelector(".explanation");
  explanationDiv.style.display = "block";
  explanationDiv.querySelector(".answer-text").textContent = (normalizedCorrect === "true" ? "对" : "错");
  explanationDiv.querySelector(".explanation-text").innerHTML = decodeHtml(explanation);

  if (window.MathJax && window.MathJax.typesetPromise) {
    const targetElement = explanationDiv.querySelector(".explanation-text");
    if (targetElement) {
      window.MathJax.typesetPromise([targetElement]).catch(err => {
        console.error('MathJax局部渲染失败:', err);
      });
    }
  }

  if (userSelection !== normalizedCorrect) {
    li.style.backgroundColor = "#f8d7da";
    li.style.borderColor = "#f5c6cb";
  }
}

function normalizeTrueFalse(value) {
  const v = value.toString().trim();
  if (["true", "对", "√"].includes(v)) return "true";
  if (["false", "错", "×"].includes(v)) return "false";
  return "false";
}

function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

window.loadQuestions = loadQuestions;
window.getKnowledgePoints = getKnowledgePoints;
