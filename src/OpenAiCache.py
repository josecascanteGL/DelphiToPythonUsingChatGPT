import json
import os
import openai

class OpenAiCache:
    file_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # gets project root
    def __init__(self, api_key, cache_file="cache.json", history_file="history.json", model="gpt-4"):
        # Set your OpenAI API key
        openai.api_key = api_key
        self.model = model
        self.cache_file = cache_file
        self.history_file = history_file
        

        # Load cache and history from file if they exist
        self.cache = self.LoadJson()
        self.history = self.LoadJson(default=[])

    def LoadJson(self, default=None):
        """Loads a JSON file if it exists, otherwise returns the default value."""
        if os.path.exists(f"{self.file_path}/{self.history_file}"):
            with open(f"{self.file_path}/{self.history_file}", "r", encoding="utf-8") as f:
                return json.load(f)
        return default if default is not None else []

    def SaveJson(self, data):
        """Saves a dictionary or list to a JSON file."""
        with open(f"{self.file_path}/{self.history_file}", "w", encoding="utf-8") as f:
            json.dump(data, f)

    def Ask(self, question):
        """Sends a question to ChatGPT and returns the response. Uses cache if available."""
        if question in self.cache:
            print("(From cache)")
            return self.cache[question]

        # Add user's question to the message history
        self.history.append({"role": "user", "content": question})

        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model=self.model,
            messages=self.history
        )

        response_text = response["choices"][0]["message"]["content"]

        # Save the assistant's reply to history and cache
        self.history.append({"role": "assistant", "content": response_text})
        self.cache[question] = response_text

        return response_text

    def SaveState(self):
        """Saves both the cache and the history to their respective JSON files."""
        self.SaveJson(self.cache)
        self.SaveJson(self.history)
