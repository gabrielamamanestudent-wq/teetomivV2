#!/usr/bin/env python3
"""
Start the Night Signal app on this computer.

    python start_app.py

Opens http://localhost:8000 in your browser. Use Chrome or Edge: "Live" mode
can then connect to the wearable by USB cable or Bluetooth (Web Serial).
Press Ctrl+C here to stop.
"""
import functools, http.server, os, threading, webbrowser

PORT = 8000
here = os.path.dirname(os.path.abspath(__file__))
handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=here)
server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler)
url = f"http://localhost:{PORT}/index.html"
print(f"Night Signal app running at {url}  (Ctrl+C to stop)")
threading.Timer(0.8, lambda: webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\nStopped.")
