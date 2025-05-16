import sys
import base64
import chardet
import datetime
import os

class Utils:
    @staticmethod
    def RedirectStdoutToFile(logfile_path: str, also_print: bool = False):
        class Logger:
            def __init__(self, filepath, also_stdout):
                self.terminal = sys.stdout
                self.log = open(filepath, "a")
                self.also_stdout = also_stdout

            def write(self, message):
                self.log.write(message)
                if self.also_stdout:
                    self.terminal.write(message)

            def flush(self):
                self.log.flush()
                if self.also_stdout:
                    self.terminal.flush()

        sys.stdout = Logger(logfile_path, also_print)
        sys.stderr = sys.stdout  # Optional: also log errors

    @staticmethod
    def DecodeFromBase64(git_response):
        # Step 1: Extract the base64-encoded content from GitHub
        content_b64 = git_response.json().get('content', '')
        content_bytes = base64.b64decode(content_b64)

        # Step 2: Try using the encoding from the response if available
        if hasattr(git_response, 'encoding') and git_response.encoding:
            try:
                return content_bytes.decode(git_response.encoding)
            except UnicodeDecodeError:
                print(f"Failed to decode with reported encoding: {git_response.encoding}")

        # Step 3: Fallback to auto-detecting encoding using chardet
        detected = chardet.detect(content_bytes)
        encoding = detected.get("encoding", "utf-8")
        confidence = detected.get("confidence", 0)

        try:
            if encoding is None:
                encoding = "utf-8"
            return content_bytes.decode(encoding)
        except UnicodeDecodeError:
            print(f"Failed to decode with detected encoding: {encoding} (confidence: {confidence})")
            # As a last resort, ignore errors
            return content_bytes.decode("utf-8", errors="ignore")

    @staticmethod
    def GenerateTimestamp():
        now = datetime.datetime.now()
        timestamp = now.strftime("%Y%m%d_%H%M%S")
        return str(timestamp)


    @staticmethod
    def RemoveExtension(filename: str) -> str:
        return os.path.splitext(filename)[0]