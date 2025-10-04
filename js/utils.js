/**
 * 清空某个节点的所有子节点
 * @param {HTMLElement} parentNode
 */
function clearElement(parentNode) {
  while (parentNode.firstChild) {
    parentNode.removeChild(parentNode.firstChild);
  }
}

/**
 * 创建一个带有可选 className、textContent 的元素
 * @param {string} tagName
 * @param {Object} options
 *    - className: 可选的字符串或字符串数组
 *    - textContent: 可选的文本内容
 * @returns {HTMLElement}
 */
function createElement(tagName, options = {}) {
  const el = document.createElement(tagName);
  if (options.className) {
    if (Array.isArray(options.className)) {
      options.className.forEach(cls => el.classList.add(cls));
    } else {
      el.classList.add(options.className);
    }
  }
  if (options.textContent) {
    el.textContent = options.textContent;
  }
  return el;
}

// 挂载到全局
window.clearElement = clearElement;
window.createElement = createElement;