# Netflix Clone - HTTP Server with Range Request support
# Required for HTML5 video streaming
# Run: python server.py

import http.server
import socketserver
import os
import re

PORT = 8000


class RangeRequestHandler(http.server.SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.1'

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Range, Content-Type')
        self.send_header('Accept-Ranges', 'bytes')
        super().end_headers()

    def do_GET(self):
        path = self.translate_path(self.path)

        if not os.path.isfile(path):
            return super().do_GET()

        ext = os.path.splitext(path)[1].lower()
        if ext not in ('.mp4', '.webm', '.ogg', '.m4v', '.mov'):
            return super().do_GET()

        range_header = self.headers.get('Range')
        file_size = os.path.getsize(path)

        if not range_header:
            self.send_response(200)
            self.send_header('Content-Type', 'video/mp4')
            self.send_header('Content-Length', str(file_size))
            self.end_headers()
            with open(path, 'rb') as f:
                self.wfile.write(f.read())
            return

        match = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if not match:
            self.send_error(400, 'Invalid Range')
            return

        start = int(match.group(1))
        end = int(match.group(2)) if match.group(2) else file_size - 1
        end = min(end, file_size - 1)

        if start >= file_size or start > end:
            self.send_error(416, 'Requested Range Not Satisfiable')
            return

        length = end - start + 1

        self.send_response(206)
        self.send_header('Content-Type', 'video/mp4')
        self.send_header('Content-Range', 'bytes ' + str(start) + '-' + str(end) + '/' + str(file_size))
        self.send_header('Content-Length', str(length))
        self.end_headers()

        with open(path, 'rb') as f:
            f.seek(start)
            remaining = length
            while remaining > 0:
                chunk = f.read(min(64 * 1024, remaining))
                if not chunk:
                    break
                try:
                    self.wfile.write(chunk)
                except (ConnectionResetError, BrokenPipeError):
                    return
                remaining -= len(chunk)


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == '__main__':
    with ThreadedHTTPServer(('0.0.0.0', PORT), RangeRequestHandler) as server:
        print('Netflix Clone server running at http://localhost:' + str(PORT))
        print('Range requests: ENABLED')
        print('Open: http://localhost:' + str(PORT) + '/index.html')
        print('Press Ctrl+C to stop')
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('Server stopped.')
