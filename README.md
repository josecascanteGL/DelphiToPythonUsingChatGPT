# 🧠 Delphi Code Companion

A developer tool that parses Delphi source code from a GitHub repository and generates:

- 🔍 **Annotated Delphi code** with comments and improvement suggestions
- 🐍 **Parsed Python equivalents** of each file (currently literal translations only)

Additionally, it includes a UI for exploring the repository and interacting with the code through a chatbot assistant.

---

## 🚀 Features

- 📦 **Repository Analysis**  
  Clones a GitHub repo and scans its Delphi files (`.pas`, `.dpr`, etc.)

- 💡 **Comment Enrichment**  
  Adds inline comments and proposed refactors to help modernize or improve Delphi code.

- 🐍 **Python Conversion (Basic)**  
  Generates a Python version of each file with a 1-to-1 literal mapping.  
  *(Note: Current version does not yet consider project structure or dependencies.)*

- 🖥️ **Interactive UI**  
  - Browse the cloned repo
  - Load individual files
  - Ask questions or request refactors via a chatbot  
  *(Note: The original source file remains unchanged. Chatbot responses are displayed in a separate panel.)*

---

## 🛠️ Planned Improvements

- 🧱 Project-level parsing for better Python translation
- 🧩 Dependency resolution and modular understanding
- 🌐 Support for more source languages (beyond Delphi)

---

## 📸 Screenshots

*Coming soon*

---

## 📂 How to Use

1. Clone this repository
2. Run the main app
3. Enter a GitHub repo URL when prompted
4. Use the UI to explore and analyze your code

## 📂 Install dependencies and run API 
1. From the terminal, navigate to the scr folder
2. Run sudo pip install -r requirements.txt
3. Make sure to upload the secrets.json to the ./src/config folder
  3.1 The file should have a structure similar to this {
                                                         "openai_api_key":"xxxxx",
                                                         "github_api_key":"xxxxx"
                                                        }
5. To run the api **sudo uvicorn api:app --host 0.0.0.0 --port 80** change the port if needed
6. If you want to run the api in the background, use **sudo nohup uvicorn api:app --host 0.0.0.0 --port 80 > app.log 2>&1 &**
---

## 🤝 Contributing

Contributions are welcome! Especially if you're familiar with:

- Static analysis
- Delphi-to-Python translation
- UI/UX improvements

---

## 🧾 License

AGPL
