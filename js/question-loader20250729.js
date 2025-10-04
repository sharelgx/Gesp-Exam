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
  const dataUrl = `data/${level}/${fileName}`;

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

    // ✅ 启用 highlight.js 代码高亮（如已引入）
    if (window.hljs) {
      document.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
      });
    }
    
    // ✅ 触发 MathJax 重新渲染（添加延迟确保DOM更新完成）
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
  const indexUrl = `data/${level}/index.json`;
  try {
    const response = await fetch(indexUrl);
    if (!response.ok) {
      throw new Error(`无法加载知识点列表：HTTP ${response.status}`);
    }
    const kpList = await response.json();
    if (Array.isArray(kpList)) {
      return kpList;
    } else {
      return [];
    }
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

  // ✅ 提取 <pre><code>...</code></pre> 代码内容
  const codeMatch = q.question.match(/<pre>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/i);
  const questionText = q.question.replace(/<pre>[\s\S]*?<\/pre>/i, "").trim(); // 去除 <pre><code>

  h4.innerHTML = `${q.id}. ${decodeHtml(questionText)}`;
  card.appendChild(h4);

  // 处理题目图片
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

  // === 程序阅读题渲染 ===
  if (q.type === "reading") {
    // 渲染主程序代码
    if (q.code) {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.className = "language-cpp";
      code.textContent = q.code;
      pre.appendChild(code);
      card.appendChild(pre);
    }

    // 渲染子题目
    q.sub_questions.forEach((subq, index) => {
      const subQuestionDiv = document.createElement("div");
      subQuestionDiv.className = "sub-question";
      subQuestionDiv.innerHTML = `<h5>${q.id}.${index+1} ${subq.question}</h5>`;
      card.appendChild(subQuestionDiv);

      // 渲染子题选项
      const ul = document.createElement("ul");
      ul.classList.add("options");
      
      if (subq.type === "truefalse") {
        ["A. 对", "B. 错"].forEach(item => {
          const li = document.createElement("li");
          li.textContent = item;
          li.dataset.option = item.trim().charAt(0) === "A" ? "true" : "false";
          li.dataset.subid = index;
          li.addEventListener("click", () => {
            handleTrueFalseSelection(card, li, subq.correct, subq.explanation, q.source, index);
          });
          ul.appendChild(li);
        });
      } else {
        subq.options.forEach(optionText => {
          const li = document.createElement("li");
          li.textContent = optionText;
          li.dataset.option = optionText.trim().charAt(0);
          li.dataset.subid = index;
          li.addEventListener("click", () => {
            handleSingleSelection(card, li, subq.correct, subq.explanation, q.source, index);
          });
          ul.appendChild(li);
        });
      }
      subQuestionDiv.appendChild(ul);

      // 子题解析区域
      const subExplanation = document.createElement("div");
      subExplanation.className = `sub-explanation sub-${index}`;
      subExplanation.style.display = "none";
      subExplanation.innerHTML = `
        <p><strong>正确答案：</strong><span class="answer-text"></span></p>
        <p><strong>解析：</strong><span class="explanation-text"></span></p>
      `;
      subQuestionDiv.appendChild(subExplanation);
    });
  }
  // === 编程题渲染 ===
  else if (q.type === "programming") {
    const inputDiv = createElement("div", { className: "input-output" });
    inputDiv.innerHTML = `<p><strong>输入格式：</strong>${q.input}</p>`;
    card.appendChild(inputDiv);

    const outputDiv = createElement("div", { className: "input-output" });
    outputDiv.innerHTML = `<p><strong>输出格式：</strong>${q.output}</p>`;
    card.appendChild(outputDiv);

    const sampleInputDiv = createElement("div", { className: "input-output" });
    sampleInputDiv.innerHTML = `<p><strong>样例输入：</strong></p>`;
    const inputPre = document.createElement("pre");
    const inputCode = document.createElement("code");
    inputCode.className = "language-plaintext";
    inputCode.textContent = decodeHtml(q.sample_input);
    inputPre.appendChild(inputCode);
    sampleInputDiv.appendChild(inputPre);
    card.appendChild(sampleInputDiv);

    const sampleOutputDiv = createElement("div", { className: "input-output" });
    sampleOutputDiv.innerHTML = `<p><strong>样例输出：</strong></p>`;
    const outputPre = document.createElement("pre");
    const outputCode = document.createElement("code");
    outputCode.className = "language-plaintext";
    outputCode.textContent = decodeHtml(q.sample_output);
    outputPre.appendChild(outputCode);
    sampleOutputDiv.appendChild(outputPre);
    card.appendChild(sampleOutputDiv);

    // 渲染编程题的选项
    if (q.options) {
      const ul = document.createElement("ul");
      ul.classList.add("options");
      q.options.forEach(optionText => {
        const li = document.createElement("li");
        li.textContent = optionText;
        li.dataset.option = optionText.trim().charAt(0);
        li.addEventListener("click", () => {
          handleSingleSelection(card, li, q.correct, q.explanation, q.source);
        });
        ul.appendChild(li);
      });
      card.appendChild(ul);
    }
  } 
  // === 选择题渲染 ===
  else if (q.type === "single") {
    const ul = document.createElement("ul");
    ul.classList.add("options");
    q.options.forEach(optionText => {
      const li = document.createElement("li");
      li.innerHTML = optionText;
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

  // 这里改成 innerHTML 让 HTML 标签生效
  explanationDiv.querySelector(".explanation-text").innerHTML = decodeHtml(explanation);

       // === 新增代码：局部MathJax渲染 ===
       if (window.MathJax && window.MathJax.typesetPromise) {
         const targetElement = explanationDiv.querySelector(".explanation-text");
         if (targetElement) {
           window.MathJax.typesetPromise([targetElement]).catch(err => {
             console.error('MathJax局部渲染失败:', err);
           });
         }
       }
       // =================================

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

  // 这里改成 innerHTML 让 HTML 标签生效
  explanationDiv.querySelector(".explanation-text").innerHTML = decodeHtml(explanation);

  // === 新增代码：局部MathJax渲染 ===
  if (window.MathJax && window.MathJax.typesetPromise) {
    const targetElement = explanationDiv.querySelector(".explanation-text");
    if (targetElement) {
      window.MathJax.typesetPromise([targetElement]).catch(err => {
        console.error('MathJax局部渲染失败:', err);
      });
    }
  }
  // =================================

  if (userSelection !== normalizedCorrect) {
    li.style.backgroundColor = "#f8d7da";
    li.style.borderColor = "#f5c6cb";
  }
}

function normalizeTrueFalse(value) {
  const v = value.toString().trim();
  if (["true", "对", "√"].includes(v)) {
    return "true";
  } else if (["false", "错", "×"].includes(v)) {
    return "false";
  } else {
    console.warn("无法识别的判断题答案标记：", value);
    return "false";
  }
}

// 全局暴露
window.loadQuestions = loadQuestions;
window.getKnowledgePoints = getKnowledgePoints;

function decodeHtml(html) {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}
