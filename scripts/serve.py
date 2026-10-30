"""Private, dependency-free static server with video seeking support."""
import argparse
import json
import mimetypes
import re
import shutil
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
PORT = 8766

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def allowed(self):
        path = unquote(urlsplit(self.path).path)
        if path in ('/', '/index.html', '/app.js', '/styles.css', '/data/catalog.js'):
            return True
        resolved = (ROOT / path.lstrip('/')).resolve()
        return path.startswith('/assets/') and resolved.is_relative_to(ROOT / 'assets') and resolved.suffix.lower() in ('.jpg','.jpeg','.png','.webp','.svg','.mp4')

    def do_GET(self):
        if urlsplit(self.path).path == '/health':
            body=json.dumps({'app':'verde-a-mano','version':1}).encode()
            self.send_response(200); self.send_header('Content-Type','application/json'); self.send_header('Content-Length',str(len(body))); self.end_headers(); self.wfile.write(body)
            return
        if not self.allowed():
            self.send_error(404); return
        super().do_GET()

    def do_HEAD(self):
        if not self.allowed(): self.send_error(404); return
        super().do_HEAD()

    def do_POST(self):
        if self.path == '/shutdown' and self.headers.get('X-Verde-Local') == 'stop':
            self.send_response(204); self.end_headers()
            threading.Thread(target=self.server.shutdown, daemon=True).start()
        else:
            self.send_error(403)

    def send_head(self):
        path=Path(self.translate_path(self.path))
        if path.is_dir(): return super().send_head()
        if not path.is_file(): self.send_error(404); return None
        self._remaining=None
        file=path.open('rb')
        size=path.stat().st_size
        start,end=0,size-1
        range_header=self.headers.get('Range')
        if range_header:
            match=re.fullmatch(r'bytes=(\d*)-(\d*)',range_header.strip())
            if not match or not any(match.groups()):
                file.close();self.send_error(416);return None
            first,last=match.groups()
            if first:
                start=int(first);end=min(int(last),size-1) if last else size-1
            else:
                start=max(0,size-int(last))
            if start>=size or start>end:
                file.close();self.send_response(416);self.send_header('Content-Range',f'bytes */{size}');self.send_header('Content-Length','0');self.end_headers();return None
            self.send_response(206)
            self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
            file.seek(start)
            self._remaining=end-start+1
        else: self.send_response(200)
        self.send_header('Content-Type',mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
        self.send_header('Content-Length',str(end-start+1))
        self.send_header('Accept-Ranges','bytes')
        self.send_header('Cache-Control','no-cache')
        self.send_header('X-Content-Type-Options','nosniff')
        self.end_headers()
        return file

    def copyfile(self,source,output):
        try:
            remaining=getattr(self,'_remaining',None)
            if remaining is None: shutil.copyfileobj(source,output); return
            while remaining>0:
                chunk=source.read(min(65536,remaining))
                if not chunk: break
                output.write(chunk);remaining-=len(chunk)
        except (BrokenPipeError,ConnectionResetError,ConnectionAbortedError):
            pass

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--port',type=int,default=PORT);args=parser.parse_args()
    server=ThreadingHTTPServer(('127.0.0.1',args.port),Handler)
    print(f'Verde a mano: http://127.0.0.1:{args.port}',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
