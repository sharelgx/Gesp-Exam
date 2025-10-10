# GESP-Exam 在线做题平台

GESP-Exam是一个专注于GESP（全国青少年等级考试）编程等级考试的在线做题平台，提供从一级到八级的题库资源以及CSP-J/CSP-S信息学奥赛题目练习。

## 项目简介

本项目由元探索柳老师团队开发，旨在为少儿编程教育提供支持，包括GESP等级考试真题题库、信息学奥赛培训及中考科技特长生备考指导。

## 主要功能

- **多级别题库**：覆盖GESP一级到八级的全部考试内容
- **CSP竞赛题库**：包含CSP-J和CSP-S级别的信息学奥赛题目
- **知识点分类**：按知识点组织题目，便于针对性学习
- **在线练习**：支持在线做题，即时查看答案和解析
- **数学公式支持**：集成MathJax支持数学公式的显示
- **代码高亮**：使用highlight.js实现代码语法高亮
- **响应式设计**：适配不同设备的屏幕尺寸

## 技术栈

- 前端：HTML5, CSS3, JavaScript
- 数据存储：JSON文件
- 数学公式：MathJax
- 代码高亮：highlight.js
- 部署：Vercel

## 安装与使用

### 本地运行

1. 克隆仓库到本地
   ```
   git clone https://github.com/sharelgx/Gesp-Exam.git
   ```

2. 进入项目目录
   ```
   cd Gesp-Exam
   ```

3. 使用任意HTTP服务器启动项目，例如：
   ```
   # 如果安装了Node.js，可以使用http-server
   npx http-server -p 8000
   
   # 或者使用Python的内置HTTP服务器
   python -m http.server 8000
   ```

4. 在浏览器中访问 `http://localhost:8000` 即可使用

### 在线访问

访问 [https://gesp.free.nf/](https://gesp.free.nf/) 即可在线使用本平台。

## 项目结构

```
├── css/                  # 样式文件
├── data/                 # 题库数据
│   ├── level1/           # 一级题库
│   ├── level2/           # 二级题库
│   ├── ...
│   ├── cspj/             # CSP-J题库
│   └── csps/             # CSP-S题库
├── js/                   # JavaScript文件
│   ├── main.js           # 主要逻辑
│   ├── question-loader.js # 题目加载器
│   └── utils.js          # 工具函数
├── index.html            # 主页面
└── vercel.json           # Vercel部署配置
```

## 贡献指南

欢迎对本项目进行贡献！如果您有任何改进意见或发现了bug，请提交issue或pull request。

## 许可证

本项目采用MIT许可证，详情请参阅LICENSE文件。

## 联系方式

如有任何问题或建议，请联系元探索柳老师团队。

---

© 2025 元探索柳老师团队 版权所有